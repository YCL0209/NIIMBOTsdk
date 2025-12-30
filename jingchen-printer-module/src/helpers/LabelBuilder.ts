/**
 * 標籤構建器
 * 封裝常用的標籤繪製邏輯
 */

import { JingchenPrinter } from '../JingchenPrinter';
import { RotateAngle, BarcodeType, TextAlignHorizontal, TextAlignVertical } from '../types';
import { SDK_DELAYS, delay } from '../config';

/**
 * 文字樣式選項
 */
export interface TextStyle {
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
}

/**
 * 標籤構建器
 *
 * 用法：
 * ```typescript
 * const builder = new LabelBuilder(printer, 50, 30);
 *
 * await builder
 *   .drawBorder()
 *   .drawText(3, 4, '品號：ABC-001', { fontSize: 3 })
 *   .drawText(3, 11, '品名：產品名稱', { fontSize: 3 })
 *   .drawBarcode(3, 18, 'ABC-001', BarcodeType.CODE128)
 *   .commit();
 * ```
 */
export class LabelBuilder {
  private printer: JingchenPrinter;
  private width: number;
  private height: number;
  private operations: Array<() => Promise<void>> = [];
  private isInitialized: boolean = false;

  constructor(printer: JingchenPrinter, width: number, height: number) {
    this.printer = printer;
    this.width = width;
    this.height = height;
  }

  /**
   * 初始化畫板
   */
  async init(): Promise<this> {
    if (this.isInitialized) {
      return this;
    }

    await this.printer.initBoard({
      width: this.width,
      height: this.height,
      rotate: RotateAngle.ROTATE_0,
      path: 'ZT001.ttf',
      verticalShift: 0,
      HorizontalShift: 0
    });

    this.isInitialized = true;
    return this;
  }

  /**
   * 繪製邊框（用 4 條線，繞過 SDK graphType:3 的底線消失 bug）
   */
  async drawBorder(margin: number = 2, lineWidth: number = 0.5): Promise<this> {
    await this.init();

    const x = margin;
    const y = margin;
    const w = this.width - margin * 2;
    const h = this.height - margin * 2 - 3;  // 底部多留 3mm 避免截斷

    // 上邊
    await this.printer.drawLine({
      x, y, height: lineWidth, width: w,
      rotate: RotateAngle.ROTATE_0, lineType: 1, dashwidth: [1, 1]
    });
    await delay(SDK_DELAYS.BETWEEN_DRAWS);

    // 下邊
    await this.printer.drawLine({
      x, y: y + h - lineWidth, height: lineWidth, width: w,
      rotate: RotateAngle.ROTATE_0, lineType: 1, dashwidth: [1, 1]
    });
    await delay(SDK_DELAYS.BETWEEN_DRAWS);

    // 左邊
    await this.printer.drawLine({
      x, y, height: h, width: lineWidth,
      rotate: RotateAngle.ROTATE_0, lineType: 1, dashwidth: [1, 1]
    });
    await delay(SDK_DELAYS.BETWEEN_DRAWS);

    // 右邊
    await this.printer.drawLine({
      x: x + w - lineWidth, y, height: h, width: lineWidth,
      rotate: RotateAngle.ROTATE_0, lineType: 1, dashwidth: [1, 1]
    });
    await delay(SDK_DELAYS.BETWEEN_DRAWS);

    return this;
  }

  /**
   * 繪製文字
   */
  async drawText(
    x: number,
    y: number,
    text: string,
    style: TextStyle = {}
  ): Promise<this> {
    await this.init();

    const fontSize = style.fontSize ?? 3;
    const textHeight = fontSize + 4;
    const textWidth = this.width - x - 2;

    let hAlign: TextAlignHorizontal;
    switch (style.align) {
      case 'center': hAlign = TextAlignHorizontal.CENTER; break;
      case 'right': hAlign = TextAlignHorizontal.RIGHT; break;
      default: hAlign = TextAlignHorizontal.LEFT;
    }

    let vAlign: TextAlignVertical;
    switch (style.valign) {
      case 'middle': vAlign = TextAlignVertical.MIDDLE; break;
      case 'bottom': vAlign = TextAlignVertical.BOTTOM; break;
      default: vAlign = TextAlignVertical.TOP;
    }

    await this.printer.drawText({
      x,
      y,
      height: textHeight,
      width: textWidth,
      value: text,
      fontFamily: style.fontFamily ?? '宋体',
      fontSize,
      rotate: RotateAngle.ROTATE_0,
      fontStyle: [
        style.bold ?? false,
        style.italic ?? false,
        style.underline ?? false,
        style.strikethrough ?? false
      ],
      textAlignHorizonral: hAlign,
      textAlignVertical: vAlign,
      letterSpacing: 0,
      lineSpacing: 1,
      lineMode: 6
    });

    await delay(SDK_DELAYS.BETWEEN_DRAWS);
    return this;
  }

  /**
   * 繪製條碼
   */
  async drawBarcode(
    x: number,
    y: number,
    content: string,
    type: BarcodeType = BarcodeType.CODE128,
    options: { width?: number; height?: number; showText?: boolean } = {}
  ): Promise<this> {
    await this.init();

    const width = options.width ?? this.width - x - 2;
    const height = options.height ?? 10;

    await this.printer.drawBarcode({
      x,
      y,
      width,
      height,
      value: content,
      codeType: type,
      rotate: RotateAngle.ROTATE_0,
      fontSize: 2,
      textHeight: options.showText === false ? 0 : 2,
      textPosition: options.showText === false ? 2 : 0
    });

    await delay(SDK_DELAYS.BETWEEN_DRAWS);
    return this;
  }

  /**
   * 繪製水平分隔線
   */
  async drawHorizontalLine(y: number, lineWidth: number = 0.3): Promise<this> {
    await this.init();

    await this.printer.drawLine({
      x: 2,
      y,
      height: lineWidth,
      width: this.width - 4,
      rotate: RotateAngle.ROTATE_0,
      lineType: 1,
      dashwidth: [1, 1]
    });

    await delay(SDK_DELAYS.BETWEEN_DRAWS);
    return this;
  }

  /**
   * 重置構建器（用於繪製下一張標籤）
   */
  reset(): this {
    this.isInitialized = false;
    this.operations = [];
    return this;
  }
}

/**
 * 預設標籤模板
 */
export class LabelTemplates {
  /**
   * 產品標籤（品號、品名、規格）
   */
  static async productLabel(
    printer: JingchenPrinter,
    productNo: string,
    productName: string,
    productSpec: string
  ): Promise<void> {
    const builder = new LabelBuilder(printer, 50, 30);

    await builder
      .drawBorder()
      .then(b => b.drawText(3, 4, `品號：${productNo}`, { fontSize: 3 }))
      .then(b => b.drawText(3, 11, `品名：${productName}`, { fontSize: 3 }))
      .then(b => b.drawText(3, 18, `規格：${productSpec}`, { fontSize: 3 }));

    await delay(SDK_DELAYS.AFTER_DRAW_COMPLETE);
  }

  /**
   * 單號標籤
   */
  static async orderLabel(
    printer: JingchenPrinter,
    orderNo: string
  ): Promise<void> {
    const builder = new LabelBuilder(printer, 50, 30);

    await builder
      .drawBorder()
      .then(b => b.drawText(2, 4, '單號', { fontSize: 5, bold: true, align: 'center' }))
      .then(b => b.drawText(2, 14, orderNo, { fontSize: 8, bold: true, align: 'center' }));

    await delay(SDK_DELAYS.AFTER_DRAW_COMPLETE);
  }

  /**
   * 帶條碼的標籤（單號 + 品號條碼 + 規格）
   */
  static async barcodeLabel(
    printer: JingchenPrinter,
    orderNo: string,
    productNo: string,
    productSpec: string
  ): Promise<void> {
    const builder = new LabelBuilder(printer, 50, 30);

    await builder
      .drawBorder()
      .then(b => b.drawText(3, 3, `單號：${orderNo}`, { fontSize: 3, bold: true }))
      .then(b => b.drawHorizontalLine(8))
      .then(b => b.drawBarcode(3, 9, productNo, BarcodeType.CODE128, { height: 6, showText: false }))
      .then(b => b.drawHorizontalLine(16))
      .then(b => b.drawText(3, 17, `規格：${productSpec}`, { fontSize: 2.8 }));

    await delay(SDK_DELAYS.AFTER_DRAW_COMPLETE);
  }
}
