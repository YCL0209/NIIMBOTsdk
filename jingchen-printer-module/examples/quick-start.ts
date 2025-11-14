/**
 * 快速入门示例
 * Quick Start Example
 */

import {
  JingchenPrinter,
  BarcodePrinter,
  CommonBarcodes,
  BarcodeType,
  ConnectionType,
  EventType
} from '../src/index';

async function main() {
  // 1. 创建打印机实例
  console.log('1. 创建打印机实例...');
  const printer = new JingchenPrinter();
  const barcodePrinter = new BarcodePrinter(printer);

  // 2. 注册事件监听（可选）
  console.log('2. 注册事件监听...');
  printer.on(EventType.SERVICE_CONNECTED, () => {
    console.log('✓ 打印服务已连接');
  });

  printer.on(EventType.PRINTER_CONNECTED, (data) => {
    console.log('✓ 打印机已连接:', data);
  });

  printer.on(EventType.PRINT_COMPLETE, () => {
    console.log('✓ 打印完成');
  });

  try {
    // 3. 连接打印服务
    console.log('3. 连接打印服务...');
    await printer.connectService();
    console.log('✓ 打印服务连接成功');

    // 4. 初始化 SDK
    console.log('4. 初始化 SDK...');
    await printer.initSDK();
    console.log('✓ SDK 初始化成功');

    // 5. 扫描打印机
    console.log('5. 扫描 USB 打印机...');
    const printers = await printer.scanUSBPrinters();
    console.log(`✓ 找到 ${printers.length} 台打印机`);

    if (printers.length === 0) {
      throw new Error('未找到打印机，请检查打印机连接');
    }

    // 6. 连接打印机
    console.log('6. 连接打印机...');
    const firstPrinter = printers[0];
    await printer.connectPrinter(
      ConnectionType.USB,
      firstPrinter.printerName,
      firstPrinter.port
    );
    console.log('✓ 打印机连接成功');

    // 7. 快速打印 CODE128 条码
    console.log('7. 打印 CODE128 条码...');
    await barcodePrinter.quickPrint({
      content: 'DEMO-12345',
      type: BarcodeType.CODE128,
      labelWidth: 40,
      labelHeight: 20
    });
    console.log('✓ CODE128 条码打印成功');

    // 8. 打印 EAN13 商品条码
    console.log('8. 打印 EAN13 条码...');
    const ean13Config = CommonBarcodes.ean13('6901234567892', 40, 20);
    await barcodePrinter.quickPrint(ean13Config);
    console.log('✓ EAN13 条码打印成功');

    // 9. 批量打印
    console.log('9. 批量打印...');
    const batchContents = ['BATCH-001', 'BATCH-002', 'BATCH-003'];
    await barcodePrinter.batchPrint(batchContents, {
      type: BarcodeType.CODE128,
      labelWidth: 40,
      labelHeight: 20
    });
    console.log('✓ 批量打印完成');

    console.log('\n🎉 所有测试完成！');

  } catch (error: any) {
    console.error('❌ 错误:', error.message);
    if (error.details) {
      console.error('详细信息:', error.details);
    }
  } finally {
    // 10. 清理资源
    console.log('10. 断开连接...');
    printer.disconnectService();
    console.log('✓ 已断开连接');
  }
}

// 运行示例
main().catch(console.error);
