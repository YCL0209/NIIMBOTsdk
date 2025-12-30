# 精臣打印機模組使用指南

> TypeScript 封裝的精臣 PC 端 Web SDK，提供類型安全、Promise 化的 API 接口

---

## 目錄

1. [快速開始](#1-快速開始)
2. [詳細設置指南](#2-詳細設置指南)
3. [核心概念](#3-核心概念)
4. [原廠 SDK API 完整參考](#4-原廠-sdk-api-完整參考)
5. [常用範例](#5-常用範例)
6. [輔助類 API](#6-輔助類-api)
7. [配置參考表](#7-配置參考表)
8. [進階功能](#8-進階功能)
9. [故障排除](#9-故障排除)

---

## 1. 快速開始

### 環境需求
- Node.js 16+
- 精臣打印服務已安裝並運行（WebSocket 端口 37989）
- 精臣打印機已通過 USB 或 WiFi 連接

### 安裝
```bash
cd jingchen-printer-module
npm install
npm run build
```

### 最小可運行範例（10 行代碼完成打印）

```typescript
import { JingchenPrinter, BarcodePrinter, BarcodeType, ConnectionType } from './src';

const printer = new JingchenPrinter();
const barcodePrinter = new BarcodePrinter(printer);

// 連接並打印
await printer.connectService();                                    // 連接打印服務
await printer.initSDK();                                          // 初始化 SDK
const printers = await printer.scanUSBPrinters();                 // 掃描打印機
await printer.connectPrinter(ConnectionType.USB, printers[0].printerName, printers[0].port);

// 一行代碼完成打印
await barcodePrinter.quickPrint({
  content: 'DEMO-12345',
  type: BarcodeType.CODE128,
  labelWidth: 40,
  labelHeight: 20
});
```

---

## 2. 詳細設置指南

### 2.1 前置條件

#### 安裝精臣打印服務
1. 從精臣官網下載 PC 端打印服務
2. 安裝後啟動服務，確認系統托盤有精臣圖標
3. 服務默認監聽 `ws://127.0.0.1:37989`

#### 連接打印機
- **USB 連接**: 用 USB 線連接打印機到電腦
- **WiFi 連接**: 確保打印機和電腦在同一網段

### 2.2 項目結構

```
jingchen-printer-module/
├── src/
│   ├── index.ts              # 主入口（導出所有類和類型）
│   ├── JingchenPrinter.ts    # 核心打印機類
│   ├── BarcodeHelper.ts      # 條碼輔助類
│   ├── types.ts              # TypeScript 類型定義
│   ├── config.ts             # 配置常量
│   └── helpers/              # 進階功能封裝
│       ├── PrintJob.ts       # 打印任務管理
│       ├── LabelBuilder.ts   # 標籤構建器
│       └── MDParser.ts       # Markdown 解析器
├── dist/                     # 編譯後的 JS 文件
└── test/                     # 測試文件
```

### 2.3 在項目中使用

```typescript
// 方式 1: 導入所有
import * as Jingchen from './jingchen-printer-module/src';

// 方式 2: 按需導入
import {
  JingchenPrinter,
  BarcodeHelper,
  BarcodePrinter,
  BarcodeType,
  ConnectionType,
  LabelType,
  RotateAngle
} from './jingchen-printer-module/src';
```

---

## 3. 核心概念

### 3.1 連接流程

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  連接服務   │ → │  初始化SDK  │ → │  掃描打印機 │ → │  連接打印機 │ → │  開始打印   │
│connectService│    │   initSDK   │    │scanUSB/WiFi │    │connectPrinter│    │  startJob   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 3.2 五步打印流程

每次打印都需要遵循以下 5 個步驟：

```typescript
// Step 1: 開始打印任務
await printer.startJob(printDensity, labelType, printMode, totalCount);

// Step 2: 初始化畫板（設置標籤尺寸）
await printer.initBoard({ width: 50, height: 30, rotate: 0 });

// Step 3: 繪製內容（條碼、文字、圖片等）
await printer.drawBarcode({ ... });
await printer.drawText({ ... });

// Step 4: 提交打印
await printer.commitJob(printQuantity);

// Step 5: 結束任務
await printer.endJob();
```

### 3.3 類結構概覽

| 類名 | 用途 | 使用場景 |
|------|------|----------|
| `JingchenPrinter` | 核心打印機類 | 所有打印操作的基礎 |
| `BarcodeHelper` | 條碼參數構建器 | 鏈式配置條碼參數 |
| `BarcodePrinter` | 快速打印類 | 簡化常見打印操作 |
| `CommonBarcodes` | 常用條碼生成器 | 快速生成標準條碼配置 |

---

## 4. 原廠 SDK API 完整參考

### 4.1 連接管理

| 方法 | 原廠 API | 說明 | 參數 |
|------|----------|------|------|
| `connectService()` | WebSocket 連接 | 連接打印服務 | 無 |
| `disconnectService()` | WebSocket 關閉 | 斷開打印服務 | 無 |
| `isServiceConnected()` | - | 檢查服務連接狀態 | 無 |

```typescript
// 連接打印服務
await printer.connectService();

// 檢查連接狀態
if (printer.isServiceConnected()) {
  console.log('服務已連接');
}

// 斷開服務
printer.disconnectService();
```

### 4.2 SDK 初始化

| 方法 | 原廠 API | 說明 | 必要性 |
|------|----------|------|--------|
| `initSDK(params?)` | `initSdk` | 初始化 SDK | 可選（配置字體等） |
| `initBoard(params)` | `InitDrawingBoard` | 初始化畫板 | **必須**（繪製前調用） |

#### initSDK 參數

```typescript
interface InitSdkParams {
  fontDir?: string;           // 字體目錄路徑
  isOpenPort?: boolean;       // 是否開啟端口（默認 true）
  isCloseANE?: boolean;       // 是否關閉 ANE（默認 true）
  printCallBackType?: number; // 回調類型（默認 0）
}

// 使用默認配置
await printer.initSDK();

// 自定義配置
await printer.initSDK({
  fontDir: 'C:/Fonts',
  isOpenPort: true
});
```

#### initBoard 參數

```typescript
interface InitDrawingBoardParams {
  width: number;              // 標籤寬度 (mm)
  height: number;             // 標籤高度 (mm)
  rotate: RotateAngle;        // 旋轉角度 (0/90/180/270)
  path?: string;              // 字體文件路徑
  verticalShift?: number;     // 垂直偏移 (mm)
  HorizontalShift?: number;   // 水平偏移 (mm)
}

// 初始化 50x30mm 標籤
await printer.initBoard({
  width: 50,
  height: 30,
  rotate: RotateAngle.ROTATE_0,
  verticalShift: 0,
  HorizontalShift: 0
});
```

### 4.3 設備搜尋

| 方法 | 原廠 API | 說明 | 返回值 |
|------|----------|------|--------|
| `scanUSBPrinters()` | `getAllPrinters` | 掃描 USB 打印機 | `PrinterInfo[]` |
| `scanWiFiPrinters()` | `scanWifiPrinter` | 掃描 WiFi 打印機 | `PrinterInfo[]` |

```typescript
// 返回的打印機信息格式
interface PrinterInfo {
  printerName: string;  // 打印機名稱
  port: number;         // 端口號
}

// 掃描 USB 打印機
const usbPrinters = await printer.scanUSBPrinters();
console.log(usbPrinters);
// 輸出: [{ printerName: 'B21', port: 1 }]

// 掃描 WiFi 打印機（約 20-25 秒）
const wifiPrinters = await printer.scanWiFiPrinters();
```

### 4.4 設備連接

| 方法 | 原廠 API | 說明 |
|------|----------|------|
| `connectPrinter(USB, name, port)` | `selectPrinter` | 連接 USB 打印機 |
| `connectPrinter(WiFi, name, port)` | `connectWifiPrinter` | 連接 WiFi 打印機 |
| `disconnectPrinter()` | `closePrinter` | 斷開打印機 |
| `isPrinterConnected()` | - | 檢查打印機連接狀態 |
| `getCurrentPrinter()` | - | 獲取當前打印機信息 |

```typescript
// 連接 USB 打印機
await printer.connectPrinter(
  ConnectionType.USB,
  'B21',    // 打印機名稱
  1         // 端口號
);

// 連接 WiFi 打印機
await printer.connectPrinter(
  ConnectionType.WIFI,
  'B21_WIFI',
  9100
);

// 檢查連接狀態
if (printer.isPrinterConnected()) {
  const info = printer.getCurrentPrinter();
  console.log(`已連接: ${info.printerName}`);
}

// 斷開打印機
await printer.disconnectPrinter();
```

### 4.5 繪製操作

> **重要**: 所有繪製操作必須在 `initBoard()` 之後調用

| 方法 | 原廠 API | 說明 |
|------|----------|------|
| `drawBarcode(params)` | `DrawLableBarCode` | 繪製條碼 |
| `drawText(params)` | `DrawLableText` | 繪製文本 |
| `drawQRCode(params)` | `DrawLableQrCode` | 繪製二維碼 |
| `drawQRCodeWithLogo(params)` | `DrawLableQrCodeWithLogo` | 繪製帶 Logo 的二維碼 |
| `drawImage(params)` | `DrawLableImage` | 繪製圖片 |
| `drawLine(params)` | `DrawLableLine` | 繪製線條 |
| `drawGraph(params)` | `DrawLableGraph` | 繪製圖形 |

#### drawBarcode 條碼繪製

```typescript
interface BarcodeDrawParams {
  x: number;                  // X 坐標 (mm)
  y: number;                  // Y 坐標 (mm)
  width: number;              // 條碼寬度 (mm)
  height: number;             // 條碼高度 (mm)
  value: string;              // 條碼內容
  codeType: BarcodeType;      // 條碼類型 (20-28)
  rotate: RotateAngle;        // 旋轉角度
  fontSize: number;           // 字體大小 (mm)
  textHeight: number;         // 文本高度 (mm)
  textPosition: TextPosition; // 文本位置 (0:下方, 1:上方, 2:不顯示)
}

// 繪製 CODE128 條碼
await printer.drawBarcode({
  x: 2,
  y: 2,
  width: 36,
  height: 16,
  value: 'DEMO-12345',
  codeType: BarcodeType.CODE128,  // 20
  rotate: RotateAngle.ROTATE_0,   // 0
  fontSize: 3,
  textHeight: 3,
  textPosition: TextPosition.BOTTOM  // 0
});
```

#### drawText 文本繪製

```typescript
interface TextDrawParams {
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;                    // 文本內容
  fontFamily?: string;              // 字體名稱
  rotate: RotateAngle;
  fontSize: number;                 // 字體大小 (mm)
  textAlignHorizonral?: number;     // 水平對齊 (0:左, 1:中, 2:右)
  textAlignVertical?: number;       // 垂直對齊 (0:上, 1:中, 2:下)
  letterSpacing?: number;           // 字間距
  lineSpacing?: number;             // 行間距
  fontStyle?: [boolean, boolean, boolean, boolean]; // [加粗, 斜體, 下劃線, 刪除線]
}

// 繪製文本
await printer.drawText({
  x: 2,
  y: 2,
  width: 46,
  height: 5,
  value: '產品名稱：測試商品',
  rotate: RotateAngle.ROTATE_0,
  fontSize: 3,
  textAlignHorizonral: 0,  // 左對齊
  fontStyle: [true, false, false, false]  // 加粗
});
```

#### drawQRCode 二維碼繪製

```typescript
interface QRCodeDrawParams {
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  codeType?: QRCodeType;           // 31:QR, 32:PDF417, 33:DataMatrix, 34:Aztec
  rotate: RotateAngle;
  errorCorrectionLevel?: number;   // 糾錯級別
}

// 繪製二維碼
await printer.drawQRCode({
  x: 35,
  y: 5,
  width: 12,
  height: 12,
  value: 'https://example.com',
  codeType: QRCodeType.QR_CODE,  // 31
  rotate: RotateAngle.ROTATE_0
});
```

#### drawLine 線條繪製

```typescript
interface LineDrawParams {
  x: number;
  y: number;
  width: number;                    // 線寬 (mm)
  height: number;                   // 線高 (mm)
  lineType: number;                 // 1:實線, 2:虛線
  rotate: RotateAngle;
  dashwidth?: [number, number];     // 虛線配置 [實線段, 空白段]
}

// 繪製水平線
await printer.drawLine({
  x: 2,
  y: 15,
  width: 46,
  height: 0.3,
  lineType: 1,
  rotate: RotateAngle.ROTATE_0
});
```

#### drawGraph 圖形繪製

```typescript
interface GraphDrawParams {
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: RotateAngle;
  lineWidth: number;                // 線寬 (mm)
  lineType: number;                 // 1:實線, 2:虛線
  graphType: number;                // 1:圓, 2:橢圓, 3:矩形, 4:圓角矩形
}

// 繪製矩形邊框
await printer.drawGraph({
  x: 1,
  y: 1,
  width: 48,
  height: 28,
  rotate: RotateAngle.ROTATE_0,
  lineWidth: 0.3,
  lineType: 1,
  graphType: 3  // 矩形
});
```

### 4.6 打印操作

| 方法 | 原廠 API | 說明 |
|------|----------|------|
| `startJob(density, labelType, mode, count)` | `startJob` | 開始打印任務 |
| `commitJob(quantity?)` | `commitJob` | 提交打印 |
| `endJob()` | `endJob` | 結束打印任務 |
| `cancelJob()` | `cancelJob` | 取消打印任務 |
| `generatePreview(params?)` | `GenerateLablePreView` | 生成預覽圖 |

#### startJob 開始打印任務

```typescript
await printer.startJob(
  3,    // printDensity: 打印濃度 (1-15)
  1,    // printLabelType: 紙張類型 (見下方表格)
  1,    // printMode: 打印模式 (1:熱敏, 2:熱轉印)
  5     // count: 總打印份數
);
```

**紙張類型對照表**:
| 值 | 類型 | 說明 |
|----|------|------|
| 1 | GAP_PAPER | 間隙紙（最常用） |
| 2 | BLACK_MARK | 黑標紙 |
| 3 | CONTINUOUS | 連續紙 |
| 4 | HOLE_PAPER | 定孔紙 |
| 5 | TRANSPARENT | 透明紙 |
| 6 | NAMEPLATE | 標牌 |
| 10 | BLACK_MARK_GAP | 黑標間隙紙 |

#### commitJob 提交打印

```typescript
// 提交打印，打印 1 份
await printer.commitJob(1);

// 提交打印，打印 3 份
await printer.commitJob(3);
```

#### generatePreview 生成預覽

```typescript
// 生成預覽圖（Base64 格式）
const previewBase64 = await printer.generatePreview();

// 顯示預覽
const img = document.createElement('img');
img.src = 'data:image/png;base64,' + previewBase64;
```

### 4.7 WiFi 配置

| 方法 | 原廠 API | 說明 |
|------|----------|------|
| `configureWiFi(params)` | `configurationWifi` | 配置打印機 WiFi |
| `getWiFiConfig()` | `getWifiConfiguration` | 獲取打印機 WiFi 配置 |

```typescript
// 配置打印機連接 WiFi
await printer.configureWiFi({
  wifiName: 'MyNetwork',
  wifiPassword: 'password123'
});

// 獲取當前 WiFi 配置
const config = await printer.getWiFiConfig();
console.log(config);
// { wifiName: 'MyNetwork', ip: '192.168.1.100', mac: 'AA:BB:CC:DD:EE:FF' }
```

### 4.8 事件監聽

```typescript
import { EventType } from './src';

// 監聽服務連接事件
printer.on(EventType.SERVICE_CONNECTED, () => {
  console.log('服務已連接');
});

// 監聽服務斷開事件
printer.on(EventType.SERVICE_DISCONNECTED, (data) => {
  console.log('服務已斷開', data);
});

// 監聯打印機連接事件
printer.on(EventType.PRINTER_CONNECTED, (info) => {
  console.log('打印機已連接', info);
});

// 監聽打印完成事件
printer.on(EventType.PRINT_COMPLETE, (data) => {
  console.log('打印完成', data);
});

// 取消監聽
printer.off(EventType.PRINT_COMPLETE, listener);
```

**可用事件類型**:
| 事件 | 說明 |
|------|------|
| `SERVICE_CONNECTED` | 服務已連接 |
| `SERVICE_DISCONNECTED` | 服務已斷開 |
| `PRINTER_CONNECTED` | 打印機已連接 |
| `PRINTER_DISCONNECTED` | 打印機已斷開 |
| `COVER_STATUS_CHANGED` | 打印機蓋狀態變化 |
| `POWER_LEVEL_CHANGED` | 電量變化 |
| `PRINT_COMPLETE` | 打印完成 |
| `PRINT_ERROR` | 打印錯誤 |

---

## 5. 常用範例

### 5.1 快速打印單個條碼

```typescript
import { JingchenPrinter, BarcodePrinter, BarcodeType, ConnectionType } from './src';

async function quickPrintBarcode() {
  const printer = new JingchenPrinter();
  const barcodePrinter = new BarcodePrinter(printer);

  // 連接
  await printer.connectService();
  await printer.initSDK();
  const printers = await printer.scanUSBPrinters();
  await printer.connectPrinter(ConnectionType.USB, printers[0].printerName, printers[0].port);

  // 快速打印
  await barcodePrinter.quickPrint({
    content: 'PRODUCT-001',
    type: BarcodeType.CODE128,
    labelWidth: 40,
    labelHeight: 20
  });

  console.log('打印完成');
}
```

### 5.2 打印 EAN13 商品條碼

```typescript
import { CommonBarcodes } from './src';

// 使用 CommonBarcodes 快捷方法
const config = CommonBarcodes.ean13('6901234567892', 50, 30);

await barcodePrinter.quickPrint(config);
```

### 5.3 打印二維碼

```typescript
async function printQRCode() {
  // 開始任務
  await printer.startJob(3, 1, 1, 1);

  // 初始化畫板
  await printer.initBoard({
    width: 40,
    height: 40,
    rotate: RotateAngle.ROTATE_0
  });

  // 繪製二維碼
  await printer.drawQRCode({
    x: 5,
    y: 5,
    width: 30,
    height: 30,
    value: 'https://example.com/product/12345',
    codeType: QRCodeType.QR_CODE,
    rotate: RotateAngle.ROTATE_0
  });

  // 提交並結束
  await printer.commitJob(1);
  await printer.endJob();
}
```

### 5.4 打印文字標籤

```typescript
async function printTextLabel() {
  await printer.startJob(3, 1, 1, 1);

  await printer.initBoard({
    width: 50,
    height: 30,
    rotate: RotateAngle.ROTATE_0
  });

  // 標題
  await printer.drawText({
    x: 2, y: 2,
    width: 46, height: 6,
    value: '產品標籤',
    fontSize: 4,
    rotate: RotateAngle.ROTATE_0,
    fontStyle: [true, false, false, false]  // 加粗
  });

  // 品號
  await printer.drawText({
    x: 2, y: 10,
    width: 46, height: 4,
    value: '品號：ABC-12345',
    fontSize: 3,
    rotate: RotateAngle.ROTATE_0
  });

  // 規格
  await printer.drawText({
    x: 2, y: 16,
    width: 46, height: 4,
    value: '規格：100g/包',
    fontSize: 3,
    rotate: RotateAngle.ROTATE_0
  });

  await printer.commitJob(1);
  await printer.endJob();
}
```

### 5.5 打印帶邊框的產品標籤

```typescript
async function printProductLabel() {
  await printer.startJob(3, 1, 1, 1);

  await printer.initBoard({
    width: 50,
    height: 30,
    rotate: RotateAngle.ROTATE_0
  });

  // 繪製邊框（使用4條線代替矩形，避免SDK bug）
  const margin = 1;
  const lineWidth = 0.3;

  // 上邊
  await printer.drawLine({ x: margin, y: margin, width: 48, height: lineWidth, lineType: 1, rotate: 0 });
  // 下邊
  await printer.drawLine({ x: margin, y: 29, width: 48, height: lineWidth, lineType: 1, rotate: 0 });
  // 左邊
  await printer.drawLine({ x: margin, y: margin, width: lineWidth, height: 28, lineType: 1, rotate: 0 });
  // 右邊
  await printer.drawLine({ x: 49, y: margin, width: lineWidth, height: 28, lineType: 1, rotate: 0 });

  // 標題
  await printer.drawText({
    x: 3, y: 3,
    width: 44, height: 5,
    value: '品號：M02208-00012',
    fontSize: 3,
    rotate: RotateAngle.ROTATE_0
  });

  // 分隔線
  await printer.drawLine({
    x: 3, y: 9,
    width: 44, height: 0.3,
    lineType: 1,
    rotate: RotateAngle.ROTATE_0
  });

  // 條碼
  await printer.drawBarcode({
    x: 3, y: 12,
    width: 44, height: 14,
    value: 'M02208-00012',
    codeType: BarcodeType.CODE128,
    rotate: RotateAngle.ROTATE_0,
    fontSize: 3,
    textHeight: 3,
    textPosition: TextPosition.BOTTOM
  });

  await printer.commitJob(1);
  await printer.endJob();
}
```

### 5.6 批量打印多個條碼

```typescript
async function batchPrint() {
  const contents = ['ITEM-001', 'ITEM-002', 'ITEM-003', 'ITEM-004', 'ITEM-005'];

  await barcodePrinter.batchPrint(
    contents,
    {
      type: BarcodeType.CODE128,
      labelWidth: 40,
      labelHeight: 20
    },
    1,  // 每個打印 1 份
    3,  // 打印濃度
    1,  // 間隙紙
    1   // 熱敏模式
  );

  console.log(`已打印 ${contents.length} 個標籤`);
}
```

---

## 6. 輔助類 API

### 6.1 BarcodeHelper 條碼參數構建器

鏈式調用構建條碼參數：

```typescript
import { BarcodeHelper, BarcodeType, TextPosition } from './src';

const helper = new BarcodeHelper()
  .setContent('DEMO-12345')           // 設置內容
  .setType(BarcodeType.CODE128)       // 設置類型
  .setLabelSize(50, 30)               // 設置標籤尺寸 (mm)
  .setSize(40, 15)                    // 設置條碼尺寸 (mm)（可選）
  .setMargin(2)                       // 設置邊距 (mm)
  .setFontSize(3)                     // 設置字體大小 (mm)
  .setTextPosition(TextPosition.BOTTOM) // 設置文本位置
  .setRotate(RotateAngle.ROTATE_0);   // 設置旋轉角度

// 構建參數
const barcodeParams = helper.build();           // 條碼繪製參數
const boardParams = helper.buildBoardParams();  // 畫板初始化參數

// 重置並重新使用
helper.reset().setContent('NEW-CODE').setType(BarcodeType.EAN13);
```

### 6.2 BarcodePrinter 快速打印類

簡化打印流程：

```typescript
import { JingchenPrinter, BarcodePrinter, BarcodeType } from './src';

const printer = new JingchenPrinter();
const barcodePrinter = new BarcodePrinter(printer);

// 快速打印（自動處理 startJob/initBoard/draw/commit/endJob）
await barcodePrinter.quickPrint({
  content: 'DEMO-001',
  type: BarcodeType.CODE128,
  labelWidth: 40,
  labelHeight: 20
}, 3);  // 打印 3 份

// 快速預覽
const previewBase64 = await barcodePrinter.quickPreview({
  content: 'DEMO-001',
  type: BarcodeType.CODE128,
  labelWidth: 40,
  labelHeight: 20
});

// 批量打印
await barcodePrinter.batchPrint(
  ['CODE-001', 'CODE-002', 'CODE-003'],
  { type: BarcodeType.CODE128, labelWidth: 40, labelHeight: 20 }
);
```

### 6.3 CommonBarcodes 常用條碼快捷方法

```typescript
import { CommonBarcodes } from './src';

// CODE128（最常用，支持所有字符）
const code128 = CommonBarcodes.code128('DEMO-12345', 40, 20);

// EAN13（13位數字商品碼）
const ean13 = CommonBarcodes.ean13('6901234567892', 50, 30);

// EAN8（8位數字商品碼）
const ean8 = CommonBarcodes.ean8('12345678', 30, 15);

// CODE39（支持大寫字母和數字）
const code39 = CommonBarcodes.code39('DEMO-001', 50, 20);

// ITF25（交叉25碼，長度必須為偶數）
const itf25 = CommonBarcodes.itf25('12345678', 60, 30);

// 使用生成的配置打印
await barcodePrinter.quickPrint(code128);
```

---

## 7. 配置參考表

### 7.1 條碼類型

| 類型 | 枚舉值 | 內容要求 | 說明 |
|------|--------|----------|------|
| CODE128 | 20 | 任意 ASCII，1-80 字符 | 最常用，通用條碼 |
| UPC-A | 21 | 12 位數字 | 北美商品碼 |
| UPC-E | 22 | 8 位數字 | 壓縮版 UPC |
| EAN8 | 23 | 8 位數字 | 短商品碼 |
| EAN13 | 24 | 13 位數字 | 國際商品碼 |
| CODE93 | 25 | ASCII，1-80 字符 | 高密度條碼 |
| CODE39 | 26 | 大寫字母、數字、-. $/+% | 工業標準 |
| CODEBAR | 27 | 數字和 -$:/.+ | 物流醫療 |
| ITF25 | 28 | 偶數長度數字 | 交叉25碼 |

### 7.2 二維碼類型

| 類型 | 枚舉值 |
|------|--------|
| QR_CODE | 31 |
| PDF417 | 32 |
| DATA_MATRIX | 33 |
| AZTEC | 34 |

### 7.3 標籤尺寸

| 名稱 | 尺寸 (mm) | 適用場景 |
|------|-----------|----------|
| SMALL_1 | 20 x 10 | 小型價簽 |
| SMALL_2 | 30 x 15 | 小型標籤 |
| SMALL_3 | 40 x 20 | 標準小標籤 |
| MEDIUM_1 | 40 x 30 | 中型標籤 |
| MEDIUM_2 | 50 x 30 | 標準中標籤 |
| MEDIUM_3 | 60 x 40 | 產品標籤 |
| LARGE_1 | 80 x 50 | 大型標籤 |
| LARGE_2 | 100 x 60 | 物流標籤 |
| LARGE_3 | 100 x 80 | 包裝標籤 |
| SHELF | 60 x 30 | 貨架標籤 |
| PRICE | 40 x 20 | 價格標籤 |
| LOGISTICS | 100 x 100 | 物流標籤 |

### 7.4 打印濃度

| 值 | 說明 | 適用場景 |
|----|------|----------|
| 1-2 | 淺色 | 熱敏紙 |
| 3 | 標準（默認） | 大多數場景 |
| 4-5 | 深色 | 不干膠標籤 |
| 6-15 | 更深 | 特殊材質 |

### 7.5 旋轉角度

| 枚舉 | 值 | 說明 |
|------|-----|------|
| ROTATE_0 | 0 | 不旋轉 |
| ROTATE_90 | 90 | 順時針 90° |
| ROTATE_180 | 180 | 旋轉 180° |
| ROTATE_270 | 270 | 順時針 270° |

### 7.6 支持的打印機型號

B 系列: B1, B21, B3S, B50, B50W, B18
K 系列: K2, K3, K3W
M 系列: M2, M3
其他: D11, D110, T1, T2

---

## 8. 進階功能

### 8.1 PrintJob 打印任務管理

處理 SDK 的 `count=1` bug，自動添加佔位標籤：

```typescript
import { PrintJob } from './src/helpers';

const job = await PrintJob.create(printer, {
  count: 5,           // 總打印份數
  density: 3,         // 打印濃度
  labelWidth: 50,     // 標籤寬度
  labelHeight: 30     // 標籤高度
});

// 打印多個標籤
for (const product of products) {
  await job.printLabel(async () => {
    await printer.drawText({ ... });
    await printer.drawBarcode({ ... });
  });
}

await job.end();
```

### 8.2 LabelBuilder 標籤構建器

Fluent API 風格構建標籤：

```typescript
import { LabelBuilder } from './src/helpers';

const builder = new LabelBuilder(printer, 50, 30);

await builder
  .init()
  .then(b => b.drawBorder(2, 0.5))
  .then(b => b.drawText(3, 4, '品號：ABC-001', { fontSize: 3 }))
  .then(b => b.drawHorizontalLine(10))
  .then(b => b.drawBarcode(3, 12, 'ABC-001', BarcodeType.CODE128))
  .then(b => b.commit(1));
```

### 8.3 SDK 延遲配置

原廠 SDK 需要固定延遲等待：

```typescript
import { SDK_DELAYS, delay } from './src/config';

// initSDK 後等待
await printer.initSDK();
await delay(SDK_DELAYS.AFTER_INIT);  // 2000ms

// commitJob 後等待
await printer.commitJob(1);
await delay(SDK_DELAYS.AFTER_COMMIT);  // 1000ms
```

---

## 9. 故障排除

### 9.1 常見錯誤碼

| 錯誤碼 | 說明 | 解決方案 |
|--------|------|----------|
| 0 | 成功 | - |
| -1 | 打印服務未連接 | 確認精臣打印服務已啟動 |
| -2 | 打印機未連接/忙碌 | 重新連接打印機或等待 |
| -3 | 參數無效 | 檢查傳入參數 |
| -4 | SDK 未初始化 | 調用 initSDK() |
| -5 | 畫板未初始化 | 調用 initBoard() |
| -6 | 打印失敗 | 檢查打印機狀態 |
| -7 | 操作超時 | 增加超時時間或重試 |
| 23 | 無設備 | 檢查打印機連接 |

### 9.2 連接問題

**問題**: `connectService()` 超時
**解決**:
1. 確認精臣打印服務已安裝並運行
2. 檢查系統托盤是否有精臣圖標
3. 確認端口 37989 未被佔用

**問題**: `scanUSBPrinters()` 返回空數組
**解決**:
1. 檢查 USB 線連接
2. 嘗試重新插拔 USB
3. 確認打印機已開機

### 9.3 打印問題

**問題**: 打印內容空白
**解決**:
1. 確認在 `initBoard()` 後調用繪製方法
2. 檢查坐標是否在標籤範圍內
3. 確認 `commitJob()` 已調用

**問題**: 條碼無法掃描
**解決**:
1. 增加條碼尺寸
2. 提高打印濃度
3. 確認條碼內容符合類型要求

### 9.4 SDK 已知限制

1. **一問一答串行模式**: SDK 必須等待上一個命令完成才能發送下一個
2. **count=1 Bug**: 當 startJob 的 count=1 時可能有問題，使用 PrintJob 類自動處理
3. **drawGraph 底線消失**: 繪製矩形時底線可能消失，使用 4 條線代替
4. **需要固定延遲**: initSDK 和 commitJob 後需要等待

---

## 版本歷史

- **1.0.0** - 初始版本
  - 支持 USB/WiFi 打印機連接
  - 支持多種條碼類型打印
  - 提供快速打印和批量打印功能
