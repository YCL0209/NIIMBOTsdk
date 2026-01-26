/**
 * 精臣條碼打印機 - 簡化版
 */

import {
  JingchenPrinter,
  BarcodePrinter,
  BarcodeType,
  ConnectionType,
  EventType,
  MDParser,
  PrintJob,
  LabelTemplates,
  ProductData,
  Order
} from '../src/index';

// 全局實例
let printer: JingchenPrinter;
let barcodePrinter: BarcodePrinter;

// 日志
function log(message: string) {
  const logArea = document.getElementById('logArea');
  if (logArea) {
    const time = new Date().toLocaleTimeString();
    logArea.innerHTML = `[${time}] ${message}<br>` + logArea.innerHTML;
  }
  console.log(message);
}

// 更新狀態
function updateStatus(text: string, isConnected: boolean, showRescan: boolean = false) {
  const status = document.getElementById('status');
  const rescanBtn = document.getElementById('rescanBtn');
  if (status) {
    status.textContent = text;
    status.className = 'status' + (isConnected ? ' connected' : '');
  }
  if (rescanBtn) {
    rescanBtn.style.display = showRescan ? 'block' : 'none';
  }
}

// 自動連接
async function autoConnect() {
  try {
    log('正在連接打印服務...');
    await printer.connectService();
    log('服務已連接，正在掃描打印機...');

    const printers = await printer.scanUSBPrinters();

    if (printers.length === 0) {
      updateStatus('未找到打印機', false, true);
      log('未找到 USB 打印機，請確認打印機已連接後點擊重新掃描');
      return;
    }

    const first = printers[0];
    log(`找到打印機: ${first.printerName}，正在連接...`);

    await printer.connectPrinter(ConnectionType.USB, first.printerName, first.port);
    updateStatus(`已連接: ${first.printerName}`, true);
    log('打印機連接成功！');

  } catch (error: any) {
    updateStatus('連接失敗', false);
    log(`錯誤: ${error.message}`);
  }
}

// 打印條碼
async function printBarcode() {
  try {
    const type = parseInt((document.getElementById('barcodeType') as HTMLSelectElement).value) as BarcodeType;
    const content = (document.getElementById('barcodeContent') as HTMLInputElement).value.trim();
    const labelWidth = parseInt((document.getElementById('labelWidth') as HTMLInputElement).value);
    const labelHeight = parseInt((document.getElementById('labelHeight') as HTMLInputElement).value);

    if (!content) {
      log('請輸入條碼內容');
      return;
    }

    log(`正在打印: ${content}`);

    await barcodePrinter.quickPrint({
      content,
      type,
      labelWidth,
      labelHeight
    });

    log('打印成功！');
  } catch (error: any) {
    log(`打印失敗: ${error.message}`);
  }
}

// 預覽條碼
async function previewBarcode() {
  try {
    const type = parseInt((document.getElementById('barcodeType') as HTMLSelectElement).value) as BarcodeType;
    const content = (document.getElementById('barcodeContent') as HTMLInputElement).value.trim();
    const labelWidth = parseInt((document.getElementById('labelWidth') as HTMLInputElement).value);
    const labelHeight = parseInt((document.getElementById('labelHeight') as HTMLInputElement).value);

    if (!content) {
      log('請輸入條碼內容');
      return;
    }

    log('正在生成預覽...');

    const base64 = await barcodePrinter.quickPreview({
      content,
      type,
      labelWidth,
      labelHeight
    });

    const previewArea = document.getElementById('previewArea');
    if (previewArea) {
      previewArea.innerHTML = `<img src="data:image/png;base64,${base64}" alt="預覽">`;
    }

    log('預覽已生成');
  } catch (error: any) {
    log(`預覽失敗: ${error.message}`);
  }
}

// 初始化
function init() {
  printer = new JingchenPrinter();
  barcodePrinter = new BarcodePrinter(printer);

  // 事件監聽
  printer.on(EventType.SERVICE_DISCONNECTED, () => {
    updateStatus('服務已斷開', false);
    log('打印服務已斷開');
  });

  printer.on(EventType.PRINTER_DISCONNECTED, () => {
    updateStatus('打印機已斷開', false);
    log('打印機已斷開');
  });

  // 自動連接
  autoConnect();
}

// 重新掃描
async function rescan() {
  log('重新掃描打印機...');
  updateStatus('掃描中...', false, false);
  await autoConnect();
}

// ========== 批量列印功能 ==========

// 儲存解析結果
let parsedData: { type: 'orders'; data: Order[] } | { type: 'products'; data: ProductData[] } | null = null;

// 切換分頁
function switchTab(tab: 'single' | 'batch') {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  document.querySelector(`.tab:nth-child(${tab === 'single' ? 1 : 2})`)?.classList.add('active');
  document.getElementById(`tab-${tab}`)?.classList.add('active');
}

// 處理檔案選擇
function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  const fileUpload = document.getElementById('fileUpload');
  const fileName = document.getElementById('fileName');

  if (fileName) fileName.textContent = file.name;
  if (fileUpload) fileUpload.classList.add('has-file');

  log(`已選擇檔案: ${file.name}`);

  // 讀取檔案
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    parseFile(content);
  };
  reader.readAsText(file);
}

// 解析檔案
function parseFile(content: string) {
  try {
    parsedData = MDParser.parse(content);

    const resultDiv = document.getElementById('parseResult');
    const summaryDiv = document.getElementById('parseSummary');
    const itemsDiv = document.getElementById('parseItems');
    const printBtn = document.getElementById('batchPrintBtn') as HTMLButtonElement;

    if (!resultDiv || !summaryDiv || !itemsDiv) return;

    resultDiv.style.display = 'block';

    if (parsedData.type === 'products') {
      // 純產品模式
      const products = parsedData.data;
      summaryDiv.textContent = `解析結果：${products.length} 筆產品，將列印 ${products.length} 張標籤`;

      itemsDiv.innerHTML = products.map(p => `
        <div class="parse-item">
          <div class="no">${p.productNo}</div>
          <div class="name">${p.productName}</div>
          <div class="spec">${p.productSpec}</div>
        </div>
      `).join('');

      log(`解析成功：${products.length} 筆產品`);
    } else {
      // 訂單模式
      const orders = parsedData.data;
      const totalLabels = MDParser.countLabels(orders, true);
      summaryDiv.textContent = `解析結果：${orders.length} 筆訂單，將列印 ${totalLabels} 張標籤`;

      itemsDiv.innerHTML = orders.map(o => `
        <div class="parse-item">
          <div class="no">單號: ${o.orderNo}</div>
          <div class="name">${o.products.length} 個產品</div>
        </div>
      `).join('');

      log(`解析成功：${orders.length} 筆訂單，共 ${totalLabels} 張標籤`);
    }

    if (printBtn) printBtn.disabled = false;

  } catch (error: any) {
    log(`解析失敗: ${error.message}`);
    parsedData = null;
  }
}

// 清除檔案
function clearFile() {
  parsedData = null;

  const input = document.getElementById('mdFile') as HTMLInputElement;
  const fileUpload = document.getElementById('fileUpload');
  const fileName = document.getElementById('fileName');
  const resultDiv = document.getElementById('parseResult');
  const printBtn = document.getElementById('batchPrintBtn') as HTMLButtonElement;

  if (input) input.value = '';
  if (fileName) fileName.textContent = '';
  if (fileUpload) fileUpload.classList.remove('has-file');
  if (resultDiv) resultDiv.style.display = 'none';
  if (printBtn) printBtn.disabled = true;

  log('已清除檔案');
}

// 更新進度條
function updateProgress(current: number, total: number) {
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');

  if (progressBar && progressFill) {
    progressBar.style.display = 'block';
    const percent = Math.round((current / total) * 100);
    progressFill.style.width = `${percent}%`;
  }
}

// 批量列印
async function batchPrint() {
  if (!parsedData) {
    log('請先選擇檔案');
    return;
  }

  const printBtn = document.getElementById('batchPrintBtn') as HTMLButtonElement;
  if (printBtn) printBtn.disabled = true;

  try {
    if (parsedData.type === 'products') {
      await printProducts(parsedData.data);
    } else {
      await printOrders(parsedData.data);
    }
  } catch (error: any) {
    log(`批量列印失敗: ${error.message}`);
  } finally {
    if (printBtn) printBtn.disabled = false;
    const progressBar = document.getElementById('progressBar');
    if (progressBar) progressBar.style.display = 'none';
  }
}

// 列印產品標籤
async function printProducts(products: ProductData[]) {
  log(`開始列印 ${products.length} 張產品標籤...`);

  const job = await PrintJob.create(printer, {
    count: products.length,
    labelWidth: 50,
    labelHeight: 30
  });

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    updateProgress(i + 1, products.length);
    log(`列印 (${i + 1}/${products.length}): ${p.productNo}`);

    await job.printLabel(async () => {
      await LabelTemplates.productLabel(printer, p.productNo, p.productName, p.productSpec);
    });
  }

  await job.end();
  log(`批量列印完成！共 ${products.length} 張標籤`);
}

// 列印訂單標籤
async function printOrders(orders: Order[]) {
  const totalLabels = MDParser.countLabels(orders, true);
  log(`開始列印 ${totalLabels} 張標籤（${orders.length} 筆訂單）...`);

  const job = await PrintJob.create(printer, {
    count: totalLabels,
    labelWidth: 50,
    labelHeight: 30
  });

  let printed = 0;

  for (const order of orders) {
    // 列印單號標籤
    printed++;
    updateProgress(printed, totalLabels);
    log(`列印單號: ${order.orderNo}`);

    await job.printLabel(async () => {
      await LabelTemplates.orderLabel(printer, order.orderNo);
    });

    // 列印產品標籤
    for (const p of order.products) {
      printed++;
      updateProgress(printed, totalLabels);
      log(`列印產品: ${p.productNo}`);

      await job.printLabel(async () => {
        await LabelTemplates.productLabel(printer, p.productNo, p.productName, p.productSpec);
      });
    }
  }

  await job.end();
  log(`批量列印完成！共 ${totalLabels} 張標籤`);
}

// 暴露到全局
(window as any).printBarcode = printBarcode;
(window as any).previewBarcode = previewBarcode;
(window as any).rescan = rescan;
(window as any).switchTab = switchTab;
(window as any).handleFileSelect = handleFileSelect;
(window as any).clearFile = clearFile;
(window as any).batchPrint = batchPrint;

// 啟動
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
