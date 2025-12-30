/**
 * MD 檔案解析器
 * 從 Markdown 檔案中解析產品和訂單資料
 */

/**
 * 產品資料
 */
export interface ProductData {
  /** 品號 */
  productNo: string;
  /** 品名 */
  productName: string;
  /** 規格 */
  productSpec: string;
}

/**
 * 訂單資料
 */
export interface Order {
  /** 單號 */
  orderNo: string;
  /** 產品列表 */
  products: ProductData[];
}

/**
 * MD 檔案解析器
 */
export class MDParser {
  /**
   * 從 MD 檔案內容解析產品資料（舊版格式，無單號）
   *
   * 支持的格式：
   * ```
   * 品號: ABC-001
   * 品名: 產品名稱
   * 規格: 規格說明
   * ```
   *
   * @param mdContent MD 檔案內容
   * @returns 產品資料陣列
   */
  static parseProducts(mdContent: string): ProductData[] {
    const products: ProductData[] = [];
    const lines = mdContent.split('\n');

    let currentProduct: Partial<ProductData> = {};

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('品號:')) {
        currentProduct.productNo = trimmed.replace('品號:', '').trim();
      } else if (trimmed.startsWith('品名:')) {
        currentProduct.productName = trimmed.replace('品名:', '').trim();
      } else if (trimmed.startsWith('規格:')) {
        currentProduct.productSpec = trimmed.replace('規格:', '').trim();

        // 當三個欄位都有了，就加入產品列表
        if (currentProduct.productNo && currentProduct.productName && currentProduct.productSpec) {
          products.push(currentProduct as ProductData);
          currentProduct = {};
        }
      }
    }

    return products;
  }

  /**
   * 從 MD 檔案內容解析訂單與產品（新版格式，含單號）
   *
   * 支持的格式：
   * ```
   * ## 單號: 5103-20251009010
   *
   * 品號: ABC-001
   * 品名: 產品名稱
   * 規格: 規格說明
   *
   * ## 單號: 5103-20251009011
   * ...
   * ```
   *
   * 或簡化格式：
   * ```
   * ## 5103-20251009010
   * ...
   * ```
   *
   * @param mdContent MD 檔案內容
   * @returns 訂單資料陣列
   */
  static parseOrders(mdContent: string): Order[] {
    const orders: Order[] = [];
    const lines = mdContent.split('\n');

    let currentOrder: Order | null = null;
    let currentProduct: Partial<ProductData> = {};

    for (const line of lines) {
      const trimmed = line.trim();

      // 識別單號（支持兩種格式：## 單號: XXX 或 ## XXX）
      if (trimmed.startsWith('## 單號:') || (trimmed.startsWith('## ') && !trimmed.startsWith('### '))) {
        // 保存前一個產品
        if (currentProduct.productNo && currentProduct.productName && currentProduct.productSpec && currentOrder) {
          currentOrder.products.push(currentProduct as ProductData);
          currentProduct = {};
        }

        // 保存前一個訂單
        if (currentOrder && currentOrder.products.length > 0) {
          orders.push(currentOrder);
        }

        // 創建新訂單
        const orderNo = trimmed.replace('## 單號:', '').replace('##', '').trim();
        currentOrder = { orderNo, products: [] };
      }
      // 識別產品數據
      else if (trimmed.startsWith('品號:')) {
        // 保存前一個產品
        if (currentProduct.productNo && currentProduct.productName && currentProduct.productSpec && currentOrder) {
          currentOrder.products.push(currentProduct as ProductData);
        }
        currentProduct = { productNo: trimmed.replace('品號:', '').trim() };
      } else if (trimmed.startsWith('品名:')) {
        currentProduct.productName = trimmed.replace('品名:', '').trim();
      } else if (trimmed.startsWith('規格:')) {
        currentProduct.productSpec = trimmed.replace('規格:', '').trim();
      }
    }

    // 保存最後一個產品
    if (currentProduct.productNo && currentProduct.productName && currentProduct.productSpec && currentOrder) {
      currentOrder.products.push(currentProduct as ProductData);
    }

    // 保存最後一個訂單
    if (currentOrder && currentOrder.products.length > 0) {
      orders.push(currentOrder);
    }

    return orders;
  }

  /**
   * 自動判斷格式並解析
   * 如果包含單號標記，使用新版格式；否則使用舊版格式
   *
   * @param mdContent MD 檔案內容
   * @returns 解析結果（訂單陣列或產品陣列）
   */
  static parse(mdContent: string): { type: 'orders'; data: Order[] } | { type: 'products'; data: ProductData[] } {
    // 檢查是否包含單號標記
    const hasOrderNumbers = mdContent.includes('## 單號:') || /^## \d{4,}/m.test(mdContent);

    if (hasOrderNumbers) {
      return { type: 'orders', data: this.parseOrders(mdContent) };
    } else {
      return { type: 'products', data: this.parseProducts(mdContent) };
    }
  }

  /**
   * 計算總標籤數
   *
   * @param orders 訂單陣列
   * @param includeOrderLabels 是否包含單號標籤
   * @returns 總標籤數
   */
  static countLabels(orders: Order[], includeOrderLabels: boolean = true): number {
    let count = 0;
    for (const order of orders) {
      if (includeOrderLabels) {
        count += 1;  // 單號標籤
      }
      count += order.products.length;  // 產品標籤
    }
    return count;
  }
}
