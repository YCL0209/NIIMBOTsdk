/**
 * 精臣打印机 TypeScript 模块测试
 */

import {
  JingchenPrinter,
  BarcodeHelper,
  BarcodePrinter,
  CommonBarcodes,
  BarcodeType,
  ConnectionType,
  EventType,
  PrinterInfo,
  RotateAngle,
  QRCodeType
} from '../src/index';

// 全局变量
let printer: JingchenPrinter;
let barcodePrinter: BarcodePrinter;
let currentPrinters: PrinterInfo[] = [];
let shouldStopPrinting: boolean = false;  // 列印終止旗標

// 日志工具
function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const logArea = document.getElementById('logArea');
  if (!logArea) return;

  const timestamp = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${timestamp}] ${message}`;

  logArea.appendChild(entry);
  logArea.scrollTop = logArea.scrollHeight;

  console.log(`[${type.toUpperCase()}] ${message}`);
}

function clearLog() {
  const logArea = document.getElementById('logArea');
  if (logArea) {
    logArea.innerHTML = '';
  }
}

// 顯示/隱藏停止按鈕
function showStopButton(show: boolean) {
  const stopBtn = document.getElementById('stopBtn');
  if (stopBtn) {
    stopBtn.style.display = show ? 'inline-block' : 'none';
  }
}

// 終止列印
function stopPrinting() {
  shouldStopPrinting = true;
  log('用戶請求終止列印...', 'warn');
  showStopButton(false);
}

// 更新状态显示
function updateServiceStatus(connected: boolean) {
  const statusEl = document.getElementById('serviceStatus');
  if (statusEl) {
    statusEl.textContent = connected ? '服务已连接' : '服务未连接';
    statusEl.className = `status ${connected ? 'connected' : 'disconnected'}`;
  }
}

function updatePrinterStatus(connected: boolean) {
  const statusEl = document.getElementById('printerStatus');
  if (statusEl) {
    statusEl.textContent = connected ? '打印机已连接' : '打印机未连接';
    statusEl.className = `status ${connected ? 'connected' : 'disconnected'}`;
  }
}

// ==================== 连接管理 ====================

async function connectService() {
  try {
    log('正在连接打印服务...', 'info');
    await printer.connectService();
    log('打印服务连接成功!', 'success');
    updateServiceStatus(true);
  } catch (error: any) {
    log(`连接打印服务失败: ${error.message}`, 'error');
    updateServiceStatus(false);
  }
}

function disconnectService() {
  printer.disconnectService();
  log('已断开打印服务', 'warn');
  updateServiceStatus(false);
  updatePrinterStatus(false);
}

// ==================== SDK 初始化（可选）====================

/**
 * 初始化 SDK（可选功能）
 * 注意：此步骤是可选的，仅在需要配置字体目录等高级功能时调用
 * 大部分打印操作（包括扫描打印机、打印条码）都不需要调用此方法
 */
async function initSDK() {
  try {
    log('正在初始化SDK...（可选操作）', 'info');
    await printer.initSDK();
    log('SDK 初始化成功!', 'success');

    // 等待 2 秒让打印机完全准备好
    log('等待打印机准备就绪...', 'info');
    await new Promise(resolve => setTimeout(resolve, 2000));
    log('打印机已准备就绪', 'success');
  } catch (error: any) {
    log(`SDK 初始化失败: ${error.message}`, 'warn');
    log('注意: SDK 初始化失败不影响正常打印功能', 'info');
  }
}

// ==================== 打印机扫描 ====================

async function scanUSBPrinters() {
  try {
    log('正在扫描USB打印机...', 'info');
    currentPrinters = await printer.scanUSBPrinters();
    log(`找到 ${currentPrinters.length} 台USB打印机`, 'success');
    displayPrinterList(currentPrinters, ConnectionType.USB);
  } catch (error: any) {
    log(`扫描USB打印机失败: ${error.message}`, 'error');
  }
}

async function scanWiFiPrinters() {
  try {
    log('正在扫描WiFi打印机（需要约20秒）...', 'info');
    currentPrinters = await printer.scanWiFiPrinters();
    log(`找到 ${currentPrinters.length} 台WiFi打印机`, 'success');
    displayPrinterList(currentPrinters, ConnectionType.WIFI);
  } catch (error: any) {
    log(`扫描WiFi打印机失败: ${error.message}`, 'error');
  }
}

function displayPrinterList(printers: PrinterInfo[], type: ConnectionType) {
  const listEl = document.getElementById('printerList');
  if (!listEl) return;

  if (printers.length === 0) {
    listEl.innerHTML = '<p style="color: #999; font-size: 14px;">未找到打印机</p>';
    return;
  }

  let html = '<div style="margin-top: 10px;">';
  printers.forEach((p, index) => {
    html += `
      <div style="padding: 10px; margin-bottom: 8px; background: #f5f5f5; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${p.printerName}</strong>
          <span style="color: #666; margin-left: 10px;">端口: ${p.port}</span>
        </div>
        <button class="btn-primary" onclick="connectPrinterByIndex(${index}, '${type}')">连接</button>
      </div>
    `;
  });
  html += '</div>';

  listEl.innerHTML = html;
}

async function connectPrinterByIndex(index: number, type: ConnectionType) {
  const printerInfo = currentPrinters[index];
  if (!printerInfo) {
    log('打印机信息无效', 'error');
    return;
  }

  try {
    log(`正在连接打印机: ${printerInfo.printerName}...`, 'info');
    await printer.connectPrinter(type, printerInfo.printerName, printerInfo.port);
    log(`打印机连接成功: ${printerInfo.printerName}`, 'success');
    updatePrinterStatus(true);
  } catch (error: any) {
    log(`连接打印机失败: ${error.message}`, 'error');
  }
}

// ==================== 条码打印 ====================

async function printBarcode() {
  try {
    const type = parseInt((document.getElementById('barcodeType') as HTMLSelectElement).value) as BarcodeType;
    const content = (document.getElementById('barcodeContent') as HTMLInputElement).value;
    const labelWidth = parseInt((document.getElementById('labelWidth') as HTMLInputElement).value);
    const labelHeight = parseInt((document.getElementById('labelHeight') as HTMLInputElement).value);

    if (!content) {
      log('请输入条码内容', 'warn');
      return;
    }

    log(`正在打印条码: ${content}`, 'info');

    // 使用 BarcodePrinter 快速打印
    await barcodePrinter.quickPrint({
      content,
      type,
      labelWidth,
      labelHeight
    });

    log('条码打印成功!', 'success');
  } catch (error: any) {
    log(`打印失败: ${error.message}`, 'error');
  }
}

async function previewBarcode() {
  try {
    const type = parseInt((document.getElementById('barcodeType') as HTMLSelectElement).value) as BarcodeType;
    const content = (document.getElementById('barcodeContent') as HTMLInputElement).value;
    const labelWidth = parseInt((document.getElementById('labelWidth') as HTMLInputElement).value);
    const labelHeight = parseInt((document.getElementById('labelHeight') as HTMLInputElement).value);

    if (!content) {
      log('请输入条码内容', 'warn');
      return;
    }

    log(`正在生成预览: ${content}`, 'info');

    const base64Image = await barcodePrinter.quickPreview({
      content,
      type,
      labelWidth,
      labelHeight
    });

    const previewArea = document.getElementById('previewArea');
    if (previewArea) {
      previewArea.innerHTML = `<img src="data:image/png;base64,${base64Image}" alt="条码预览" />`;
    }

    log('预览生成成功!', 'success');
  } catch (error: any) {
    log(`预览失败: ${error.message}`, 'error');
  }
}

// ==================== 快速打印示例 ====================

async function quickPrintCODE128() {
  try {
    log('正在快速打印 CODE128 条码...', 'info');

    const config = CommonBarcodes.code128('DEMO-12345', 40, 20);
    await barcodePrinter.quickPrint(config);

    log('CODE128 条码打印成功!', 'success');
  } catch (error: any) {
    log(`打印失败: ${error.message}`, 'error');
  }
}

async function quickPrintEAN13() {
  try {
    log('正在快速打印 EAN13 条码...', 'info');

    const config = CommonBarcodes.ean13('6901234567892', 40, 20);
    await barcodePrinter.quickPrint(config);

    log('EAN13 条码打印成功!', 'success');
  } catch (error: any) {
    log(`打印失败: ${error.message}`, 'error');
  }
}

async function batchPrint() {
  try {
    log('正在批量打印条码...', 'info');

    const contents = ['BATCH-001', 'BATCH-002', 'BATCH-003'];
    await barcodePrinter.batchPrint(contents, {
      type: BarcodeType.CODE128,
      labelWidth: 40,
      labelHeight: 20
    });

    log('批量打印完成!', 'success');
  } catch (error: any) {
    log(`批量打印失败: ${error.message}`, 'error');
  }
}

// ==================== 產品標籤打印 ====================

async function printProductLabel() {
  try {
    const productNo = (document.getElementById('productNo') as HTMLInputElement).value;
    const productName = (document.getElementById('productName') as HTMLInputElement).value;
    const productSpec = (document.getElementById('productSpec') as HTMLInputElement).value;

    if (!productNo || !productName || !productSpec) {
      log('請輸入完整的產品信息', 'warn');
      return;
    }

    log(`正在打印產品標籤...`, 'info');

    // 確保 SDK 已初始化
    if (!(printer as any).isSdkInitialized) {
      await printer.initSDK();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 1. 開始打印任務（count=2 繞過 SDK count=1 的 bug）
    await printer.startJob(3, 1, 1, 2);

    // 2. 第一張：佔位標籤（吸收 SDK bug）
    await drawTestLabel('header');
    await printer.commitJob(1);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. 第二張：真正的產品標籤
    await drawProductLabel(productNo, productName, productSpec);
    await printer.commitJob(1);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. 結束任務
    await printer.endJob();

    log('產品標籤打印成功!', 'success');
  } catch (error: any) {
    log(`打印失敗: ${error.message}`, 'error');
  }
}

// ==================== MD 檔案解析與批量打印 ====================

interface ProductData {
  productNo: string;
  productName: string;
  productSpec: string;
}

interface Order {
  orderNo: string;
  products: ProductData[];
}

/**
 * 從 MD 檔案內容解析產品資料（舊版，保留向後兼容）
 */
function parseMDProducts(mdContent: string): ProductData[] {
  const products: ProductData[] = [];
  const lines = mdContent.split('\n');

  let currentProduct: Partial<ProductData> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('品號:')) {
      currentProduct.productNo = trimmed.replace('品號:', '').trim();
    } else if (trimmed.startsWith('品名:')) {
      currentProduct.productName = trimmed.replace('品名:', '').trim();
    } else if (trimmed.startsWith('規格:')) {
      currentProduct.productSpec = trimmed.replace('規格:', '').trim();

      // 當三個欄位都有了，就加入產品列表
      if (currentProduct.productNo && currentProduct.productName && currentProduct.productSpec) {
        products.push(currentProduct as ProductData);
        currentProduct = {};
      }
    }
  }

  return products;
}

/**
 * 從 MD 檔案內容解析訂單與產品（新版，支持單號）
 */
function parseMDOrders(mdContent: string): Order[] {
  const orders: Order[] = [];
  const lines = mdContent.split('\n');

  let currentOrder: Order | null = null;
  let currentProduct: Partial<ProductData> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    // 識別單號（支持兩種格式：## 單號: XXX 或 ## XXX）
    if (trimmed.startsWith('## 單號:') || (trimmed.startsWith('## ') && !trimmed.startsWith('### '))) {
      // 保存前一個產品
      if (currentProduct.productNo && currentProduct.productName && currentProduct.productSpec && currentOrder) {
        currentOrder.products.push(currentProduct as ProductData);
        currentProduct = {};
      }

      // 保存前一個訂單
      if (currentOrder && currentOrder.products.length > 0) {
        orders.push(currentOrder);
      }

      // 創建新訂單
      const orderNo = trimmed.replace('## 單號:', '').replace('##', '').trim();
      currentOrder = { orderNo, products: [] };
    }
    // 識別產品數據
    else if (trimmed.startsWith('品號:')) {
      // 保存前一個產品
      if (currentProduct.productNo && currentProduct.productName && currentProduct.productSpec && currentOrder) {
        currentOrder.products.push(currentProduct as ProductData);
      }
      currentProduct = { productNo: trimmed.replace('品號:', '').trim() };
    } else if (trimmed.startsWith('品名:')) {
      currentProduct.productName = trimmed.replace('品名:', '').trim();
    } else if (trimmed.startsWith('規格:')) {
      currentProduct.productSpec = trimmed.replace('規格:', '').trim();
    }
  }

  // 保存最後一個產品
  if (currentProduct.productNo && currentProduct.productName && currentProduct.productSpec && currentOrder) {
    currentOrder.products.push(currentProduct as ProductData);
  }

  // 保存最後一個訂單
  if (currentOrder && currentOrder.products.length > 0) {
    orders.push(currentOrder);
  }

  return orders;
}

/**
 * 用 4 條線畫矩形（繞過 drawGraph graphType:3 的底線消失 bug）
 */
async function drawRectangleWithLines(x: number, y: number, width: number, height: number, lineWidth: number = 0.5) {
  // 強制 height 在 width 前面（與原廠 demo JSON 順序一致）
  // 水平線：height = 粗細, width = 長度
  const topLine = { x, y, height: lineWidth, width, rotate: 0, lineType: 1, dashwidth: [1, 1] as [number, number] };
  const bottomLine = { x, y: y + height - lineWidth, height: lineWidth, width, rotate: 0, lineType: 1, dashwidth: [1, 1] as [number, number] };

  // 垂直線：height = 長度, width = 粗細
  const leftLine = { x, y, height, width: lineWidth, rotate: 0, lineType: 1, dashwidth: [1, 1] as [number, number] };
  const rightLine = { x: x + width - lineWidth, y, height, width: lineWidth, rotate: 0, lineType: 1, dashwidth: [1, 1] as [number, number] };

  // 每個 drawLine 後加 100ms 延遲，模擬原廠 callback 等待
  await printer.drawLine(topLine);
  await new Promise(resolve => setTimeout(resolve, 100));
  await printer.drawLine(bottomLine);
  await new Promise(resolve => setTimeout(resolve, 100));
  await printer.drawLine(leftLine);
  await new Promise(resolve => setTimeout(resolve, 100));
  await printer.drawLine(rightLine);
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * 單個產品標籤的繪製邏輯（三個獨立 drawText，避免 \n 換行導致的 SDK 異常）
 */
async function drawProductLabel(productNo: string, productName: string, productSpec: string) {
  // 初始化畫板（50mm × 30mm）
  await printer.initBoard({
    width: 50,
    height: 30,
    rotate: RotateAngle.ROTATE_0,
    path: 'ZT001.ttf',
    verticalShift: 0,
    HorizontalShift: 0
  });

  // 繪製外框矩形（用 4 條線，繞過 SDK bug）
  // 高度 25mm，底部邊距 3mm 避免截斷
  await drawRectangleWithLines(2, 2, 46, 25, 0.5);

  // 第一行：品號（字體放大到 3.0mm）
  await printer.drawText({
    x: 3,
    y: 4,
    height: 7,
    width: 44,
    value: `品號：${productNo}`,
    fontFamily: '宋体',
    fontSize: 3.0,
    rotate: RotateAngle.ROTATE_0,
    fontStyle: [false, false, false, false],
    textAlignHorizonral: 0,  // 左對齊
    textAlignVertical: 1,
    letterSpacing: 0.0,
    lineSpacing: 1.0,
    lineMode: 6
  });
  await new Promise(resolve => setTimeout(resolve, 100));

  // 第二行：品名
  await printer.drawText({
    x: 3,
    y: 11,
    height: 7,
    width: 44,
    value: `品名：${productName}`,
    fontFamily: '宋体',
    fontSize: 3.0,
    rotate: RotateAngle.ROTATE_0,
    fontStyle: [false, false, false, false],
    textAlignHorizonral: 0,  // 左對齊
    textAlignVertical: 1,
    letterSpacing: 0.0,
    lineSpacing: 1.0,
    lineMode: 6
  });
  await new Promise(resolve => setTimeout(resolve, 100));

  // 第三行：規格
  await printer.drawText({
    x: 3,
    y: 18,
    height: 7,
    width: 44,
    value: `規格：${productSpec}`,
    fontFamily: '宋体',
    fontSize: 3.0,
    rotate: RotateAngle.ROTATE_0,
    fontStyle: [false, false, false, false],
    textAlignHorizonral: 0,  // 左對齊
    textAlignVertical: 1,
    letterSpacing: 0.0,
    lineSpacing: 1.0,
    lineMode: 6
  });
  await new Promise(resolve => setTimeout(resolve, 100));

  // 等待 SDK 完成異步處理（修復第二張標籤底線問題）
  await new Promise(resolve => setTimeout(resolve, 300));
}

// ==================== 合併標籤（單號+產品）====================

/**
 * 4 行版本：單號、品號、品名、規格
 */
async function drawCombinedLabel4Lines(orderNo: string, productNo: string, productName: string, productSpec: string) {
  // 初始化畫板（50mm × 30mm）
  await printer.initBoard({
    width: 50,
    height: 30,
    rotate: RotateAngle.ROTATE_0,
    path: 'ZT001.ttf',
    verticalShift: 0,
    HorizontalShift: 0
  });

  // 繪製外框矩形
  await drawRectangleWithLines(2, 2, 46, 25, 0.5);

  // 第一行：單號（大字體 3.5mm）
  await printer.drawText({
    x: 3,
    y: 3,
    height: 6,
    width: 44,
    value: `單號：${orderNo}`,
    fontFamily: '宋体',
    fontSize: 3.5,
    rotate: RotateAngle.ROTATE_0,
    fontStyle: [true, false, false, false],  // 加粗
    textAlignHorizonral: 0,
    textAlignVertical: 1,
    letterSpacing: 0.0,
    lineSpacing: 1.0,
    lineMode: 6
  });
  await new Promise(resolve => setTimeout(resolve, 100));

  // 第二行：品號（中字體 3.0mm）
  await printer.drawText({
    x: 3,
    y: 9,
    height: 5,
    width: 44,
    value: `品號：${productNo}`,
    fontFamily: '宋体',
    fontSize: 3.0,
    rotate: RotateAngle.ROTATE_0,
    fontStyle: [false, false, false, false],
    textAlignHorizonral: 0,
    textAlignVertical: 1,
    letterSpacing: 0.0,
    lineSpacing: 1.0,
    lineMode: 6
  });
  await new Promise(resolve => setTimeout(resolve, 100));

  // 第三行：品名（小字體 2.5mm）
  await printer.drawText({
    x: 3,
    y: 14,
    height: 5,
    width: 44,
    value: `品名：${productName}`,
    fontFamily: '宋体',
    fontSize: 2.5,
    rotate: RotateAngle.ROTATE_0,
    fontStyle: [false, false, false, false],
    textAlignHorizonral: 0,
    textAlignVertical: 1,
    letterSpacing: 0.0,
    lineSpacing: 1.0,
    lineMode: 6
  });
  await new Promise(resolve => setTimeout(resolve, 100));

  // 第四行：規格（小字體 2.5mm）
  await printer.drawText({
    x: 3,
    y: 19,
    height: 5,
    width: 44,
    value: `規格：${productSpec}`,
    fontFamily: '宋体',
    fontSize: 2.5,
    rotate: RotateAngle.ROTATE_0,
    fontStyle: [false, false, false, false],
    textAlignHorizonral: 0,
    textAlignVertical: 1,
    letterSpacing: 0.0,
    lineSpacing: 1.0,
    lineMode: 6
  });
  await new Promise(resolve => setTimeout(resolve, 100));

  await new Promise(resolve => setTimeout(resolve, 300));
}

/**
 * 3 行版本：單號、品號、品名+規格
 */
async function drawCombinedLabel3Lines(orderNo: string, productNo: string, productName: string, productSpec: string) {
  // 初始化畫板（50mm × 30mm）
  await printer.initBoard({
    width: 50,
    height: 30,
    rotate: RotateAngle.ROTATE_0,
    path: 'ZT001.ttf',
    verticalShift: 0,
    HorizontalShift: 0
  });

  // 繪製外框矩形
  await drawRectangleWithLines(2, 2, 46, 25, 0.5);

  // 第一行：單號（大字體 4.0mm）
  await printer.drawText({
    x: 3,
    y: 3,
    height: 7,
    width: 44,
    value: `單號：${orderNo}`,
    fontFamily: '宋体',
    fontSize: 4.0,
    rotate: RotateAngle.ROTATE_0,
    fontStyle: [true, false, false, false],  // 加粗
    textAlignHorizonral: 0,
    textAlignVertical: 1,
    letterSpacing: 0.0,
    lineSpacing: 1.0,
    lineMode: 6
  });
  await new Promise(resolve => setTimeout(resolve, 100));

  // 第二行：品號（中字體 3.0mm）
  await printer.drawText({
    x: 3,
    y: 10,
    height: 6,
    width: 44,
    value: `品號：${productNo}`,
    fontFamily: '宋体',
    fontSize: 3.0,
    rotate: RotateAngle.ROTATE_0,
    fontStyle: [false, false, false, false],
    textAlignHorizonral: 0,
    textAlignVertical: 1,
    letterSpacing: 0.0,
    lineSpacing: 1.0,
    lineMode: 6
  });
  await new Promise(resolve => setTimeout(resolve, 100));

  // 第三行：品名/規格（小字體 2.5mm）
  await printer.drawText({
    x: 3,
    y: 17,
    height: 6,
    width: 44,
    value: `${productName} / ${productSpec}`,
    fontFamily: '宋体',
    fontSize: 2.5,
    rotate: RotateAngle.ROTATE_0,
    fontStyle: [false, false, false, false],
    textAlignHorizonral: 0,
    textAlignVertical: 1,
    letterSpacing: 0.0,
    lineSpacing: 1.0,
    lineMode: 6
  });
  await new Promise(resolve => setTimeout(resolve, 100));

  await new Promise(resolve => setTimeout(resolve, 300));
}

/**
 * 測試打印合併標籤（4行版本）
 */
async function testCombinedLabel4Lines() {
  try {
    log('測試合併標籤（4行版本）...', 'info');

    if (!(printer as any).isSdkInitialized) {
      await printer.initSDK();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // count=2 繞過 SDK bug
    await printer.startJob(3, 1, 1, 2);

    // 第一張：佔位
    await drawTestLabel('header');
    await printer.commitJob(1);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 第二張：4行合併標籤
    await drawCombinedLabel4Lines(
      '5103-20251009010',
      'M02208-00012',
      'HRZVV-SB(2464)24AWG-10C',
      'QS001-0027'
    );
    await printer.commitJob(1);
    await new Promise(resolve => setTimeout(resolve, 1000));

    await printer.endJob();
    log('4行版本打印完成！', 'success');
  } catch (error: any) {
    log(`打印失敗: ${error.message}`, 'error');
  }
}

/**
 * 測試打印合併標籤（3行版本）
 */
async function testCombinedLabel3Lines() {
  try {
    log('測試合併標籤（3行版本）...', 'info');

    if (!(printer as any).isSdkInitialized) {
      await printer.initSDK();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // count=2 繞過 SDK bug
    await printer.startJob(3, 1, 1, 2);

    // 第一張：佔位
    await drawTestLabel('header');
    await printer.commitJob(1);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 第二張：3行合併標籤
    await drawCombinedLabel3Lines(
      '5103-20251009010',
      'M02208-00012',
      'HRZVV-SB(2464)24AWG-10C',
      'QS001-0027'
    );
    await printer.commitJob(1);
    await new Promise(resolve => setTimeout(resolve, 1000));

    await printer.endJob();
    log('3行版本打印完成！', 'success');
  } catch (error: any) {
    log(`打印失敗: ${error.message}`, 'error');
  }
}

/**
 * 4 行標籤模型
 * 佈局：單號（文字）/ 品號（條碼）/ 規格（文字）/ 待定
 */
async function drawCombinedLabelWithQR(orderNo: string, productNo: string, productName: string, productSpec: string) {
  // 初始化畫板（50mm × 30mm）
  await printer.initBoard({
    width: 50,
    height: 30,
    rotate: RotateAngle.ROTATE_0,
    path: 'ZT001.ttf',
    verticalShift: 0,
    HorizontalShift: 0
  });

  // 外框（2,2 到 48,27）
  await drawRectangleWithLines(2, 2, 46, 25, 0.5);

  // 橫線1：單號與品號條碼之間 (y=8)
  await printer.drawLine({ x: 2, y: 8, height: 0.3, width: 46, rotate: 0, lineType: 1, dashwidth: [1, 1] });
  await new Promise(resolve => setTimeout(resolve, 50));

  // 橫線2：品號條碼與規格之間 (y=16)
  await printer.drawLine({ x: 2, y: 16, height: 0.3, width: 46, rotate: 0, lineType: 1, dashwidth: [1, 1] });
  await new Promise(resolve => setTimeout(resolve, 50));

  // 橫線3：規格與第四行之間 (y=22)
  await printer.drawLine({ x: 2, y: 22, height: 0.3, width: 46, rotate: 0, lineType: 1, dashwidth: [1, 1] });
  await new Promise(resolve => setTimeout(resolve, 50));

  // 第一行：單號（文字）
  await printer.drawText({
    x: 3,
    y: 3,
    height: 5,
    width: 44,
    value: `單號：${orderNo}`,
    fontFamily: '宋体',
    fontSize: 3.0,
    rotate: RotateAngle.ROTATE_0,
    fontStyle: [true, false, false, false],
    textAlignHorizonral: 0,
    textAlignVertical: 1,
    letterSpacing: 0.0,
    lineSpacing: 1.0,
    lineMode: 6
  });
  await new Promise(resolve => setTimeout(resolve, 100));

  // 第二行：品號（一維條碼）- 掃描槍直接讀取
  await printer.drawBarcode({
    x: 3,
    y: 9,
    height: 6,
    width: 44,
    value: productNo,
    codeType: BarcodeType.CODE128,
    rotate: RotateAngle.ROTATE_0,
    fontSize: 2,
    textHeight: 0,  // 不顯示條碼下方文字
    textPosition: 0
  });
  await new Promise(resolve => setTimeout(resolve, 100));

  // 第三行：規格（文字）
  await printer.drawText({
    x: 3,
    y: 17,
    height: 5,
    width: 44,
    value: `規格：${productSpec}`,
    fontFamily: '宋体',
    fontSize: 2.8,
    rotate: RotateAngle.ROTATE_0,
    fontStyle: [false, false, false, false],
    textAlignHorizonral: 0,
    textAlignVertical: 1,
    letterSpacing: 0.0,
    lineSpacing: 1.0,
    lineMode: 6
  });
  await new Promise(resolve => setTimeout(resolve, 100));

  // 第四行：待定（目前留空）
  // TODO: 等確定第四行內容後再加

  await new Promise(resolve => setTimeout(resolve, 300));
}

/**
 * 測試打印合併標籤（帶 QR 碼版本）
 */
async function testCombinedLabelWithQR() {
  try {
    log('測試合併標籤（4行 + QR碼）...', 'info');

    if (!(printer as any).isSdkInitialized) {
      await printer.initSDK();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // count=2 繞過 SDK bug
    await printer.startJob(3, 1, 1, 2);

    // 第一張：佔位
    await drawTestLabel('header');
    await printer.commitJob(1);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 第二張：帶 QR 碼的合併標籤
    await drawCombinedLabelWithQR(
      '5103-20251009010',
      'M02208-00012',
      'HRZVV-SB(2464)24AWG-10C',
      'QS001-0027'
    );
    await printer.commitJob(1);
    await new Promise(resolve => setTimeout(resolve, 1000));

    await printer.endJob();
    log('帶 QR 碼版本打印完成！', 'success');
  } catch (error: any) {
    log(`打印失敗: ${error.message}`, 'error');
  }
}

/**
 * 預覽合併標籤（不列印，只生成預覽圖）
 */
async function previewCombinedLabel() {
  try {
    log('生成標籤預覽...', 'info');

    // 確保 SDK 已初始化
    if (!(printer as any).isSdkInitialized) {
      await printer.initSDK();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 繪製標籤（使用表單中的值）
    const orderNo = (document.getElementById('orderNo') as HTMLInputElement)?.value || '5103-20251009010';
    const productNo = (document.getElementById('productNo') as HTMLInputElement)?.value || 'M02208-00012';
    const productName = (document.getElementById('productName') as HTMLInputElement)?.value || 'HRZVV-SB(2464)24AWG-10C';
    const productSpec = (document.getElementById('productSpec') as HTMLInputElement)?.value || 'QS001-0027';

    // 繪製標籤內容
    await drawCombinedLabelWithQR(orderNo, productNo, productName, productSpec);

    // 生成預覽圖片（使用官方 API，displayScale=8 對應 200dpi）
    const base64Image = await printer.generateImagePreviewImage(8);

    // 顯示預覽
    const previewArea = document.getElementById('labelPreviewArea');
    if (previewArea) {
      previewArea.innerHTML = `<img src="data:image/png;base64,${base64Image}" alt="標籤預覽" style="max-width: 100%; border: 1px solid #ddd; border-radius: 4px;" />`;
    }

    log('預覽生成成功！', 'success');
  } catch (error: any) {
    log(`預覽失敗: ${error.message}`, 'error');
  }
}

// ==================== 診斷測試 ====================

/**
 * 診斷測試：完整複製批量打印流程
 */
async function testRectangleOnly() {
  try {
    log('開始診斷測試：複製批量打印流程（頁首 + 單號）...', 'info');

    if (!(printer as any).isSdkInitialized) {
      await printer.initSDK();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // startJob - count=2（兩張標籤）
    await printer.startJob(3, 1, 1, 2);
    log('startJob count=2', 'info');

    // 第一張：頁首測試標籤
    await drawTestLabel('header');
    await printer.commitJob(1);
    await new Promise(resolve => setTimeout(resolve, 1000));
    log('第一張：頁首測試標籤已提交', 'info');

    // 第二張：單號標籤
    await drawOrderNoLabel('TEST-001');
    await printer.commitJob(1);
    await new Promise(resolve => setTimeout(resolve, 1000));
    log('第二張：單號標籤已提交', 'info');

    await printer.endJob();

    log('測試完成！檢查兩張標籤的矩形是否四邊完整。', 'success');
  } catch (error: any) {
    log(`測試失敗: ${error.message}`, 'error');
  }
}

/**
 * 單號標籤的繪製邏輯
 */
async function drawOrderNoLabel(orderNo: string) {
  // 初始化畫板（50mm × 30mm）
  await printer.initBoard({
    width: 50,
    height: 30,
    rotate: RotateAngle.ROTATE_0,
    path: 'ZT001.ttf',
    verticalShift: 0,
    HorizontalShift: 0
  });

  // 繪製外框矩形（用 4 條線，繞過 SDK bug）
  // 高度 25mm，底部邊距 3mm 避免截斷
  await drawRectangleWithLines(2, 2, 46, 25, 0.5);

  // 繪製標題 "單號"（height 在 width 前面，與原廠 SDK 一致）
  await printer.drawText({
    x: 2,
    y: 4,
    height: 8,
    width: 46,
    value: '單號',
    fontFamily: '宋体',
    fontSize: 5,
    rotate: RotateAngle.ROTATE_0,
    fontStyle: [true, false, false, false],  // 加粗
    textAlignHorizonral: 1,  // 居中
    textAlignVertical: 1,
    letterSpacing: 0.0,
    lineSpacing: 1.0,
    lineMode: 6
  });
  // 每個 drawText 後加 100ms 延遲，模擬原廠 callback 等待
  await new Promise(resolve => setTimeout(resolve, 100));

  // 繪製單號內容（大字體）
  await printer.drawText({
    x: 2,
    y: 14,
    height: 12,
    width: 46,
    value: orderNo,
    fontFamily: '宋体',
    fontSize: 8,
    rotate: RotateAngle.ROTATE_0,
    fontStyle: [true, false, false, false],  // 加粗
    textAlignHorizonral: 1,  // 居中
    textAlignVertical: 1,
    letterSpacing: 0.0,
    lineSpacing: 1.0,
    lineMode: 6
  });
  await new Promise(resolve => setTimeout(resolve, 100));

  // 等待 SDK 完成異步處理（修復第二張標籤底線問題）
  await new Promise(resolve => setTimeout(resolve, 300));
}

/**
 * 測試標籤的繪製邏輯（頁首/頁尾測試）
 * 改成三行文字，測試是否是行數導致底線消失
 */
async function drawTestLabel(position: 'header' | 'footer') {
  // 初始化畫板（50mm × 30mm）
  await printer.initBoard({
    width: 50,
    height: 30,
    rotate: RotateAngle.ROTATE_0,
    path: 'ZT001.ttf',
    verticalShift: 0,
    HorizontalShift: 0
  });

  // 繪製外框矩形（用 4 條線，繞過 SDK bug）
  // 高度 25mm，底部邊距 3mm 避免截斷
  await drawRectangleWithLines(2, 2, 46, 25, 0.5);

  // 第一行文字（模擬 drawProductLabel 的結構）
  await printer.drawText({
    x: 2,
    y: 4,
    height: 6,
    width: 46,
    value: '品號：第一行測試',
    fontFamily: '宋体',
    fontSize: 2.3,
    rotate: RotateAngle.ROTATE_0,
    fontStyle: [false, false, false, false],
    textAlignHorizonral: 1,
    textAlignVertical: 1,
    letterSpacing: 0.0,
    lineSpacing: 1.0,
    lineMode: 6
  });
  await new Promise(resolve => setTimeout(resolve, 100));

  // 第二行文字
  await printer.drawText({
    x: 2,
    y: 11,
    height: 6,
    width: 46,
    value: '品名：第二行測試',
    fontFamily: '宋体',
    fontSize: 2.3,
    rotate: RotateAngle.ROTATE_0,
    fontStyle: [false, false, false, false],
    textAlignHorizonral: 1,
    textAlignVertical: 1,
    letterSpacing: 0.0,
    lineSpacing: 1.0,
    lineMode: 6
  });
  await new Promise(resolve => setTimeout(resolve, 100));

  // 第三行文字
  const testText = position === 'header' ? '規格：頁首測試' : '規格：頁尾測試';
  await printer.drawText({
    x: 2,
    y: 18,
    height: 6,
    width: 46,
    value: testText,
    fontFamily: '宋体',
    fontSize: 2.3,
    rotate: RotateAngle.ROTATE_0,
    fontStyle: [false, false, false, false],
    textAlignHorizonral: 1,
    textAlignVertical: 1,
    letterSpacing: 0.0,
    lineSpacing: 1.0,
    lineMode: 6
  });
  await new Promise(resolve => setTimeout(resolve, 100));

  // 等待 SDK 完成異步處理（修復第二張標籤底線問題）
  await new Promise(resolve => setTimeout(resolve, 300));
}

/**
 * 批量打印產品標籤
 */
async function batchPrintProductLabels(products: ProductData[], printCount: number = 1) {
  try {
    log(`正在批量打印 ${products.length} 個產品標籤（含頭尾測試標籤）...`, 'info');
    shouldStopPrinting = false;
    showStopButton(true);

    // 確保 SDK 已初始化
    if (!(printer as any).isSdkInitialized) {
      await printer.initSDK();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 1. 開始打印任務（總份數 = 產品數 + 2 張測試標籤）
    const totalCount = (products.length + 2) * printCount;
    await printer.startJob(3, 1, 1, totalCount);

    // 2. 列印頁首測試標籤
    log('正在打印頁首測試標籤...', 'info');
    await drawTestLabel('header');
    await printer.commitJob(printCount);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. 循環打印每個產品
    for (let i = 0; i < products.length; i++) {
      // 檢查是否需要終止
      if (shouldStopPrinting) {
        log(`列印已在第 ${i + 1}/${products.length} 個產品標籤時終止`, 'warn');
        await printer.endJob();
        showStopButton(false);
        return;
      }

      const product = products[i];
      log(`正在打印第 ${i + 1}/${products.length} 個產品標籤: ${product.productNo}`, 'info');

      await drawProductLabel(product.productNo, product.productName, product.productSpec);

      // 提交當前標籤
      await printer.commitJob(printCount);

      // 等待 SDK 完成異步數據處理
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 4. 列印頁尾測試標籤
    log('正在打印頁尾測試標籤...', 'info');
    await drawTestLabel('footer');
    await printer.commitJob(printCount);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. 結束打印任務
    await printer.endJob();

    log(`批量打印完成! 共打印 ${products.length + 2} 張標籤（含頭尾測試）`, 'success');
    showStopButton(false);
  } catch (error: any) {
    log(`批量打印失敗: ${error.message}`, 'error');
    showStopButton(false);
  }
}

/**
 * 批量打印訂單與產品（單號 + 產品標籤）
 */
async function batchPrintOrdersWithProducts(orders: Order[], printCount: number = 1) {
  try {
    // 計算總標籤數
    let totalLabels = 0;
    for (const order of orders) {
      totalLabels += 1;  // 單號標籤
      totalLabels += order.products.length;  // 產品標籤
    }

    log(`正在批量打印 ${orders.length} 個訂單（共 ${totalLabels + 2} 張標籤，含頭尾測試）...`, 'info');
    shouldStopPrinting = false;
    showStopButton(true);

    // 確保 SDK 已初始化
    if (!(printer as any).isSdkInitialized) {
      await printer.initSDK();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 1. 開始打印任務（總份數 = 訂單標籤數 + 2 張測試標籤）
    const totalCount = (totalLabels + 2) * printCount;
    await printer.startJob(3, 1, 1, totalCount);

    let labelsPrinted = 0;

    // 2. 列印頁首測試標籤
    log('正在打印頁首測試標籤...', 'info');
    await drawTestLabel('header');
    await printer.commitJob(printCount);
    await new Promise(resolve => setTimeout(resolve, 1000));
    labelsPrinted++;

    // 3. 循環打印每個訂單
    for (let i = 0; i < orders.length; i++) {
      // 檢查是否需要終止
      if (shouldStopPrinting) {
        log(`列印已在第 ${i + 1}/${orders.length} 個訂單時終止（已列印 ${labelsPrinted}/${totalLabels + 2} 張標籤）`, 'warn');
        await printer.endJob();
        showStopButton(false);
        return;
      }

      const order = orders[i];
      log(`正在打印訂單 ${i + 1}/${orders.length}: ${order.orderNo}`, 'info');

      // 3.1 列印單號標籤
      await drawOrderNoLabel(order.orderNo);
      await printer.commitJob(printCount);
      await new Promise(resolve => setTimeout(resolve, 1000));
      labelsPrinted++;

      // 3.2 列印該訂單的所有產品標籤
      for (let j = 0; j < order.products.length; j++) {
        // 檢查是否需要終止
        if (shouldStopPrinting) {
          log(`列印已終止（已列印 ${labelsPrinted}/${totalLabels + 2} 張標籤）`, 'warn');
          await printer.endJob();
          showStopButton(false);
          return;
        }

        const product = order.products[j];
        log(`  - 打印產品 ${j + 1}/${order.products.length}: ${product.productNo}`, 'info');

        await drawProductLabel(product.productNo, product.productName, product.productSpec);
        await printer.commitJob(printCount);
        await new Promise(resolve => setTimeout(resolve, 1000));
        labelsPrinted++;
      }
    }

    // 4. 列印頁尾測試標籤
    log('正在打印頁尾測試標籤...', 'info');
    await drawTestLabel('footer');
    await printer.commitJob(printCount);
    await new Promise(resolve => setTimeout(resolve, 1000));
    labelsPrinted++;

    // 5. 結束打印任務
    await printer.endJob();

    log(`批量打印完成! 共打印 ${orders.length} 個訂單, ${totalLabels + 2} 張標籤（含頭尾測試）`, 'success');
    showStopButton(false);
  } catch (error: any) {
    log(`批量打印失敗: ${error.message}`, 'error');
    showStopButton(false);
  }
}

/**
 * 從 MD 檔案讀取並批量打印（統一版本，自動判斷格式）
 */
async function batchPrintFromMD() {
  try {
    // 從下拉選單讀取檔案名稱
    const mdFileSelect = document.getElementById('mdFileSelect') as HTMLSelectElement;
    const selectedFile = mdFileSelect.value;

    log(`正在讀取 MD 檔案: ${selectedFile}`, 'info');

    // 讀取 MD 檔案
    const response = await fetch(`/${selectedFile}`);
    if (!response.ok) {
      throw new Error(`無法讀取 MD 檔案: ${selectedFile}`);
    }

    const mdContent = await response.text();
    log('MD 檔案讀取成功', 'success');

    // 自動判斷格式：檢查是否包含單號標記
    const hasOrderNumbers = mdContent.includes('## 單號:') || /^## \d{4,}$/m.test(mdContent);

    if (hasOrderNumbers) {
      // 新版格式：有單號
      log('偵測到新版格式（含單號）', 'info');

      const orders = parseMDOrders(mdContent);
      log(`解析到 ${orders.length} 個訂單`, 'success');

      if (orders.length === 0) {
        log('MD 檔案中沒有找到訂單資料', 'warn');
        return;
      }

      // 顯示解析結果
      let totalProducts = 0;
      for (const order of orders) {
        totalProducts += order.products.length;
        log(`  訂單 ${order.orderNo}: ${order.products.length} 個產品`, 'info');
      }
      log(`總計: ${orders.length} 個訂單, ${totalProducts} 個產品`, 'info');

      // 批量打印訂單+產品
      await batchPrintOrdersWithProducts(orders);
    } else {
      // 舊版格式：只有產品
      log('偵測到舊版格式（僅產品）', 'info');

      const products = parseMDProducts(mdContent);
      log(`解析到 ${products.length} 個產品`, 'success');

      if (products.length === 0) {
        log('MD 檔案中沒有找到產品資料', 'warn');
        return;
      }

      // 批量打印產品
      await batchPrintProductLabels(products);
    }

  } catch (error: any) {
    log(`從 MD 檔案批量打印失敗: ${error.message}`, 'error');
  }
}

// ==================== 初始化 ====================

function init() {
  log('初始化 TypeScript 模块测试页面', 'info');

  // 创建打印机实例
  printer = new JingchenPrinter();
  barcodePrinter = new BarcodePrinter(printer);

  // 注册事件监听
  printer.on(EventType.SERVICE_CONNECTED, () => {
    log('事件: 打印服务已连接', 'success');
    updateServiceStatus(true);
  });

  printer.on(EventType.SERVICE_DISCONNECTED, () => {
    log('事件: 打印服务已断开', 'warn');
    updateServiceStatus(false);
    updatePrinterStatus(false);
  });

  printer.on(EventType.PRINTER_CONNECTED, (data) => {
    log(`事件: 打印机已连接 - ${JSON.stringify(data)}`, 'success');
    updatePrinterStatus(true);
  });

  printer.on(EventType.PRINTER_DISCONNECTED, () => {
    log('事件: 打印机已断开', 'warn');
    updatePrinterStatus(false);
  });

  printer.on(EventType.PRINT_COMPLETE, (data) => {
    log('事件: 打印完成', 'success');
  });

  log('模块初始化完成，请先点击"连接打印服务"开始测试', 'info');
  log('提示：扫描打印机无需先初始化SDK，可直接扫描', 'info');
}

// 将函数暴露到全局
(window as any).connectService = connectService;
(window as any).disconnectService = disconnectService;
(window as any).initSDK = initSDK;
(window as any).scanUSBPrinters = scanUSBPrinters;
(window as any).scanWiFiPrinters = scanWiFiPrinters;
(window as any).connectPrinterByIndex = connectPrinterByIndex;
(window as any).printBarcode = printBarcode;
(window as any).previewBarcode = previewBarcode;
(window as any).quickPrintCODE128 = quickPrintCODE128;
(window as any).quickPrintEAN13 = quickPrintEAN13;
(window as any).batchPrint = batchPrint;
(window as any).printProductLabel = printProductLabel;
(window as any).batchPrintFromMD = batchPrintFromMD;
(window as any).stopPrinting = stopPrinting;
(window as any).clearLog = clearLog;
(window as any).testRectangleOnly = testRectangleOnly;
(window as any).testCombinedLabel4Lines = testCombinedLabel4Lines;
(window as any).testCombinedLabel3Lines = testCombinedLabel3Lines;
(window as any).testCombinedLabelWithQR = testCombinedLabelWithQR;
(window as any).previewCombinedLabel = previewCombinedLabel;

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
