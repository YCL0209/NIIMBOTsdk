import dotenv from 'dotenv';
dotenv.config();

// Server
export const PORT = parseInt(process.env.PORT || '3000', 10);
export const HOST = process.env.HOST || '0.0.0.0';

// Auth
export const API_KEY = process.env.API_KEY || '';
export const ALLOWED_IPS = process.env.ALLOWED_IPS
  ? process.env.ALLOWED_IPS.split(',').map(s => s.trim())
  : [];

// Jingchen SDK WebSocket
export const JINGCHEN_WS_URL = process.env.JINGCHEN_WS_URL || 'ws://127.0.0.1:37989';

// Print defaults
export const DEFAULT_DENSITY = parseInt(process.env.DEFAULT_DENSITY || '3', 10);
export const DEFAULT_LABEL_TYPE = parseInt(process.env.DEFAULT_LABEL_TYPE || '1', 10);
export const DEFAULT_PRINT_MODE = parseInt(process.env.DEFAULT_PRINT_MODE || '1', 10);

// Label type mapping (friendly name → SDK value)
export const LABEL_TYPE_MAP: Record<string, number> = {
  GAP_PAPER: 1,
  BLACK_MARK: 2,
  CONTINUOUS: 3,
  HOLE_PAPER: 4,
  TRANSPARENT: 5,
  NAMEPLATE: 6,
  BLACK_MARK_GAP: 10,
};

// Print mode mapping
export const PRINT_MODE_MAP: Record<string, number> = {
  THERMAL: 1,
  TRANSFER: 2,
};

// Barcode type mapping
export const BARCODE_TYPE_MAP: Record<string, number> = {
  CODE128: 20,
  UPC_A: 21,
  UPC_E: 22,
  EAN8: 23,
  EAN13: 24,
  CODE93: 25,
  CODE39: 26,
  CODEBAR: 27,
  ITF25: 28,
};

// QR code type mapping
export const QRCODE_TYPE_MAP: Record<string, number> = {
  QR_CODE: 31,
  PDF417: 32,
  DATA_MATRIX: 33,
  AZTEC: 34,
};

// SDK delays (ms) — SDK has no ready events, must use fixed delays
export const SDK_DELAYS = {
  AFTER_INIT: 2000,
  AFTER_COMMIT: 1000,
  BETWEEN_DRAWS: 100,
  AFTER_DRAW_COMPLETE: 300,
  RETRY_INTERVAL: 1000,
} as const;

// API timeout (ms)
export const API_TIMEOUT = {
  default: 10000,
  wifi: 25000,
  print: 30000,
} as const;

export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));
