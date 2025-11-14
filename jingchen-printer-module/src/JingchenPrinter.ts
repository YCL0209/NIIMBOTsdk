/**
 * 精臣打印机 TypeScript 封装类
 * Jingchen Printer TypeScript Wrapper Class
 */

import {
  ApiResponse,
  BarcodeDrawParams,
  ConnectionType,
  ErrorCode,
  EventListener,
  EventType,
  GraphDrawParams,
  ImageDrawParams,
  InitDrawingBoardParams,
  InitSdkParams,
  LineDrawParams,
  PreviewParams,
  PreviewResult,
  PrinterError,
  PrinterInfo,
  PrinterStatus,
  PrintParams,
  QRCodeDrawParams,
  QRCodeWithLogoParams,
  TextDrawParams,
  WebSocketConfig,
  WifiConfigInfo,
  WifiConfigParams
} from './types';
import {
  DEFAULT_WEBSOCKET_CONFIG,
  DEFAULT_SDK_INIT_PARAMS,
  DEFAULT_PRINT_PARAMS,
  API_TIMEOUT
} from './config';

/**
 * 主打印机类
 */
export class JingchenPrinter {
  private ws: WebSocket | null = null;
  private messageCallbacks: Map<string, (error: Error | null, result?: ApiResponse) => void> = new Map();
  private eventListeners: Map<EventType, Set<EventListener>> = new Map();
  private config: WebSocketConfig;
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setInterval> | null = null;
  private isConnected: boolean = false;
  private isReconnecting: boolean = false;
  private isSdkInitialized: boolean = false;
  private isBoardInitialized: boolean = false;
  private currentPrinter: PrinterInfo | null = null;

  constructor(config?: Partial<WebSocketConfig>) {
    this.config = { ...DEFAULT_WEBSOCKET_CONFIG, ...config };
  }

  // ==================== WebSocket 连接管理 ====================

  /**
   * 连接打印服务
   */
  public async connectService(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.connect();

      const timeout = setTimeout(() => {
        reject(new PrinterError(ErrorCode.TIMEOUT, '连接打印服务超时'));
      }, this.config.timeout);

      const listener = () => {
        clearTimeout(timeout);
        this.off(EventType.SERVICE_CONNECTED, listener);
        resolve();
      };

      this.on(EventType.SERVICE_CONNECTED, listener);
    });
  }

  /**
   * 内部连接方法
   */
  private connect(): void {
    if (typeof WebSocket === 'undefined') {
      this.emit(EventType.SERVICE_DISCONNECTED, { message: '浏览器不支持WebSocket' });
      return;
    }

    try {
      this.ws = new WebSocket(this.config.url!);
      this.ws.binaryType = 'arraybuffer';

      this.ws.addEventListener('open', this.onWebSocketOpen.bind(this));
      this.ws.addEventListener('error', this.onWebSocketError.bind(this));
      this.ws.addEventListener('close', this.onWebSocketClose.bind(this));
      this.ws.addEventListener('message', this.onWebSocketMessage.bind(this));
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.scheduleReconnect();
    }
  }

  private onWebSocketOpen(): void {
    this.isConnected = true;
    this.isReconnecting = false;
    console.log('WebSocket connected!');

    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.emit(EventType.SERVICE_CONNECTED, {});
  }

  private onWebSocketError(event: Event): void {
    console.error('WebSocket error:', event);
    this.isConnected = false;

    if (!this.isReconnecting) {
      this.isReconnecting = true;
      this.emit(EventType.SERVICE_DISCONNECTED, { error: event });
      this.scheduleReconnect();
    }
  }

  private onWebSocketClose(event: CloseEvent): void {
    console.log('WebSocket closed:', event);
    this.isConnected = false;

    if (!this.isReconnecting) {
      this.isReconnecting = true;
      this.emit(EventType.SERVICE_DISCONNECTED, { event });
      this.scheduleReconnect();
    }
  }

  private onWebSocketMessage(event: MessageEvent): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }

    try {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  private handleMessage(data: ApiResponse): void {
    console.log('Received message:', data);

    // 调用对应的回调
    const callback = this.messageCallbacks.get(data.apiName!);
    if (callback) {
      // 官方SDK的错误码在 resultAck.errorCode 中，不是顶层的 code
      const errorCode = data.resultAck?.errorCode ?? 0;
      const errorInfo = data.resultAck?.info;

      if (errorCode === 0) {
        callback(null, data);
      } else {
        callback(new PrinterError(errorCode, typeof errorInfo === 'string' ? errorInfo : '操作失败', data));
      }
      this.messageCallbacks.delete(data.apiName!);
    }

    // 处理特殊事件
    if (data.apiName === 'commitJob') {
      this.emit(EventType.PRINT_COMPLETE, data);
    } else if (data.apiName === 'printStatus') {
      const online = (data.resultAck as any)?.online;
      if (online === 'offline') {
        this.emit(EventType.PRINTER_DISCONNECTED, data);
      }
    }

    // 处理回调事件
    const callbackData = data.resultAck?.callback;
    if (callbackData) {
      switch (callbackData.name) {
        case 'onCoverStatusChange':
          this.emit(EventType.COVER_STATUS_CHANGED, { status: callbackData.coverStatus });
          break;
        case 'onElectricityChange':
          this.emit(EventType.POWER_LEVEL_CHANGED, { level: callbackData.powerLever });
          break;
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setInterval(() => {
      if (!this.isConnected) {
        console.log('Attempting to reconnect...');
        this.connect();
      }
    }, this.config.reconnectInterval);
  }

  /**
   * 断开打印服务
   */
  public disconnectService(): void {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.isReconnecting = false;
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
  }

  // ==================== 消息发送 ====================

  private sendMessage<T = any>(apiName: string, parameter?: any, timeout: number = API_TIMEOUT.default): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new PrinterError(ErrorCode.SERVICE_NOT_CONNECTED, '打印服务未连接'));
        return;
      }

      const message = {
        apiName,
        ...(parameter && { parameter })
      };

      this.messageCallbacks.set(apiName, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result as ApiResponse<T>);
        }
      });

      this.timeoutTimer = setTimeout(() => {
        this.messageCallbacks.delete(apiName);
        reject(new PrinterError(ErrorCode.TIMEOUT, `API调用超时: ${apiName}`));
      }, timeout);

      this.ws.send(JSON.stringify(message));
      console.log('Sent message:', message);
    });
  }

  // ==================== SDK 初始化 ====================

  /**
   * 初始化 SDK（可选）
   * 注意：此方法是可选的，仅在需要配置字体目录等高级功能时调用
   * 大部分打印操作不需要调用此方法
   */
  public async initSDK(params?: Partial<InitSdkParams>): Promise<void> {
    const initParams = { ...DEFAULT_SDK_INIT_PARAMS, ...params };
    const result = await this.sendMessage('initSdk', initParams);

    const errorCode = result.resultAck?.errorCode ?? 0;
    if (errorCode === 0) {
      this.isSdkInitialized = true;
    } else {
      throw new PrinterError(errorCode, result.resultAck?.info as string || '初始化SDK失败', result);
    }
  }

  /**
   * 初始化画板
   * 注意：绘制任何元素前必须先初始化画板
   */
  public async initBoard(params: InitDrawingBoardParams): Promise<void> {
    const result = await this.sendMessage('InitDrawingBoard', params);

    const errorCode = result.resultAck?.errorCode ?? 0;
    if (errorCode === 0) {
      this.isBoardInitialized = true;
    } else {
      throw new PrinterError(errorCode, result.resultAck?.info as string || '初始化画板失败', result);
    }
  }

  // ==================== 打印机管理 ====================

  /**
   * 扫描 USB 打印机
   * 注意：此方法不需要先调用 initSDK()
   */
  public async scanUSBPrinters(): Promise<PrinterInfo[]> {
    try {
      const result = await this.sendMessage<any>('getAllPrinters');

      // 根据官方SDK，打印机列表在 resultAck.info 中，是JSON字符串
      if (result.resultAck?.info && typeof result.resultAck.info === 'string') {
        try {
          const printers = JSON.parse(result.resultAck.info);
          // 转换为 PrinterInfo[] 格式
          if (typeof printers === 'object' && printers !== null) {
            return Object.entries(printers).map(([printerName, port]) => ({
              printerName,
              port: typeof port === 'number' ? port : parseInt(port as string)
            }));
          }
        } catch (e) {
          console.error('Failed to parse printer list:', e);
        }
      }

      return [];
    } catch (error: any) {
      // errorCode 23 表示 "no device"，这是正常情况，返回空数组
      if (error.code === 23) {
        return [];
      }
      throw error;
    }
  }

  /**
   * 扫描 WiFi 打印机
   * 注意：此操作需要约20-25秒
   */
  public async scanWiFiPrinters(): Promise<PrinterInfo[]> {
    try {
      const result = await this.sendMessage<any>('scanWifiPrinter', undefined, API_TIMEOUT.wifi);

      // WiFi 打印机列表直接在 resultAck.info 中，是数组格式
      if (result.resultAck?.info && Array.isArray(result.resultAck.info)) {
        return result.resultAck.info.map((item: any) => ({
          printerName: item.deviceName,
          port: item.tcpPort
        }));
      }

      return [];
    } catch (error: any) {
      // errorCode 23 表示 "no device"，这是正常情况，返回空数组
      if (error.code === 23) {
        return [];
      }
      throw error;
    }
  }

  /**
   * 连接打印机
   */
  public async connectPrinter(type: ConnectionType, printerName: string, port: number): Promise<void> {
    const apiName = type === ConnectionType.USB ? 'selectPrinter' : 'connectWifiPrinter';
    const timeout = type === ConnectionType.WIFI ? API_TIMEOUT.wifi : API_TIMEOUT.default;

    const result = await this.sendMessage(apiName, { printerName, port }, timeout);

    const errorCode = result.resultAck?.errorCode ?? 0;
    if (errorCode === 0) {
      this.currentPrinter = { printerName, port };
      this.emit(EventType.PRINTER_CONNECTED, this.currentPrinter);
    } else {
      throw new PrinterError(errorCode, result.resultAck?.info as string || `连接${type}打印机失败`, result);
    }
  }

  /**
   * 断开打印机
   */
  public async disconnectPrinter(): Promise<void> {
    await this.sendMessage('closePrinter');
    this.currentPrinter = null;
    this.emit(EventType.PRINTER_DISCONNECTED, {});
  }

  /**
   * 配置打印机 WiFi
   */
  public async configureWiFi(params: WifiConfigParams): Promise<void> {
    const result = await this.sendMessage('configurationWifi', params, API_TIMEOUT.wifi);
    const errorCode = result.resultAck?.errorCode ?? 0;
    if (errorCode !== 0) {
      throw new PrinterError(errorCode, result.resultAck?.info as string || '配置WiFi失败', result);
    }
  }

  /**
   * 获取打印机 WiFi 配置
   */
  public async getWiFiConfig(): Promise<WifiConfigInfo> {
    const result = await this.sendMessage<any>('getWifiConfiguration');
    return (result.resultAck?.info as WifiConfigInfo) || {};
  }

  // ==================== 绘制操作 ====================

  /**
   * 绘制条码
   * 注意：必须先调用 initBoard() 初始化画板
   */
  public async drawBarcode(params: BarcodeDrawParams): Promise<void> {
    if (!this.isBoardInitialized) {
      throw new PrinterError(ErrorCode.BOARD_NOT_INITIALIZED, '请先初始化画板');
    }

    const result = await this.sendMessage('DrawLableBarCode', params);
    const errorCode = result.resultAck?.errorCode ?? 0;
    if (errorCode !== 0) {
      throw new PrinterError(errorCode, result.resultAck?.info as string || '绘制条码失败', result);
    }
  }

  /**
   * 绘制文本
   * 注意：必须先调用 initBoard() 初始化画板
   */
  public async drawText(params: TextDrawParams): Promise<void> {
    if (!this.isBoardInitialized) {
      throw new PrinterError(ErrorCode.BOARD_NOT_INITIALIZED, '请先初始化画板');
    }

    const result = await this.sendMessage('DrawLableText', params);
    const errorCode = result.resultAck?.errorCode ?? 0;
    if (errorCode !== 0) {
      throw new PrinterError(errorCode, result.resultAck?.info as string || '绘制文本失败', result);
    }
  }

  /**
   * 绘制二维码
   * 注意：必须先调用 initBoard() 初始化画板
   */
  public async drawQRCode(params: QRCodeDrawParams): Promise<void> {
    if (!this.isBoardInitialized) {
      throw new PrinterError(ErrorCode.BOARD_NOT_INITIALIZED, '请先初始化画板');
    }

    // 设置默认值
    const drawParams = {
      ...params,
      codeType: params.codeType ?? 31  // 默认 QR_CODE
    };

    const result = await this.sendMessage('DrawLableQrCode', drawParams);
    const errorCode = result.resultAck?.errorCode ?? 0;
    if (errorCode !== 0) {
      throw new PrinterError(errorCode, result.resultAck?.info as string || '绘制二维码失败', result);
    }
  }

  /**
   * 绘制带Logo的二维码
   * 注意：必须先调用 initBoard() 初始化画板
   */
  public async drawQRCodeWithLogo(params: QRCodeWithLogoParams): Promise<void> {
    if (!this.isBoardInitialized) {
      throw new PrinterError(ErrorCode.BOARD_NOT_INITIALIZED, '请先初始化画板');
    }

    // 设置默认值（符合官方SDK规范）
    const drawParams = {
      ...params,
      correctLevel: params.correctLevel ?? 2,      // 默认纠错级别2
      logoPosition: params.logoPosition ?? 0,      // 默认居中
      logoScale: params.logoScale ?? 0.25          // 默认占比0.25
    };

    const result = await this.sendMessage('DrawLableQrCodeWithLogo', drawParams);
    const errorCode = result.resultAck?.errorCode ?? 0;
    if (errorCode !== 0) {
      throw new PrinterError(errorCode, result.resultAck?.info as string || '绘制带Logo的二维码失败', result);
    }
  }

  /**
   * 绘制图片
   * 注意：必须先调用 initBoard() 初始化画板
   */
  public async drawImage(params: ImageDrawParams): Promise<void> {
    if (!this.isBoardInitialized) {
      throw new PrinterError(ErrorCode.BOARD_NOT_INITIALIZED, '请先初始化画板');
    }

    // 设置默认值（符合官方SDK规范）
    const drawParams = {
      ...params,
      imageProcessingType: params.imageProcessingType ?? 0,
      imageProcessingValue: params.imageProcessingValue ?? 127
    };

    const result = await this.sendMessage('DrawLableImage', drawParams);
    const errorCode = result.resultAck?.errorCode ?? 0;
    if (errorCode !== 0) {
      throw new PrinterError(errorCode, result.resultAck?.info as string || '绘制图片失败', result);
    }
  }

  /**
   * 绘制线条
   * 注意：必须先调用 initBoard() 初始化画板
   */
  public async drawLine(params: LineDrawParams): Promise<void> {
    if (!this.isBoardInitialized) {
      throw new PrinterError(ErrorCode.BOARD_NOT_INITIALIZED, '请先初始化画板');
    }

    const result = await this.sendMessage('DrawLableLine', params);
    const errorCode = result.resultAck?.errorCode ?? 0;
    if (errorCode !== 0) {
      throw new PrinterError(errorCode, result.resultAck?.info as string || '绘制线条失败', result);
    }
  }

  /**
   * 绘制图形（矩形、圆形、椭圆、圆角矩形）
   * 注意：必须先调用 initBoard() 初始化画板
   */
  public async drawGraph(params: GraphDrawParams): Promise<void> {
    if (!this.isBoardInitialized) {
      throw new PrinterError(ErrorCode.BOARD_NOT_INITIALIZED, '请先初始化画板');
    }

    const result = await this.sendMessage('DrawLableGraph', params);
    const errorCode = result.resultAck?.errorCode ?? 0;
    if (errorCode !== 0) {
      throw new PrinterError(errorCode, result.resultAck?.info as string || '绘制图形失败', result);
    }
  }

  // ==================== 打印操作 ====================

  /**
   * 开始打印任务
   * 注意：必须在初始化画板之前调用此方法
   * @param printDensity 打印浓度（1-15，不同机型范围不同）
   * @param printLabelType 纸张类型（1:间隙纸 2:黑标纸 3:连续纸 4:定孔纸 5:透明纸 6:标牌 10:黑标间隙纸）
   * @param printMode 打印模式（1:热敏 2:热转印）
   * @param count 总打印份数
   */
  public async startJob(printDensity: number, printLabelType: number, printMode: number, count: number): Promise<void> {
    if (!this.currentPrinter) {
      throw new PrinterError(ErrorCode.PRINTER_NOT_CONNECTED, '请先连接打印机');
    }

    const maxRetries = 3;
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await this.sendMessage('startJob', {
          printDensity,
          printLabelType,
          printMode,
          count
        });

        const errorCode = result.resultAck?.errorCode ?? 0;

        // 成功
        if (errorCode === 0) {
          return;
        }

        // 如果是 printer busy (-2) 且还有重试机会，等待后重试
        if (errorCode === -2 && i < maxRetries - 1) {
          const waitTime = (i + 1) * 1000; // 递增等待时间：1s, 2s, 3s
          console.log(`打印机忙碌，等待 ${waitTime}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // 其他错误或最后一次重试仍失败，抛出错误
        throw new PrinterError(errorCode, result.resultAck?.info as string || '开始打印任务失败', result);
      } catch (error) {
        lastError = error;
        // 如果是 PrinterError 且不是 printer busy，直接抛出
        if (error instanceof PrinterError && error.code !== -2) {
          throw error;
        }
        // 如果还有重试机会，继续
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // 所有重试都失败，抛出最后一个错误
    throw lastError;
  }

  /**
   * 提交打印任务
   * 注意：完成绘制后调用此方法提交打印内容
   * @param printQuantity 当前页打印份数，默认为1
   */
  public async commitJob(printQuantity: number = 1): Promise<void> {
    const result = await this.sendMessage('commitJob', {
      printData: null,
      printerImageProcessingInfo: {
        printQuantity
      }
    });

    const errorCode = result.resultAck?.errorCode ?? 0;
    if (errorCode !== 0) {
      throw new PrinterError(errorCode, result.resultAck?.info as string || '提交打印任务失败', result);
    }
  }

  /**
   * 生成预览
   * 注意：必须先调用 initBoard() 初始化画板并绘制内容
   */
  public async generatePreview(params?: PreviewParams): Promise<string> {
    if (!this.isBoardInitialized) {
      throw new PrinterError(ErrorCode.BOARD_NOT_INITIALIZED, '请先初始化画板');
    }

    const previewParams = { isShowBorder: false, ...params };
    const result = await this.sendMessage('GenerateLablePreView', previewParams);

    const errorCode = result.resultAck?.errorCode ?? 0;
    if (errorCode === 0 && result.data) {
      return result.data as string;
    } else {
      throw new PrinterError(errorCode, result.resultAck?.info as string || '生成预览失败', result);
    }
  }

  /**
   * 生成标签预览图片（官方API名称）
   * 注意：必须先调用 initBoard() 初始化画板并绘制内容
   * @param displayScale 图像显示比例，表示1mm的点数（200dpi=8, 300dpi=11.81）
   * @returns Base64图片数据
   */
  public async generateImagePreviewImage(displayScale: number): Promise<string> {
    if (!this.isBoardInitialized) {
      throw new PrinterError(ErrorCode.BOARD_NOT_INITIALIZED, '请先初始化画板');
    }

    const result = await this.sendMessage('generateImagePreviewImage', { displayScale });

    const errorCode = result.resultAck?.errorCode ?? 0;
    if (errorCode !== 0) {
      throw new PrinterError(errorCode, result.resultAck?.info as string || '生成预览失败', result);
    }

    // 解析返回的info（包含ImageData）
    if (result.resultAck?.info) {
      try {
        const infoObj = typeof result.resultAck.info === 'string'
          ? JSON.parse(result.resultAck.info)
          : result.resultAck.info;

        if (infoObj.ImageData) {
          return infoObj.ImageData;
        }
      } catch (e) {
        // 如果解析失败，直接返回info
      }
    }

    throw new PrinterError(ErrorCode.UNKNOWN_ERROR, '预览数据格式错误', result);
  }

  /**
   * 提交打印任务（旧方法，已废弃）
   * @deprecated 请使用 startJob() + commitJob() + endJob() 组合
   */
  public async print(params?: Partial<PrintParams>): Promise<void> {
    if (!this.isBoardInitialized) {
      throw new PrinterError(ErrorCode.BOARD_NOT_INITIALIZED, '请先初始化画板');
    }

    if (!this.currentPrinter) {
      throw new PrinterError(ErrorCode.PRINTER_NOT_CONNECTED, '请先连接打印机');
    }

    const printParams = { ...DEFAULT_PRINT_PARAMS, ...params };
    const result = await this.sendMessage('SubmitPrintJob', printParams, API_TIMEOUT.print);

    const errorCode = result.resultAck?.errorCode ?? 0;
    if (errorCode !== 0) {
      throw new PrinterError(errorCode, result.resultAck?.info as string || '打印失败', result);
    }
  }

  /**
   * 结束打印任务
   */
  public async endJob(): Promise<void> {
    await this.sendMessage('endJob');
  }

  /**
   * 取消打印任务
   */
  public async cancelJob(): Promise<void> {
    const result = await this.sendMessage('cancelJob');
    const errorCode = result.resultAck?.errorCode ?? 0;
    if (errorCode !== 0) {
      throw new PrinterError(errorCode, result.resultAck?.info as string || '取消打印失败', result);
    }
  }

  // ==================== 事件管理 ====================

  /**
   * 监听事件
   */
  public on(event: EventType, listener: EventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * 取消监听
   */
  public off(event: EventType, listener: EventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 触发事件
   */
  private emit(event: EventType, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 获取连接状态
   */
  public isServiceConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 获取打印机连接状态
   */
  public isPrinterConnected(): boolean {
    return this.currentPrinter !== null;
  }

  /**
   * 获取当前打印机信息
   */
  public getCurrentPrinter(): PrinterInfo | null {
    return this.currentPrinter;
  }

  /**
   * 重置状态
   */
  public reset(): void {
    this.isSdkInitialized = false;
    this.isBoardInitialized = false;
    this.currentPrinter = null;
  }
}
