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
  RotateAngle
} from '../src/index';

// 全局变量
let printer: JingchenPrinter;
let barcodePrinter: BarcodePrinter;
let currentPrinters: PrinterInfo[] = [];

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
(window as any).clearLog = clearLog;

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
