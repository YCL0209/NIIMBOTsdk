/**
 * 条码辅助类
 * Barcode Helper Class
 */

import {
  BarcodeType,
  BarcodeDrawParams,
  BarcodeGeneratorConfig,
  RotateAngle,
  TextPosition,
  InitDrawingBoardParams
} from './types';
import { DEFAULT_BARCODE_PARAMS, BARCODE_CONTENT_LENGTH, DEFAULT_FONT_PATH, SDK_DELAYS, delay } from './config';
import { JingchenPrinter } from './JingchenPrinter';

/**
 * 条码辅助类 - 简化条码打印操作
 */
export class BarcodeHelper {
  private config: Partial<BarcodeGeneratorConfig> = {};

  /**
   * 设置条码内容
   */
  public setContent(content: string): this {
    this.config.content = content;
    return this;
  }

  /**
   * 设置条码类型
   */
  public setType(type: BarcodeType): this {
    this.config.type = type;
    return this;
  }

  /**
   * 设置条码尺寸
   */
  public setSize(width: number, height: number): this {
    this.config.width = width;
    this.config.height = height;
    return this;
  }

  /**
   * 设置标签尺寸
   */
  public setLabelSize(width: number, height: number): this {
    this.config.labelWidth = width;
    this.config.labelHeight = height;
    return this;
  }

  /**
   * 设置边距
   */
  public setMargin(margin: number): this {
    this.config.margin = margin;
    return this;
  }

  /**
   * 设置字体大小
   */
  public setFontSize(fontSize: number): this {
    this.config.fontSize = fontSize;
    return this;
  }

  /**
   * 设置文本位置
   */
  public setTextPosition(position: TextPosition): this {
    this.config.textPosition = position;
    return this;
  }

  /**
   * 设置旋转角度
   */
  public setRotate(rotate: RotateAngle): this {
    this.config.rotate = rotate;
    return this;
  }

  /**
   * 验证条码内容
   */
  private validateContent(content: string, type: BarcodeType): { valid: boolean; message?: string } {
    const rule = BARCODE_CONTENT_LENGTH[type];
    if (!rule) {
      return { valid: false, message: `不支持的条码类型: ${type}` };
    }

    const length = content.length;

    // 检查长度
    if (rule.min === rule.max && length !== rule.min) {
      return {
        valid: false,
        message: `${rule.name} 条码必须是 ${rule.min} 位，当前: ${length} 位`
      };
    }

    if (length < rule.min || length > rule.max) {
      return {
        valid: false,
        message: `${rule.name} 条码长度必须在 ${rule.min}-${rule.max} 之间，当前: ${length} 位`
      };
    }

    // 特殊验证
    switch (type) {
      case BarcodeType.EAN13:
      case BarcodeType.EAN8:
      case BarcodeType.UPC_A:
      case BarcodeType.UPC_E:
        if (!/^\d+$/.test(content)) {
          return {
            valid: false,
            message: `${rule.name} 条码只能包含数字`
          };
        }
        break;

      case BarcodeType.ITF25:
        if (length % 2 !== 0) {
          return {
            valid: false,
            message: `ITF25 条码长度必须是偶数，当前: ${length} 位`
          };
        }
        break;

      case BarcodeType.CODE39:
        if (!/^[A-Z0-9\-. $\/+%]+$/.test(content)) {
          return {
            valid: false,
            message: 'CODE39 只支持大写字母、数字和特殊字符 (-. $/+%)'
          };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * 构建条码绘制参数
   */
  public build(): BarcodeDrawParams {
    if (!this.config.content) {
      throw new Error('条码内容不能为空');
    }

    if (this.config.type === undefined) {
      throw new Error('条码类型不能为空');
    }

    // 验证条码内容
    const validation = this.validateContent(this.config.content, this.config.type);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // 计算默认值
    const margin = this.config.margin ?? DEFAULT_BARCODE_PARAMS.margin;
    const labelWidth = this.config.labelWidth ?? 50;  // 默认标签宽度 50mm
    const labelHeight = this.config.labelHeight ?? 30;  // 默认标签高度 30mm

    // 条码尺寸：如果用户指定了就用指定的，否则基于标签尺寸计算合理的默认值
    // 新公式：適合所有尺寸的標籤（包括小標籤如 30x15mm）
    // - 寬度：標籤寬度 - 4mm 邊距，或至少 80% 標籤寬度
    // - 高度：標籤高度 - 8mm 邊距，或至少 60% 標籤高度
    const barcodeWidth = this.config.width ?? Math.max(labelWidth - margin * 2, labelWidth * 0.8);
    const barcodeHeight = this.config.height ?? Math.max(labelHeight - margin * 4, labelHeight * 0.6);
    const fontSize = this.config.fontSize ?? DEFAULT_BARCODE_PARAMS.fontSize;

    return {
      x: margin,
      y: margin,
      width: barcodeWidth,
      height: barcodeHeight,
      value: this.config.content,
      codeType: this.config.type,
      rotate: this.config.rotate ?? DEFAULT_BARCODE_PARAMS.rotate,
      fontSize: fontSize,
      textHeight: fontSize,
      textPosition: this.config.textPosition ?? DEFAULT_BARCODE_PARAMS.textPosition
    };
  }

  /**
   * 构建画板参数
   */
  public buildBoardParams(): InitDrawingBoardParams {
    const labelWidth = this.config.labelWidth ?? this.config.width ?? 40;
    const labelHeight = this.config.labelHeight ?? this.config.height ?? 20;

    return {
      width: labelWidth,
      height: labelHeight,
      rotate: this.config.rotate ?? RotateAngle.ROTATE_0,
      path: DEFAULT_FONT_PATH,
      verticalShift: 0,
      HorizontalShift: 0
    };
  }

  /**
   * 重置配置
   */
  public reset(): this {
    this.config = {};
    return this;
  }
}

/**
 * 快速打印条码的便捷函数
 */
export class BarcodePrinter {
  private printer: JingchenPrinter;

  constructor(printer: JingchenPrinter) {
    this.printer = printer;
  }

  /**
   * 應用配置到 BarcodeHelper（內部輔助方法）
   */
  private applyConfig(helper: BarcodeHelper, config: Partial<BarcodeGeneratorConfig>): void {
    if (config.width !== undefined) helper.setSize(config.width, config.height!);
    if (config.labelWidth !== undefined) helper.setLabelSize(config.labelWidth, config.labelHeight!);
    if (config.margin !== undefined) helper.setMargin(config.margin);
    if (config.fontSize !== undefined) helper.setFontSize(config.fontSize);
    if (config.textPosition !== undefined) helper.setTextPosition(config.textPosition);
    if (config.rotate !== undefined) helper.setRotate(config.rotate);
  }

  /**
   * 快速打印条码 - 一步完成开始任务、初始化画板、绘制条码、提交打印、结束任务
   * @param config 条码配置
   * @param printCount 打印份数，默认为1
   * @param printDensity 打印浓度，默认为3
   * @param printLabelType 纸张类型，默认为1（间隙纸）
   * @param printMode 打印模式，默认为1（热敏）
   */
  public async quickPrint(
    config: BarcodeGeneratorConfig,
    printCount: number = 1,
    printDensity: number = 3,
    printLabelType: number = 1,
    printMode: number = 1
  ): Promise<void> {
    const helper = new BarcodeHelper()
      .setContent(config.content)
      .setType(config.type);
    this.applyConfig(helper, config);

    const boardParams = helper.buildBoardParams();
    const barcodeParams = helper.build();

    // 确保 SDK 已初始化并等待打印机准备就绪
    if (!(this.printer as any).isSdkInitialized) {
      await this.printer.initSDK();
      await delay(SDK_DELAYS.AFTER_INIT);
    }

    // 1. 开始打印任务
    await this.printer.startJob(printDensity, printLabelType, printMode, printCount);

    // 2. 初始化画板
    await this.printer.initBoard(boardParams);

    // 3. 绘制条码
    await this.printer.drawBarcode(barcodeParams);

    // 4. 提交打印任务
    await this.printer.commitJob(printCount);

    // 等待 SDK 完成异步数据处理
    await delay(SDK_DELAYS.AFTER_COMMIT);

    // 5. 结束任务
    await this.printer.endJob();
  }

  /**
   * 快速预览条码
   */
  public async quickPreview(config: BarcodeGeneratorConfig): Promise<string> {
    const helper = new BarcodeHelper()
      .setContent(config.content)
      .setType(config.type);
    this.applyConfig(helper, config);

    const boardParams = helper.buildBoardParams();
    const barcodeParams = helper.build();

    // 初始化画板
    await this.printer.initBoard(boardParams);

    // 绘制条码
    await this.printer.drawBarcode(barcodeParams);

    // 生成预览
    return await this.printer.generatePreview();
  }

  /**
   * 批量打印不同内容的条码
   * @param contents 条码内容数组
   * @param config 条码配置（不含content）
   * @param printCount 每个条码的打印份数，默认为1
   * @param printDensity 打印浓度，默认为3
   * @param printLabelType 纸张类型，默认为1（间隙纸）
   * @param printMode 打印模式，默认为1（热敏）
   */
  public async batchPrint(
    contents: string[],
    config: Omit<BarcodeGeneratorConfig, 'content'>,
    printCount: number = 1,
    printDensity: number = 3,
    printLabelType: number = 1,
    printMode: number = 1
  ): Promise<void> {
    // 计算总打印份数
    const totalCount = contents.length * printCount;

    // 1. 开始打印任务
    await this.printer.startJob(printDensity, printLabelType, printMode, totalCount);

    // 2. 循环打印每个条码
    for (const content of contents) {
      const helper = new BarcodeHelper()
        .setContent(content)
        .setType(config.type);
      this.applyConfig(helper, config);

      const boardParams = helper.buildBoardParams();
      const barcodeParams = helper.build();

      // 初始化画板
      await this.printer.initBoard(boardParams);

      // 绘制条码
      await this.printer.drawBarcode(barcodeParams);

      // 提交当前页的打印任务
      await this.printer.commitJob(printCount);
      await delay(SDK_DELAYS.AFTER_COMMIT);
    }

    // 3. 结束打印任务
    await this.printer.endJob();
  }
}

/**
 * 常用条码快速生成器
 */
export class CommonBarcodes {
  /**
   * 生成 CODE128 条码（最常用，支持所有字符）
   */
  static code128(content: string, labelWidth: number = 40, labelHeight: number = 20): BarcodeGeneratorConfig {
    return {
      content,
      type: BarcodeType.CODE128,
      labelWidth,
      labelHeight
    };
  }

  /**
   * 生成 EAN13 商品条码
   */
  static ean13(content: string, labelWidth: number = 40, labelHeight: number = 20): BarcodeGeneratorConfig {
    if (content.length !== 13 || !/^\d+$/.test(content)) {
      throw new Error('EAN13 必须是13位数字');
    }
    return {
      content,
      type: BarcodeType.EAN13,
      labelWidth,
      labelHeight
    };
  }

  /**
   * 生成 EAN8 商品条码
   */
  static ean8(content: string, labelWidth: number = 30, labelHeight: number = 15): BarcodeGeneratorConfig {
    if (content.length !== 8 || !/^\d+$/.test(content)) {
      throw new Error('EAN8 必须是8位数字');
    }
    return {
      content,
      type: BarcodeType.EAN8,
      labelWidth,
      labelHeight
    };
  }

  /**
   * 生成 CODE39 条码（支持大写字母和数字）
   */
  static code39(content: string, labelWidth: number = 50, labelHeight: number = 20): BarcodeGeneratorConfig {
    return {
      content: content.toUpperCase(),
      type: BarcodeType.CODE39,
      labelWidth,
      labelHeight
    };
  }

  /**
   * 生成物流条码（ITF25）
   */
  static itf25(content: string, labelWidth: number = 60, labelHeight: number = 30): BarcodeGeneratorConfig {
    if (content.length % 2 !== 0) {
      throw new Error('ITF25 条码长度必须是偶数');
    }
    return {
      content,
      type: BarcodeType.ITF25,
      labelWidth,
      labelHeight
    };
  }
}
