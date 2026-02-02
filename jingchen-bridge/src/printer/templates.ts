import * as commands from './commands';
import { BARCODE_TYPE_MAP, QRCODE_TYPE_MAP, SDK_DELAYS, delay } from '../config';

export interface ContentItem {
  type: 'text' | 'barcode' | 'qrcode' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  value?: string;
  rotate?: number;

  // Text-specific
  fontSize?: number;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  letterSpacing?: number;
  lineSpacing?: number;
  lineMode?: number;

  // Barcode-specific
  barcodeType?: string;
  textPosition?: 'bottom' | 'top' | 'none';
  barcodeFontSize?: number;
  barcodeTextHeight?: number;

  // QR code-specific
  qrcodeType?: string;

  // Image-specific
  imageData?: string;
  imageProcessingType?: number;
  imageProcessingValue?: number;

  // Copies for this specific element's page
  copies?: number;
}

const ALIGN_MAP: Record<string, number> = {
  left: 0,
  center: 1,
  right: 2,
};

const VALIGN_MAP: Record<string, number> = {
  top: 0,
  middle: 1,
  bottom: 2,
};

const TEXT_POSITION_MAP: Record<string, number> = {
  bottom: 0,
  top: 1,
  none: 2,
};

export async function drawContent(items: ContentItem[]): Promise<void> {
  for (const item of items) {
    switch (item.type) {
      case 'text':
        await commands.drawText({
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          value: item.value || '',
          fontSize: item.fontSize || 3,
          fontFamily: item.fontFamily,
          rotate: item.rotate,
          textAlignHorizonral: item.align ? ALIGN_MAP[item.align] : undefined,
          textAlignVertical: item.verticalAlign ? VALIGN_MAP[item.verticalAlign] : undefined,
          letterSpacing: item.letterSpacing,
          lineSpacing: item.lineSpacing,
          lineMode: item.lineMode,
          fontStyle: [
            item.bold || false,
            item.italic || false,
            item.underline || false,
            item.strikethrough || false,
          ],
        });
        break;

      case 'barcode':
        await commands.drawBarcode({
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          value: item.value || '',
          codeType: item.barcodeType
            ? (BARCODE_TYPE_MAP[item.barcodeType] || 20)
            : 20,
          rotate: item.rotate,
          fontSize: item.barcodeFontSize,
          textHeight: item.barcodeTextHeight,
          textPosition: item.textPosition
            ? TEXT_POSITION_MAP[item.textPosition]
            : undefined,
        });
        break;

      case 'qrcode':
        await commands.drawQRCode({
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          value: item.value || '',
          codeType: item.qrcodeType
            ? (QRCODE_TYPE_MAP[item.qrcodeType] || 31)
            : undefined,
          rotate: item.rotate,
        });
        break;

      case 'image':
        await commands.drawImage({
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          imageData: item.imageData || item.value || '',
          rotate: item.rotate,
          imageProcessingType: item.imageProcessingType,
          imageProcessingValue: item.imageProcessingValue,
        });
        break;
    }

    await delay(SDK_DELAYS.BETWEEN_DRAWS);
  }
}
