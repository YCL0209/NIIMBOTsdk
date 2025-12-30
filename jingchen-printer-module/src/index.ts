/**
 * 精臣打印机 TypeScript 模块 - 入口文件
 * Jingchen Printer TypeScript Module - Entry Point
 */

// 导出主要类
export { JingchenPrinter } from './JingchenPrinter';
export { BarcodeHelper, BarcodePrinter, CommonBarcodes } from './BarcodeHelper';

// 导出 Helpers（封裝常用操作，隱藏 SDK 細節）
export { PrintJob, MDParser, LabelBuilder, LabelTemplates } from './helpers';
export type { PrintJobOptions, ProductData, Order, TextStyle } from './helpers';

// 导出所有类型
export * from './types';

// 导出配置（包含 SDK_DELAYS 常量）
export * from './config';
