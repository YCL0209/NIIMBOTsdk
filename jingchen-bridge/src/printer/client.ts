import WebSocket from 'ws';
import { JINGCHEN_WS_URL, API_TIMEOUT } from '../config';

export interface ApiResultAck {
  errorCode: number;
  info?: string | any;
  result?: string | number | boolean;
  callback?: any;
}

export interface ApiResponse {
  code?: number;
  message?: string;
  data?: any;
  apiName?: string;
  resultAck?: ApiResultAck;
}

type MessageCallback = (error: Error | null, result?: ApiResponse) => void;

let ws: WebSocket | null = null;
let connected = false;
let reconnecting = false;
let reconnectTimer: ReturnType<typeof setInterval> | null = null;

const messageCallbacks = new Map<string, MessageCallback>();
const timeoutTimers = new Map<string, ReturnType<typeof setTimeout>>();

function handleMessage(data: ApiResponse): void {
  const apiName = data.apiName;
  if (!apiName) return;

  const callback = messageCallbacks.get(apiName);
  if (!callback) return;

  // Clear timeout
  const timer = timeoutTimers.get(apiName);
  if (timer) {
    clearTimeout(timer);
    timeoutTimers.delete(apiName);
  }

  const errorCode = data.resultAck?.errorCode ?? 0;

  if (errorCode === 0) {
    callback(null, data);
  } else {
    const info = data.resultAck?.info;
    const msg = typeof info === 'string' ? info : `SDK error ${errorCode}`;
    const err = new Error(msg);
    (err as any).code = errorCode;
    (err as any).response = data;
    callback(err);
  }

  messageCallbacks.delete(apiName);
}

function onOpen(): void {
  connected = true;
  reconnecting = false;
  console.log('[WS] Connected to Jingchen SDK:', JINGCHEN_WS_URL);

  if (reconnectTimer) {
    clearInterval(reconnectTimer);
    reconnectTimer = null;
  }
}

function onClose(): void {
  console.log('[WS] Disconnected');
  connected = false;
  scheduleReconnect();
}

function onError(err: Error): void {
  console.error('[WS] Error:', err.message);
  connected = false;
  scheduleReconnect();
}

function onMessage(raw: WebSocket.RawData): void {
  try {
    const data: ApiResponse = JSON.parse(raw.toString());
    console.log('[WS] Recv:', JSON.stringify(data).slice(0, 200));
    handleMessage(data);
  } catch (e) {
    console.error('[WS] Failed to parse message:', e);
  }
}

function scheduleReconnect(): void {
  if (reconnecting || reconnectTimer) return;
  reconnecting = true;

  reconnectTimer = setInterval(() => {
    if (!connected) {
      console.log('[WS] Reconnecting...');
      doConnect();
    }
  }, 3000);
}

function doConnect(): void {
  try {
    if (ws) {
      ws.removeAllListeners();
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }

    ws = new WebSocket(JINGCHEN_WS_URL);
    ws.on('open', onOpen);
    ws.on('close', onClose);
    ws.on('error', onError);
    ws.on('message', onMessage);
  } catch (e) {
    console.error('[WS] Connection failed:', e);
    scheduleReconnect();
  }
}

export function connect(): void {
  doConnect();
}

export function disconnect(): void {
  if (reconnectTimer) {
    clearInterval(reconnectTimer);
    reconnectTimer = null;
  }
  reconnecting = false;

  if (ws) {
    ws.removeAllListeners();
    ws.close();
    ws = null;
  }
  connected = false;
}

export function isConnected(): boolean {
  return connected && ws !== null && ws.readyState === WebSocket.OPEN;
}

export function sendMessage(
  apiName: string,
  parameter?: any,
  timeout: number = API_TIMEOUT.default
): Promise<ApiResponse> {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return reject(new Error('WebSocket not connected to Jingchen SDK'));
    }

    const message: any = { apiName };
    if (parameter !== undefined) {
      message.parameter = parameter;
    }

    messageCallbacks.set(apiName, (error, result) => {
      if (error) reject(error);
      else resolve(result!);
    });

    const timer = setTimeout(() => {
      messageCallbacks.delete(apiName);
      timeoutTimers.delete(apiName);
      reject(new Error(`API timeout: ${apiName}`));
    }, timeout);
    timeoutTimers.set(apiName, timer);

    ws.send(JSON.stringify(message));
    console.log('[WS] Sent:', JSON.stringify(message).slice(0, 200));
  });
}
