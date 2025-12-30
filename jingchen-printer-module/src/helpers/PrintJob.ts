/**
 * 打印任務管理類
 * 封裝 SDK bug workaround，對外隱藏實現細節
 */

import { JingchenPrinter } from '../JingchenPrinter';
import { RotateAngle, LabelType } from '../types';
import { SDK_DELAYS, delay } from '../config';

/**
 * 打印任務選項
 */
export interface PrintJobOptions {
  /** 打印份數（每種標籤的份數） */
  count: number;
  /** 打印濃度（1-15） */
  density?: number;
  /** 紙張類型 */
  labelType?: LabelType;
  /** 打印模式（1:熱敏 2:熱轉印） */
  printMode?: number;
  /** 標籤寬度 (mm) */
  labelWidth?: number;
  /** 標籤高度 (mm) */
  labelHeight?: number;
}

/**
 * 打印任務類
 *
 * 用法：
 * ```typescript
 * const job = await PrintJob.create(printer, { count: 5 });
 *
 * // 打印多個標籤
 * for (const label of labels) {
 *   await job.printLabel(async () => {
 *     await printer.initBoard({ width: 50, height: 30, rotate: 0 });
 *     await printer.drawText({ ... });
 *   });
 * }
 *
 * await job.end();
 * ```
 */
export class PrintJob {
  /**
   * SDK 的 count=1 bug 閾值
   * 當 count <= 此值時，需要額外的佔位標籤
   */
  private static readonly SDK_COUNT_BUG_THRESHOLD = 1;

  private printer: JingchenPrinter;
  private options: PrintJobOptions;
  private labelsPrinted: number = 0;
  private isEnded: boolean = false;

  private constructor(printer: JingchenPrinter, options: PrintJobOptions) {
    this.printer = printer;
    this.options = options;
  }

  /**
   * 創建打印任務
   * 內部處理 SDK 的 count=1 bug，對外隱藏此細節
   *
   * @param printer 打印機實例
   * @param options 打印選項
   * @returns PrintJob 實例
   */
  static async create(printer: JingchenPrinter, options: PrintJobOptions): Promise<PrintJob> {
    const needsPlaceholder = options.count <= this.SDK_COUNT_BUG_THRESHOLD;

    // 計算實際的 count（如果需要佔位標籤，加 1）
    const actualCount = needsPlaceholder ? options.count + 1 : options.count;

    // 確保 SDK 已初始化
    if (!(printer as any).isSdkInitialized) {
      await printer.initSDK();
      await delay(SDK_DELAYS.AFTER_INIT);
    }

    // 開始打印任務
    await printer.startJob(
      options.density ?? 3,
      options.labelType ?? LabelType.GAP_PAPER,
      options.printMode ?? 1,
      actualCount
    );

    const job = new PrintJob(printer, options);

    // 如果需要佔位標籤，自動打印一張
    if (needsPlaceholder) {
      await job._printPlaceholder();
    }

    return job;
  }

  /**
   * 打印一張標籤
   *
   * @param drawCallback 繪製回調函數，用於繪製標籤內容
   * @param copies 當前標籤的打印份數（默認 1）
   */
  async printLabel(drawCallback: () => Promise<void>, copies: number = 1): Promise<void> {
    if (this.isEnded) {
      throw new Error('PrintJob 已結束，無法繼續打印');
    }

    // 執行繪製回調
    await drawCallback();
    await delay(SDK_DELAYS.AFTER_DRAW_COMPLETE);

    // 提交打印
    await this.printer.commitJob(copies);
    await delay(SDK_DELAYS.AFTER_COMMIT);

    this.labelsPrinted++;
  }

  /**
   * 結束打印任務
   */
  async end(): Promise<void> {
    if (this.isEnded) {
      return;
    }

    await this.printer.endJob();
    this.isEnded = true;
  }

  /**
   * 取消打印任務
   */
  async cancel(): Promise<void> {
    if (this.isEnded) {
      return;
    }

    await this.printer.cancelJob();
    this.isEnded = true;
  }

  /**
   * 獲取已打印的標籤數量
   */
  get printedCount(): number {
    return this.labelsPrinted;
  }

  /**
   * 內部方法：打印佔位標籤（繞過 SDK bug）
   * 這張標籤用於「吸收」SDK 的 count=1 bug
   */
  private async _printPlaceholder(): Promise<void> {
    const width = this.options.labelWidth ?? 50;
    const height = this.options.labelHeight ?? 30;

    // 初始化畫板
    await this.printer.initBoard({
      width,
      height,
      rotate: RotateAngle.ROTATE_0,
      path: 'ZT001.ttf',
      verticalShift: 0,
      HorizontalShift: 0
    });

    // 繪製一個簡單的佔位內容（SDK bug workaround）
    await this.printer.drawText({
      x: 2,
      y: height / 2 - 3,
      height: 6,
      width: width - 4,
      value: '--- 系統標籤 ---',
      fontFamily: '宋体',
      fontSize: 2.5,
      rotate: RotateAngle.ROTATE_0,
      fontStyle: [false, false, false, false],
      textAlignHorizonral: 1,  // 居中
      textAlignVertical: 1,
      letterSpacing: 0,
      lineSpacing: 1,
      lineMode: 6
    });

    await delay(SDK_DELAYS.AFTER_DRAW_COMPLETE);

    // 提交佔位標籤
    await this.printer.commitJob(1);
    await delay(SDK_DELAYS.AFTER_COMMIT);
  }
}
