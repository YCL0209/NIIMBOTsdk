/**
 * 精臣打印机默认配置
 * Jingchen Printer Default Configuration
 */

import { WebSocketConfig, InitSdkParams, PrintParams, RotateAngle, TextPosition, LabelType } from './types';

/**
 * WebSocket 默认配置
 */
export const DEFAULT_WEBSOCKET_CONFIG: WebSocketConfig = {
  url: 'ws://127.0.0.1:37989',
  timeout: 10000,              // 10秒超时
  reconnectInterval: 3000      // 3秒重连间隔
};

/**
 * SDK 默认初始化参数
 */
export const DEFAULT_SDK_INIT_PARAMS: InitSdkParams = {
  fontDir: '',
  isOpenPort: true,
  isCloseANE: true,
  printCallBackType: 0
};

/**
 * 默认打印参数
 */
export const DEFAULT_PRINT_PARAMS: PrintParams = {
  count: 1,                    // 默认打印1份
  concentration: 3,            // 默认浓度3
  isAutoCutting: true,         // 默认自动切纸
  isMirror: false,             // 默认不镜像
  pageSort: 0,                 // 默认页面排序
  labelType: LabelType.GAP_PAPER  // 默认间隙纸
};

/**
 * 条码默认参数
 */
export const DEFAULT_BARCODE_PARAMS = {
  rotate: RotateAngle.ROTATE_0,
  fontSize: 3.2,
  textHeight: 3.2,
  textPosition: TextPosition.BOTTOM,
  margin: 2.0                  // 默认边距 2mm
};

/**
 * 常用标签尺寸 (mm)
 */
export const COMMON_LABEL_SIZES = {
  // 小型标签
  SMALL_1: { width: 20, height: 10 },
  SMALL_2: { width: 30, height: 15 },
  SMALL_3: { width: 40, height: 20 },

  // 中型标签
  MEDIUM_1: { width: 40, height: 30 },
  MEDIUM_2: { width: 50, height: 30 },
  MEDIUM_3: { width: 60, height: 40 },

  // 大型标签
  LARGE_1: { width: 80, height: 50 },
  LARGE_2: { width: 100, height: 60 },
  LARGE_3: { width: 100, height: 80 },

  // 货架标签
  SHELF: { width: 60, height: 30 },

  // 价格标签
  PRICE: { width: 40, height: 20 },

  // 物流标签
  LOGISTICS: { width: 100, height: 100 }
};

/**
 * 条码类型对应的推荐内容长度
 */
export const BARCODE_CONTENT_LENGTH = {
  20: { min: 1, max: 80, name: 'CODE128' },      // CODE128
  21: { min: 12, max: 12, name: 'UPC-A' },       // UPC-A
  22: { min: 8, max: 8, name: 'UPC-E' },         // UPC-E
  23: { min: 8, max: 8, name: 'EAN8' },          // EAN8
  24: { min: 13, max: 13, name: 'EAN13' },       // EAN13
  25: { min: 1, max: 80, name: 'CODE93' },       // CODE93
  26: { min: 1, max: 80, name: 'CODE39' },       // CODE39
  27: { min: 1, max: 80, name: 'CODEBAR' },      // CODEBAR
  28: { min: 2, max: 80, name: 'ITF25' }         // ITF25 (必须偶数)
};

/**
 * 支持的打印机型号
 */
export const SUPPORTED_PRINTER_MODELS = [
  'B1', 'B21', 'B3S', 'B50', 'B50W',
  'B18', 'K2', 'K3', 'K3W', 'M2', 'M3',
  'D11', 'D110', 'T1', 'T2'
];

/**
 * 错误消息映射
 */
export const ERROR_MESSAGES: Record<number, string> = {
  0: '成功',
  [-1]: '打印服务未连接',
  [-2]: '打印机未连接',
  [-3]: '参数无效',
  [-4]: 'SDK未初始化',
  [-5]: '画板未初始化',
  [-6]: '打印失败',
  [-7]: '操作超时',
  [-99]: '未知错误'
};

/**
 * 打印浓度范围
 */
export const CONCENTRATION_RANGE = {
  min: 1,
  max: 15,
  default: 3,
  recommended: {
    light: 2,      // 轻度打印（热敏纸）
    normal: 3,     // 普通打印
    dark: 5        // 加深打印（不干胶标签）
  }
};

/**
 * 默认字体文件路径
 */
export const DEFAULT_FONT_PATH = 'ZT001.ttf';

/**
 * API 超时配置 (ms)
 */
export const API_TIMEOUT = {
  default: 10000,
  wifi: 25000,        // WiFi 相关操作超时时间更长
  print: 30000        // 打印操作超时时间
};
