# 精臣打印机 TypeScript 封装模块

> 精臣 PC 端 Web SDK 的 TypeScript 封装，提供类型安全、Promise 化的 API 接口，让条码打印更简单。

## 📋 功能特性

- ✅ 完整的 TypeScript 类型定义
- ✅ Promise 化的 API（原 SDK 为回调式）
- ✅ 链式调用设计，使用更便捷
- ✅ 支持 9 种条码类型（CODE128、EAN13、EAN8 等）
- ✅ 内置条码内容验证
- ✅ 事件驱动架构
- ✅ 错误处理和重试机制
- ✅ 开箱即用的测试页面

## 🎯 支持的条码类型

| 条码类型 | 说明 | 适用场景 |
|---------|------|---------|
| CODE128 | 支持所有 ASCII 字符 | 最常用，通用场景 |
| EAN13 | 13 位数字商品码 | 国际商品条码 |
| EAN8 | 8 位数字商品码 | 小型商品条码 |
| CODE39 | 支持数字、大写字母 | 工业、图书馆 |
| CODE93 | ASCII 全字符集 | 物流、仓储 |
| UPC-A | 12 位北美商品码 | 北美零售 |
| UPC-E | 8 位压缩版 UPC | 小型商品 |
| CODEBAR | 物流医疗专用 | 血库、快递 |
| ITF25 | 交叉 25 码 | 仓储物流 |

## 📦 安装依赖

```bash
cd jingchen-printer-module
npm install
```

## 🚀 快速开始

### 1. 基础使用

```typescript
import { JingchenPrinter, BarcodeType, ConnectionType } from './src';

// 创建打印机实例
const printer = new JingchenPrinter();

// 连接打印服务
await printer.connectService();

// 初始化 SDK
await printer.initSDK();

// 扫描并连接打印机
const printers = await printer.scanUSBPrinters();
await printer.connectPrinter(ConnectionType.USB, printers[0].printerName, printers[0].port);

// 1. 开始打印任务
await printer.startJob(3, 1, 1, 1);  // 浓度3, 间隙纸, 热敏模式, 1份

// 2. 初始化画板
await printer.initBoard({
  width: 40,
  height: 20,
  rotate: 0,
  path: '',
  verticalShift: 0,
  HorizontalShift: 0
});

// 3. 绘制条码
await printer.drawBarcode({
  x: 2,
  y: 2,
  width: 36,
  height: 16,
  value: '12345678',
  codeType: BarcodeType.CODE128,
  rotate: 0,
  fontSize: 3.2,
  textHeight: 3.2,
  textPosition: 0
});

// 4. 提交打印
await printer.commitJob(1);

// 5. 结束任务
await printer.endJob();
```

### 2. 使用辅助类快速打印

```typescript
import { JingchenPrinter, BarcodePrinter, BarcodeType } from './src';

const printer = new JingchenPrinter();
const barcodePrinter = new BarcodePrinter(printer);

// 连接服务和打印机（省略...）

// 一行代码完成打印
await barcodePrinter.quickPrint({
  content: '12345678',
  type: BarcodeType.CODE128,
  labelWidth: 40,
  labelHeight: 20
});
```

### 3. 使用常用条码生成器

```typescript
import { CommonBarcodes, BarcodePrinter } from './src';

// CODE128 条码
const code128Config = CommonBarcodes.code128('DEMO-12345', 40, 20);
await barcodePrinter.quickPrint(code128Config);

// EAN13 商品条码
const ean13Config = CommonBarcodes.ean13('6901234567892', 40, 20);
await barcodePrinter.quickPrint(ean13Config);

// EAN8 商品条码
const ean8Config = CommonBarcodes.ean8('12345678', 30, 15);
await barcodePrinter.quickPrint(ean8Config);
```

### 4. 批量打印

```typescript
const contents = ['BATCH-001', 'BATCH-002', 'BATCH-003'];

await barcodePrinter.batchPrint(contents, {
  type: BarcodeType.CODE128,
  labelWidth: 40,
  labelHeight: 20
});
```

### 5. 预览条码

```typescript
const base64Image = await barcodePrinter.quickPreview({
  content: '12345678',
  type: BarcodeType.CODE128,
  labelWidth: 40,
  labelHeight: 20
});

// 显示在页面上
document.getElementById('preview').innerHTML =
  `<img src="data:image/png;base64,${base64Image}" />`;
```

### 6. 链式调用

```typescript
import { BarcodeHelper } from './src';

const helper = new BarcodeHelper();
const barcodeParams = helper
  .setContent('12345678')
  .setType(BarcodeType.CODE128)
  .setLabelSize(40, 20)
  .setMargin(2)
  .setFontSize(3.2)
  .build();

await printer.drawBarcode(barcodeParams);
```

## 🎨 事件监听

```typescript
import { EventType } from './src';

// 服务连接事件
printer.on(EventType.SERVICE_CONNECTED, () => {
  console.log('打印服务已连接');
});

// 服务断开事件
printer.on(EventType.SERVICE_DISCONNECTED, () => {
  console.log('打印服务已断开');
});

// 打印机连接事件
printer.on(EventType.PRINTER_CONNECTED, (data) => {
  console.log('打印机已连接:', data);
});

// 打印完成事件
printer.on(EventType.PRINT_COMPLETE, (data) => {
  console.log('打印完成:', data);
});

// 打印机盖状态变化
printer.on(EventType.COVER_STATUS_CHANGED, (data) => {
  console.log('打印机盖状态:', data.status);
});

// 电量变化
printer.on(EventType.POWER_LEVEL_CHANGED, (data) => {
  console.log('电量等级:', data.level);
});
```

## 🧪 运行测试

### 方式 1：开发服务器（推荐）

```bash
npm install
npm run test
```

浏览器会自动打开 `http://localhost:8080`，您可以在测试页面中：
- 连接打印服务
- 扫描打印机
- 测试条码打印
- 查看预览效果
- 批量打印测试

### 方式 2：构建生产版本

```bash
npm run build
```

编译后的文件在 `dist/` 目录。

## 📖 打印流程说明

精臣打印机 SDK 遵循官方规范的 5 步打印流程：

### 完整打印流程

```typescript
// 1. 连接服务和打印机
await printer.connectService();
await printer.initSDK();
const printers = await printer.getAllPrinters();
await printer.connectPrinter(ConnectionType.USB, printers[0].printerName, printers[0].port);

// 2. 开始打印任务
await printer.startJob(
  3,                    // printDensity: 打印浓度 (1-15)
  LabelType.GAP_PAPER,  // printLabelType: 纸张类型
  1,                    // printMode: 1=热敏 2=热转印
  1                     // count: 总打印份数
);

// 3. 初始化画板
await printer.initBoard({
  width: 40,            // 标签宽度 (mm)
  height: 20,           // 标签高度 (mm)
  rotate: RotateAngle.ROTATE_0,
  verticalShift: 0,
  HorizontalShift: 0
});

// 4. 绘制内容
await printer.drawBarcode({
  x: 5,
  y: 5,
  width: 30,
  height: 10,
  value: '12345678',
  codeType: BarcodeType.CODE128,
  rotate: RotateAngle.ROTATE_0,
  fontSize: 3,
  textHeight: 3,
  textPosition: TextPosition.BOTTOM
});

// 5. 提交打印
await printer.commitJob(1);  // 打印 1 份

// 6. 结束任务
await printer.endJob();
```

### 流程要点

1. **startJob()** - 必须首先调用，设置打印参数和纸张类型
   - 参数 `count` 是总打印份数，用于多页打印
   - `printDensity` 范围因机型而异（1-5 或 1-15）

2. **initBoard()** - 初始化画板尺寸和方向
   - 每个打印任务只需调用一次
   - 设置标签的物理尺寸

3. **draw*()** - 绘制各种元素
   - 可以调用多次绘制不同元素
   - 支持条码、文本、二维码、图片、线条、图形

4. **commitJob()** - 提交当前页面到打印队列
   - 参数 `printQuantity` 是当前页的打印份数
   - 可以多次调用来打印多页

5. **endJob()** - 结束打印任务
   - 完成所有打印后必须调用
   - 释放打印资源

### 多页打印示例

```typescript
// 打印 3 页不同内容的标签
await printer.startJob(3, LabelType.GAP_PAPER, 1, 3);

for (let i = 0; i < 3; i++) {
  // 每页都需要初始化画板
  await printer.initBoard({ width: 40, height: 20, rotate: RotateAngle.ROTATE_0 });

  // 绘制该页内容
  await printer.drawText({
    x: 10,
    y: 10,
    width: 30,
    height: 10,
    value: `Page ${i + 1}`,
    rotate: RotateAngle.ROTATE_0,
    fontSize: 5
  });

  // 提交该页
  await printer.commitJob(1);
}

// 结束任务
await printer.endJob();
```

### ⚠️ 重要提示

- **废弃方法**: `print()` 方法已废弃，请使用 `startJob + commitJob + endJob` 流程
- **LabelType 变更**: 枚举值已更新（1-6, 10），请查看[类型定义](#-类型定义)章节
- **错误处理**: 建议使用 try-catch 包装整个打印流程

## 📚 API 文档

### JingchenPrinter 类

主打印机类，封装所有 SDK 功能。

#### 连接管理

- `connectService(): Promise<void>` - 连接打印服务
- `disconnectService(): void` - 断开打印服务
- `isServiceConnected(): boolean` - 检查服务连接状态

#### SDK 初始化

- `initSDK(params?: Partial<InitSdkParams>): Promise<void>` - 初始化 SDK
- `initBoard(params: InitDrawingBoardParams): Promise<void>` - 初始化画板

#### 打印机管理

- `scanUSBPrinters(): Promise<PrinterInfo[]>` - 扫描 USB 打印机
- `scanWiFiPrinters(): Promise<PrinterInfo[]>` - 扫描 WiFi 打印机
- `connectPrinter(type: ConnectionType, name: string, port: number): Promise<void>` - 连接打印机
- `disconnectPrinter(): Promise<void>` - 断开打印机
- `isPrinterConnected(): boolean` - 检查打印机连接状态
- `getCurrentPrinter(): PrinterInfo | null` - 获取当前打印机信息

#### 绘制操作

- `drawBarcode(params: BarcodeDrawParams): Promise<void>` - 绘制条码
- `drawText(params: TextDrawParams): Promise<void>` - 绘制文本
- `drawQRCode(params: QRCodeDrawParams): Promise<void>` - 绘制二维码
- `drawQRCodeWithLogo(params: QRCodeWithLogoParams): Promise<void>` - 绘制带Logo的二维码 ✨新增
- `drawImage(params: ImageDrawParams): Promise<void>` - 绘制图片
- `drawLine(params: LineDrawParams): Promise<void>` - 绘制线条
- `drawGraph(params: GraphDrawParams): Promise<void>` - 绘制图形（矩形、圆形、椭圆） ✨新增

#### 打印操作

- `startJob(printDensity, printLabelType, printMode, count): Promise<void>` - 开始打印任务
  - printDensity: 打印浓度（1-5 或 1-15，根据机型）
  - printLabelType: 纸张类型（见 LabelType 枚举）
  - printMode: 打印模式（1:热敏 2:热转印）
  - count: 总打印份数
- `commitJob(printQuantity?: number): Promise<void>` - 提交打印任务（默认1份）
- `endJob(): Promise<void>` - 结束打印任务
- `cancelJob(): Promise<void>` - 取消打印任务 ✨新增
- `generatePreview(params?: PreviewParams): Promise<string>` - 生成预览（返回 Base64）
- `generateImagePreviewImage(displayScale: number): Promise<string>` - 官方预览API ✨新增
- ~~`print(params?: Partial<PrintParams>): Promise<void>`~~ - **已废弃**，请使用 startJob + commitJob + endJob

#### 事件管理

- `on(event: EventType, listener: EventListener): void` - 监听事件
- `off(event: EventType, listener: EventListener): void` - 取消监听

### BarcodePrinter 类

条码打印辅助类，简化打印流程。

- `quickPrint(config: BarcodeGeneratorConfig, printCount?: number): Promise<void>` - 快速打印
- `quickPreview(config: BarcodeGeneratorConfig): Promise<string>` - 快速预览
- `batchPrint(contents: string[], config, printCount?: number): Promise<void>` - 批量打印

### BarcodeHelper 类

条码参数构建器，支持链式调用。

- `setContent(content: string): this` - 设置内容
- `setType(type: BarcodeType): this` - 设置类型
- `setSize(width: number, height: number): this` - 设置尺寸
- `setLabelSize(width: number, height: number): this` - 设置标签尺寸
- `setMargin(margin: number): this` - 设置边距
- `setFontSize(fontSize: number): this` - 设置字体大小
- `setTextPosition(position: TextPosition): this` - 设置文本位置
- `setRotate(rotate: RotateAngle): this` - 设置旋转角度
- `build(): BarcodeDrawParams` - 构建参数
- `buildBoardParams(): InitDrawingBoardParams` - 构建画板参数

### CommonBarcodes 类

常用条码快速生成器（静态方法）。

- `code128(content: string, width?: number, height?: number): BarcodeGeneratorConfig`
- `ean13(content: string, width?: number, height?: number): BarcodeGeneratorConfig`
- `ean8(content: string, width?: number, height?: number): BarcodeGeneratorConfig`
- `code39(content: string, width?: number, height?: number): BarcodeGeneratorConfig`
- `itf25(content: string, width?: number, height?: number): BarcodeGeneratorConfig`

## 🛠️ Helpers 模塊（進階封裝）

這些 Helpers 封裝了常用操作，並隱藏 SDK 的已知 Bug 和 Workaround。

### PrintJob 類

封裝打印任務管理，自動處理 SDK 的 count=1 Bug。

```typescript
import { PrintJob, LabelBuilder } from './src';

// 創建打印任務（內部自動處理 SDK bug）
const job = await PrintJob.create(printer, {
  count: 1,           // 每種標籤打印份數
  density: 3,         // 打印濃度
  labelWidth: 50,     // 標籤寬度
  labelHeight: 30     // 標籤高度
});

// 打印多個標籤
for (const product of products) {
  await job.printLabel(async () => {
    const builder = new LabelBuilder(printer, 50, 30);
    await builder
      .drawBorder()
      .then(b => b.drawText(3, 4, `品號：${product.no}`))
      .then(b => b.drawText(3, 11, `品名：${product.name}`));
  });
}

await job.end();
```

**注意**：PrintJob 會在 count ≤ 1 時自動添加佔位標籤，以繞過 SDK 的 count=1 bug。

### LabelBuilder 類

標籤繪製 Fluent API，簡化繪製操作。

```typescript
import { LabelBuilder, BarcodeType } from './src';

const builder = new LabelBuilder(printer, 50, 30);

await builder
  .drawBorder(2, 0.5)                    // 繪製邊框
  .then(b => b.drawText(3, 4, '品號：ABC-001', { fontSize: 3 }))
  .then(b => b.drawHorizontalLine(10))   // 水平分隔線
  .then(b => b.drawBarcode(3, 12, 'ABC-001', BarcodeType.CODE128));
```

### LabelTemplates 類

預設標籤模板（靜態方法）。

```typescript
import { LabelTemplates } from './src';

// 產品標籤
await LabelTemplates.productLabel(printer, 'ABC-001', '產品名稱', '規格說明');

// 單號標籤
await LabelTemplates.orderLabel(printer, '5103-20251009010');

// 帶條碼的標籤
await LabelTemplates.barcodeLabel(printer, '5103-001', 'M02208-00012', 'QS001-0027');
```

### MDParser 類

從 Markdown 檔案解析產品和訂單資料。

```typescript
import { MDParser } from './src';

const mdContent = `
## 單號: 5103-20251009010

品號: ABC-001
品名: 產品名稱
規格: 規格說明
`;

// 自動判斷格式
const result = MDParser.parse(mdContent);

if (result.type === 'orders') {
  console.log('訂單數:', result.data.length);
} else {
  console.log('產品數:', result.data.length);
}

// 計算標籤總數
const labelCount = MDParser.countLabels(result.data as Order[]);
```

### SDK_DELAYS 常量

可配置的 SDK 延遲時間常量，用於調整 SDK 異步處理等待時間。

```typescript
import { SDK_DELAYS, delay } from './src';

// 使用預設延遲
await delay(SDK_DELAYS.AFTER_INIT);     // initSDK 後等待
await delay(SDK_DELAYS.AFTER_COMMIT);   // commitJob 後等待
await delay(SDK_DELAYS.BETWEEN_DRAWS);  // 繪製操作之間

// 常量值
SDK_DELAYS = {
  AFTER_INIT: 2000,        // initSDK 後等待（毫秒）
  AFTER_COMMIT: 1000,      // commitJob 後等待
  BETWEEN_DRAWS: 100,      // 繪製操作之間
  AFTER_DRAW_COMPLETE: 300,// 繪製完成後
  RETRY_INTERVAL: 1000     // 重試間隔
}
```

## ⚠️ SDK 限制與已知問題

原廠 SDK 有以下限制，本模塊已封裝相應的 Workaround：

### 1. 一問一答串行模式
- SDK 只能同時處理一個請求，必須等待回應後才能發送下一個
- **處理方式**：JingchenPrinter 內部使用 Promise 隊列管理

### 2. apiName 作為回應 Key
- SDK 回應只包含 `apiName`，不支持 `requestId`
- 這是 SDK 設計限制，不是 Bug

### 3. count=1 Bug
- 當 startJob 的 count=1 時，可能出現異常行為
- **處理方式**：PrintJob 類會自動添加佔位標籤

### 4. 需要延遲等待
- SDK 沒有提供 ready 事件，需要 setTimeout 等待
- **處理方式**：使用 SDK_DELAYS 常量統一管理

### 5. drawGraph 矩形底線消失
- drawGraph 的 graphType=3（矩形）可能底線無法顯示
- **處理方式**：LabelBuilder.drawBorder() 使用 4 條線繪製

## 📋 类型定义

### LabelType（标签类型枚举）

⚠️ **重要变更**：LabelType 枚举值已更新以匹配官方 SDK 规范

```typescript
enum LabelType {
  GAP_PAPER = 1,        // 间隙纸
  BLACK_MARK = 2,       // 黑标纸
  CONTINUOUS = 3,       // 连续纸
  HOLE_PAPER = 4,       // 定孔纸
  TRANSPARENT = 5,      // 透明纸
  NAMEPLATE = 6,        // 标牌
  BLACK_MARK_GAP = 10   // 黑标间隙纸
}
```

使用示例：
```typescript
await printer.startJob(3, LabelType.GAP_PAPER, 1, 1);
```

### BarcodeType（条码类型枚举）

```typescript
enum BarcodeType {
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
```

### QRCodeType（二维码类型枚举）✨新增

```typescript
enum QRCodeType {
  QR_CODE = 31,
  PDF417 = 32,
  DATA_MATRIX = 33,
  AZTEC = 34
}
```

### RotateAngle（旋转角度枚举）

```typescript
enum RotateAngle {
  ROTATE_0 = 0,
  ROTATE_90 = 90,
  ROTATE_180 = 180,
  ROTATE_270 = 270
}
```

### TextPosition（文本位置枚举）

```typescript
enum TextPosition {
  BOTTOM = 0,  // 下方显示
  TOP = 1,     // 上方显示
  NONE = 2     // 不显示
}
```

### ConnectionType（连接类型枚举）

```typescript
enum ConnectionType {
  USB = 'USB',
  WIFI = 'WIFI'
}
```

## 🔧 集成到您的项目

### 1. 复制模块文件

将 `jingchen-printer-module/src/` 目录复制到您的项目中：

```
your-project/
  ├── src/
  │   ├── printer/          # 复制整个 src 目录到这里
  │   │   ├── types.ts
  │   │   ├── config.ts
  │   │   ├── JingchenPrinter.ts
  │   │   ├── BarcodeHelper.ts
  │   │   └── index.ts
  │   └── ...
```

### 2. 在您的 TypeScript 项目中使用

```typescript
import { JingchenPrinter, BarcodePrinter, BarcodeType } from './printer';

// 使用方式同上
const printer = new JingchenPrinter();
const barcodePrinter = new BarcodePrinter(printer);

// 连接打印服务
await printer.connectService();

// ... 其他操作
```

### 3. 配置 tsconfig.json

确保您的 `tsconfig.json` 包含必要的配置：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "esModuleInterop": true
  }
}
```

## ⚙️ 前置要求

1. **安装精臣打印服务**
   - 必须先安装精臣PC端打印服务
   - 服务默认运行在 `ws://127.0.0.1:37989`
   - 安装包位置：`打印服务（必须安装）` 目录

2. **连接打印机**
   - USB：直接连接
   - WiFi：需要先在同一局域网内配置打印机 WiFi

3. **支持的打印机型号**
   - B 系列：B1, B21, B3S, B50, B50W, B18
   - K 系列：K2, K3, K3W
   - M 系列：M2, M3
   - 其他：D11, D110, T1, T2

## 🪟 Windows 平台支持

本模块完全支持 Windows 平台！

### 跨平台兼容性

- ✅ **Windows 10/11** - 完全兼容
- ✅ **macOS** - 完全兼容
- ✅ **Linux** - 完全兼容

### Windows 专属安装指南

**如果您在 Windows 上使用本模块，请查看：**
- 📘 [WINDOWS_SETUP.md](WINDOWS_SETUP.md) - Windows 详细安装和配置指南
- 📋 [WINDOWS_TEST.md](WINDOWS_TEST.md) - Windows 兼容性测试清单

### Windows 快速开始

```powershell
# 在 PowerShell 中运行
cd jingchen-printer-module
npm install
npm run build
npm run test
```

### 常见 Windows 问题

1. **防火墙问题** - 需要允许端口 37989
   ```powershell
   # 以管理员身份运行
   New-NetFirewallRule -DisplayName "精臣打印服务" -Direction Inbound -Protocol TCP -LocalPort 37989 -Action Allow
   ```

2. **权限问题** - 某些命令可能需要管理员权限
   - 右键 PowerShell 选择"以管理员身份运行"

3. **路径问题** - 模块已正确处理 Windows 路径分隔符

详细信息请参考 [WINDOWS_SETUP.md](WINDOWS_SETUP.md)

## 💡 最佳实践

### 1. 错误处理

```typescript
try {
  await printer.connectService();
  await printer.initSDK();
  // ... 其他操作
} catch (error) {
  if (error instanceof PrinterError) {
    console.error('错误代码:', error.code);
    console.error('错误信息:', error.message);
    console.error('详细信息:', error.details);
  }
}
```

### 2. 条码内容验证

```typescript
// 模块会自动验证条码内容
try {
  await barcodePrinter.quickPrint({
    content: 'invalid',  // EAN13 需要 13 位数字
    type: BarcodeType.EAN13,
    labelWidth: 40,
    labelHeight: 20
  });
} catch (error) {
  // 会抛出验证错误: "EAN13 条码必须是 13 位，当前: 7 位"
}
```

### 3. 连接状态检查

```typescript
if (!printer.isServiceConnected()) {
  await printer.connectService();
}

if (!printer.isPrinterConnected()) {
  const printers = await printer.scanUSBPrinters();
  if (printers.length > 0) {
    await printer.connectPrinter(
      ConnectionType.USB,
      printers[0].printerName,
      printers[0].port
    );
  }
}
```

## 🐛 常见问题

### Q1: 无法连接打印服务
**A:** 确保精臣打印服务已安装并运行。检查服务是否在 `ws://127.0.0.1:37989` 监听。

### Q2: 找不到打印机
**A:**
- USB：检查打印机是否正确连接，尝试重新插拔
- WiFi：确保打印机和电脑在同一局域网，打印机已配置 WiFi

### Q3: 打印内容为空或不完整
**A:** 确保按顺序调用：`initSDK()` → `initBoard()` → `drawBarcode()` → `print()` → `endJob()`

### Q4: 条码无法识别
**A:**
- 检查条码内容是否符合该类型要求
- 调整打印浓度（1-15，推荐 3-5）
- 确保标签尺寸足够容纳条码

### Q5: TypeScript 类型错误
**A:** 确保安装了 TypeScript 和相关类型定义：
```bash
npm install --save-dev typescript @types/node
```

## 📖 示例代码

在 `examples/` 目录下（待添加）会提供更多示例：
- 基础打印示例
- 批量打印示例
- 复杂排版示例
- 错误处理示例
- React 集成示例
- Vue 集成示例

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 支持

如有问题，请：
1. 查看本 README 文档
2. 参考原 SDK 文档：`PC 端 Web SDK 接入包使用说明.pdf`
3. 查看测试页面示例代码

---

**Happy Printing! 🎉**
