/**
 * 精臣條碼打印機 - 簡化版
 */

import {
  JingchenPrinter,
  BarcodePrinter,
  BarcodeType,
  ConnectionType,
  EventType
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
function updateStatus(text: string, isConnected: boolean) {
  const status = document.getElementById('status');
  if (status) {
    status.textContent = text;
    status.className = 'status' + (isConnected ? ' connected' : '');
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
      updateStatus('未找到打印機', false);
      log('未找到 USB 打印機，請確認打印機已連接');
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

// 暴露到全局
(window as any).printBarcode = printBarcode;
(window as any).previewBarcode = previewBarcode;

// 啟動
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
