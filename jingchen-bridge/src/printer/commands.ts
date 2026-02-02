import { sendMessage, ApiResponse } from './client';
import { SDK_DELAYS, delay } from '../config';

// ==================== SDK Init ====================

export async function initSDK(): Promise<void> {
  await sendMessage('initSdk', {
    fontDir: '',
    isOpenPort: true,
    isCloseANE: true,
    printCallBackType: 0,
  });
}

// ==================== Printer Management ====================

export interface PrinterInfo {
  printerName: string;
  port: number;
}

export async function scanUSBPrinters(): Promise<PrinterInfo[]> {
  try {
    const result = await sendMessage('getAllPrinters');

    if (result.resultAck?.info && typeof result.resultAck.info === 'string') {
      try {
        const printers = JSON.parse(result.resultAck.info);
        if (typeof printers === 'object' && printers !== null) {
          return Object.entries(printers).map(([printerName, port]) => ({
            printerName,
            port: typeof port === 'number' ? port : parseInt(port as string),
          }));
        }
      } catch {
        console.error('[CMD] Failed to parse printer list');
      }
    }
    return [];
  } catch (error: any) {
    // errorCode 23 = "no device", return empty array
    if (error.code === 23) return [];
    throw error;
  }
}

export async function connectPrinter(printerName: string, port: number): Promise<void> {
  await sendMessage('selectPrinter', { printerName, port });
}

// ==================== Job Lifecycle ====================

export async function startJob(
  printDensity: number,
  printLabelType: number,
  printMode: number,
  count: number
): Promise<void> {
  const maxRetries = 3;
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      await sendMessage('startJob', {
        printDensity,
        printLabelType,
        printMode,
        count,
      });
      return; // success
    } catch (error: any) {
      lastError = error;
      // errorCode -2 = printer busy, retry
      if (error.code === -2 && i < maxRetries - 1) {
        const waitTime = (i + 1) * SDK_DELAYS.RETRY_INTERVAL;
        console.log(`[CMD] Printer busy, retry in ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
      if (error.code !== -2) throw error;
    }
  }
  throw lastError;
}

export async function initBoard(
  width: number,
  height: number,
  rotate: number = 0
): Promise<void> {
  await sendMessage('InitDrawingBoard', {
    width,
    height,
    rotate,
    path: 'ZT001.ttf',
    verticalShift: 0,
    HorizontalShift: 0,
  });
}

// ==================== Draw Operations ====================

export async function drawText(params: {
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  fontSize: number;
  fontFamily?: string;
  rotate?: number;
  textAlignHorizonral?: number;
  textAlignVertical?: number;
  letterSpacing?: number;
  lineSpacing?: number;
  lineMode?: number;
  fontStyle?: [boolean, boolean, boolean, boolean];
}): Promise<void> {
  await sendMessage('DrawLableText', {
    rotate: 0,
    fontFamily: '宋体',
    textAlignHorizonral: 0,
    textAlignVertical: 0,
    letterSpacing: 0,
    lineSpacing: 1,
    lineMode: 6,
    fontStyle: [false, false, false, false],
    ...params,
  });
}

export async function drawBarcode(params: {
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  codeType: number;
  rotate?: number;
  fontSize?: number;
  textHeight?: number;
  textPosition?: number;
}): Promise<void> {
  await sendMessage('DrawLableBarCode', {
    rotate: 0,
    fontSize: 3.2,
    textHeight: 3.2,
    textPosition: 0,
    ...params,
  });
}

export async function drawQRCode(params: {
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  codeType?: number;
  rotate?: number;
}): Promise<void> {
  await sendMessage('DrawLableQrCode', {
    codeType: 31, // QR_CODE
    rotate: 0,
    ...params,
  });
}

export async function drawImage(params: {
  x: number;
  y: number;
  width: number;
  height: number;
  imageData: string;
  rotate?: number;
  imageProcessingType?: number;
  imageProcessingValue?: number;
}): Promise<void> {
  // Strip base64 data URI prefix if present
  let imageData = params.imageData;
  const base64Prefix = /^data:image\/[^;]+;base64,/;
  if (base64Prefix.test(imageData)) {
    imageData = imageData.replace(base64Prefix, '');
  }

  await sendMessage('DrawLableImage', {
    rotate: 0,
    imageProcessingType: 0,
    imageProcessingValue: 127,
    ...params,
    imageData,
  });
}

// ==================== Job Commit / End ====================

export async function commitJob(copies: number = 1): Promise<void> {
  await sendMessage('commitJob', {
    printData: null,
    printerImageProcessingInfo: {
      printQuantity: copies,
    },
  });
}

export async function endJob(): Promise<void> {
  try {
    await sendMessage('endJob');
  } catch (e) {
    console.error('[CMD] endJob error (ignored):', e);
  }
}
