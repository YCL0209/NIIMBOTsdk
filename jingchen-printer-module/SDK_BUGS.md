# 精臣 SDK Bug 記錄

## ⚠️ 重要規則：必須使用官方 API

**精臣 SDK 的所有 API 都是他們自己開發的，必須嚴格按照官方 DEMO 的方式調用！**

### 參考資料
- 官方 DEMO：`DEMO/js/iJcPrinterSdk_third.js`
- 官方 API 定義：`DEMO/js/api/jcPrinterSdk_api_third.js`

### 常見錯誤示例

| 錯誤用法 | 正確用法 | 說明 |
|---------|---------|------|
| `GenerateLablePreView` | `generateImagePreviewImage(8)` | 預覽功能 |

### 遇到 `no this interface` 錯誤時
1. 檢查官方 DEMO 是否有使用該 API
2. 對照官方 DEMO 的調用方式
3. 可能是 API 名稱拼錯或參數格式不對

---

## 已知問題與 Workaround

### 1. startJob count=1 導致標籤底部截斷

**問題描述**：
當 `startJob(printDensity, printLabelType, printMode, count)` 的 `count=1` 時，標籤底部會被截斷，矩形邊框不完整。

**重現步驟**：
```typescript
await printer.startJob(3, 1, 1, 1);  // count=1
await drawLabel();
await printer.commitJob(1);
await printer.endJob();
// 結果：標籤底部截斷
```

**Workaround**：
永遠使用 `count >= 2`，第一張當佔位標籤：
```typescript
await printer.startJob(3, 1, 1, 2);  // count=2

// 第一張：佔位標籤（吸收 bug）
await drawTestLabel();
await printer.commitJob(1);

// 第二張：真正的標籤
await drawProductLabel();
await printer.commitJob(1);

await printer.endJob();
```

---

### 2. drawGraph graphType:3（矩形）底線消失

**問題描述**：
使用 `DrawLableGraph` 繪製矩形時，某些情況下底線會消失。

**Workaround**：
用 4 條線 (`DrawLableLine`) 手動繪製矩形：
```typescript
async function drawRectangleWithLines(x, y, width, height, lineWidth) {
  await printer.drawLine({ x, y, height: lineWidth, width });  // 上
  await printer.drawLine({ x, y: y + height - lineWidth, height: lineWidth, width });  // 下
  await printer.drawLine({ x, y, height, width: lineWidth });  // 左
  await printer.drawLine({ x: x + width - lineWidth, y, height, width: lineWidth });  // 右
}
```

---

### 3. 異步處理需要延遲

**問題描述**：
SDK 的繪圖和打印操作是異步的，如果不加延遲，後續操作可能在前一個操作完成前執行，導致渲染異常。

**Workaround**：
每個繪圖操作後加延遲：
```typescript
await printer.drawText({...});
await new Promise(resolve => setTimeout(resolve, 100));  // 100ms 延遲

await printer.commitJob(1);
await new Promise(resolve => setTimeout(resolve, 1000));  // 1秒延遲
```

---

### 4. 文字換行 `\n` 導致異常

**問題描述**：
在 `drawText` 的 `value` 中使用 `\n` 換行會導致 SDK 異常。

**Workaround**：
每行文字用獨立的 `drawText` 調用：
```typescript
// 錯誤
await printer.drawText({ value: "第一行\n第二行" });

// 正確
await printer.drawText({ value: "第一行", y: 4 });
await printer.drawText({ value: "第二行", y: 11 });
```

---

## SDK 參數說明

### startJob 參數
| 參數 | 說明 | 建議值 |
|------|------|--------|
| printDensity | 打印濃度 1-15 | 3 |
| printLabelType | 紙張類型 | 1=間隙紙, 3=連續紙 |
| printMode | 打印模式 | 1=熱敏, 2=熱轉印 |
| count | 總打印份數 | **必須 >= 2** |

### drawText 參數
| 參數 | 說明 |
|------|------|
| x, y | 左上角座標 (mm) |
| width, height | 文字區域大小 (mm) |
| fontSize | 字體大小 (mm) |
| fontFamily | 字體名稱（如 "宋体"）|
| textAlignHorizonral | 0=左, 1=中, 2=右 |
| textAlignVertical | 0=上, 1=中, 2=下 |
| lineMode | 6=自動換行並截斷超出內容 |
