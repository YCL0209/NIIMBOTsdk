/**
 * 精臣打印机 TypeScript 类型定义
 * Jingchen Printer TypeScript Type Definitions
 */

// ==================== 枚举类型 ====================

/**
 * 条码类型枚举
 */
export enum BarcodeType {
  CODE128 = 20,
  UPC_A = 21,
  UPC_E = 22,
  EAN8 = 23,
  EAN13 = 24,
  CODE93 = 25,
  CODE39 = 26,
  CODEBAR = 27,
  ITF25 = 28
}

/**
 * 二维码类型枚举
 */
export enum QRCodeType {
  QR_CODE = 31,
  PDF417 = 32,
  DATA_MATRIX = 33,
  AZTEC = 34
}

/**
 * 打印机连接类型
 */
export enum ConnectionType {
  USB = 'USB',
  WIFI = 'WIFI'
}

/**
 * 旋转角度
 */
export enum RotateAngle {
  ROTATE_0 = 0,
  ROTATE_90 = 90,
  ROTATE_180 = 180,
  ROTATE_270 = 270
}

/**
 * 文本位置
 */
export enum TextPosition {
  BOTTOM = 0,  // 下方显示
  TOP = 1,     // 上方显示
  NONE = 2     // 不显示
}

/**
 * 标签类型
 */
export enum LabelType {
  GAP_PAPER = 1,          // 间隙纸
  BLACK_MARK = 2,         // 黑标纸
  CONTINUOUS = 3,         // 连续纸
  HOLE_PAPER = 4,         // 定孔纸
  TRANSPARENT = 5,        // 透明纸
  NAMEPLATE = 6,          // 标牌
  BLACK_MARK_GAP = 10     // 黑标间隙纸
}

/**
 * 文本水平对齐方式
 */
export enum TextAlignHorizontal {
  LEFT = 0,
  CENTER = 1,
  RIGHT = 2
}

/**
 * 文本垂直对齐方式
 */
export enum TextAlignVertical {
  TOP = 0,
  MIDDLE = 1,
  BOTTOM = 2
}

// ==================== 基础接口 ====================

/**
 * API 响应结果的 resultAck 部分
 */
export interface ApiResultAck<T = any> {
  errorCode: number;
  info?: string | T;
  result?: string | number | boolean;
  printPages?: number;
  printCopies?: number;
  onPrintPageLengthCompleted?: number;
  callback?: any;
}

/**
 * API 响应结果
 */
export interface ApiResponse<T = any> {
  code?: number;          // 顶层错误码（可能不存在）
  message?: string;       // 顶层消息
  data?: T;              // 数据（用于预览等）
  apiName?: string;      // API 名称
  resultAck?: ApiResultAck<T>;  // 实际的响应结果
}

/**
 * 打印机信息
 */
export interface PrinterInfo {
  printerName: string;
  port: number;
  sn?: string;
  model?: string;
  online?: boolean;
}

/**
 * WebSocket 连接配置
 */
export interface WebSocketConfig {
  url?: string;
  timeout?: number;
  reconnectInterval?: number;
}

// ==================== 初始化相关 ====================

/**
 * SDK 初始化参数
 */
export interface InitSdkParams {
  fontDir?: string;
  isOpenPort?: boolean;
  isCloseANE?: boolean;
  printCallBackType?: number;
}

/**
 * 画板初始化参数
 */
export interface InitDrawingBoardParams {
  width: number;              // 画板宽度 (mm)
  height: number;             // 画板高度 (mm)
  rotate: RotateAngle;        // 旋转角度
  path?: string;              // 字体文件路径
  verticalShift?: number;     // 垂直偏移
  HorizontalShift?: number;   // 水平偏移
}

// ==================== 绘制相关 ====================

/**
 * 条码绘制参数
 */
export interface BarcodeDrawParams {
  x: number;                  // X坐标 (mm)
  y: number;                  // Y坐标 (mm)
  height: number;             // 条码高度 (mm)
  width: number;              // 条码宽度 (mm)
  value: string;              // 条码内容
  codeType: BarcodeType;      // 条码类型
  rotate: RotateAngle;        // 旋转角度
  fontSize: number;           // 字体大小 (mm)
  textHeight: number;         // 文本高度 (mm)
  textPosition: TextPosition; // 文本位置
}

/**
 * 文本绘制参数
 */
export interface TextDrawParams {
  x: number;
  y: number;
  height: number;
  width: number;
  value: string;
  fontFamily?: string;
  rotate: RotateAngle;
  fontSize: number;
  textAlignHorizonral?: TextAlignHorizontal;
  textAlignVertical?: TextAlignVertical;
  letterSpacing?: number;
  lineSpacing?: number;
  lineMode?: number;
  fontStyle?: [boolean, boolean, boolean, boolean];  // [加粗, 斜体, 下划线, 删除线]
}

/**
 * 二维码绘制参数
 */
export interface QRCodeDrawParams {
  x: number;
  y: number;
  height: number;
  width: number;
  value: string;
  codeType?: QRCodeType;         // 二维码类型，默认QR_CODE
  rotate: RotateAngle;
  errorCorrectionLevel?: number;  // 纠错级别
}

/**
 * 带Logo的二维码绘制参数
 */
export interface QRCodeWithLogoParams {
  x: number;
  y: number;
  height: number;
  width: number;
  value: string;
  codeType: QRCodeType;          // 二维码类型
  rotate: RotateAngle;
  correctLevel?: number;         // 纠错级别，取值范围1-4，默认2
  logoBase64: string;            // logo的base64编码（不含数据头）
  logoPosition?: number;         // logo的位置，取值范围0-4，默认0:居中，3:右下
  logoScale?: number;            // logo占据二维码的比例，默认0.25
}

/**
 * 图片绘制参数
 */
export interface ImageDrawParams {
  x: number;
  y: number;
  height: number;
  width: number;
  rotate: RotateAngle;
  imageProcessingType?: number;    // 图像处理算法，默认0
  imageProcessingValue?: number;   // 算法参数，默认127
  imageData: string;               // Base64 图片数据（不含数据头）
}

/**
 * 线条绘制参数
 */
export interface LineDrawParams {
  x: number;
  y: number;
  width: number;              // 线宽 (mm)
  height: number;             // 线高 (mm)
  lineType: number;           // 线条类型：1-实线, 2-虚线
  rotate: RotateAngle;
  dashwidth?: [number, number]; // 虚线宽度配置：[实线段长度, 空线段长度]
}

/**
 * 图形绘制参数
 */
export interface GraphDrawParams {
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: RotateAngle;
  cornerRadius?: number;      // 圆角半径 (mm)，暂不生效
  lineWidth: number;          // 线宽 (mm)
  lineType: number;           // 线条类型：1-实线, 2-虚线
  graphType: number;          // 图形类型：1-圆, 2-椭圆, 3-矩形, 4-圆角矩形
  dashwidth?: [number, number]; // 虚线宽度配置：[实线段长度, 空线段长度]
}

// ==================== 打印相关 ====================

/**
 * 打印参数
 */
export interface PrintParams {
  count?: number;             // 打印份数
  concentration?: number;     // 打印浓度 (1-15)
  isAutoCutting?: boolean;    // 是否自动切纸
  isMirror?: boolean;         // 是否镜像
  pageSort?: number;          // 页面排序
  labelType?: LabelType;      // 标签类型
}

/**
 * 预览参数
 */
export interface PreviewParams {
  isShowBorder?: boolean;     // 是否显示边框
}

/**
 * 预览结果
 */
export interface PreviewResult {
  code: number;
  data?: string;              // Base64 图片数据
  message?: string;
}

// ==================== WiFi 配置相关 ====================

/**
 * WiFi 配置参数
 */
export interface WifiConfigParams {
  wifiName: string;
  wifiPassword: string;
}

/**
 * WiFi 配置信息
 */
export interface WifiConfigInfo {
  wifiName?: string;
  ip?: string;
  mac?: string;
  signal?: number;
}

// ==================== 打印机状态相关 ====================

/**
 * 打印机状态
 */
export interface PrinterStatus {
  online: 'online' | 'offline';
  coverStatus?: number;       // 0:开启, 1:关闭
  powerLevel?: number;        // 1-4
  paperStatus?: number;
  temperature?: number;
}

/**
 * 打印状态回调
 */
export interface PrintStatusCallback {
  progress?: number;          // 打印进度 0-100
  status?: 'printing' | 'success' | 'failed' | 'cancelled';
  message?: string;
}

// ==================== 错误相关 ====================

/**
 * 错误代码
 */
export enum ErrorCode {
  SUCCESS = 0,
  SERVICE_NOT_CONNECTED = -1,
  PRINTER_NOT_CONNECTED = -2,
  INVALID_PARAMS = -3,
  SDK_NOT_INITIALIZED = -4,
  BOARD_NOT_INITIALIZED = -5,
  PRINT_FAILED = -6,
  TIMEOUT = -7,
  UNKNOWN_ERROR = -99
}

/**
 * 打印机错误
 */
export class PrinterError extends Error {
  code: ErrorCode;
  details?: any;

  constructor(code: ErrorCode, message: string, details?: any) {
    super(message);
    this.name = 'PrinterError';
    this.code = code;
    this.details = details;
  }
}

// ==================== 事件相关 ====================

/**
 * 事件类型
 */
export enum EventType {
  SERVICE_CONNECTED = 'service:connected',
  SERVICE_DISCONNECTED = 'service:disconnected',
  PRINTER_CONNECTED = 'printer:connected',
  PRINTER_DISCONNECTED = 'printer:disconnected',
  COVER_STATUS_CHANGED = 'printer:cover',
  POWER_LEVEL_CHANGED = 'printer:power',
  PRINT_PROGRESS = 'print:progress',
  PRINT_COMPLETE = 'print:complete',
  PRINT_ERROR = 'print:error'
}

/**
 * 事件监听器
 */
export type EventListener = (data: any) => void;

// ==================== 高级功能 ====================

/**
 * 批量打印配置
 */
export interface BatchPrintConfig {
  templates: Array<{
    boardParams: InitDrawingBoardParams;
    elements: Array<any>;
  }>;
  printParams: PrintParams;
  interval?: number;          // 打印间隔 (ms)
}

/**
 * 条码生成器配置
 */
export interface BarcodeGeneratorConfig {
  content: string;
  type: BarcodeType;
  width?: number;
  height?: number;
  labelWidth?: number;
  labelHeight?: number;
  margin?: number;
  fontSize?: number;
  textPosition?: TextPosition;
  rotate?: RotateAngle;
}
