import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as commands from '../printer/commands';
import { drawContent, ContentItem } from '../printer/templates';
import {
  DEFAULT_DENSITY,
  DEFAULT_LABEL_TYPE,
  DEFAULT_PRINT_MODE,
  LABEL_TYPE_MAP,
  PRINT_MODE_MAP,
  SDK_DELAYS,
  delay,
} from '../config';

const router = Router();

// Print mutex — SDK is stateful, one job at a time
let printing = false;

// Remember last connected printer (SDK loses device list after endJob)
let lastPrinter: { name: string; port: number } | null = null;

interface PrintRequest {
  printer?: {
    name?: string;
    port?: number;
  };
  label: {
    width: number;
    height: number;
    rotate?: number;
    density?: number;
    labelType?: string | number;
    printMode?: string | number;
  };
  content: ContentItem[];
  copies?: number;
}

router.post('/', async (req: Request, res: Response) => {
  if (printing) {
    res.status(429).json({ error: 'Printer busy, another job is in progress' });
    return;
  }

  const body: PrintRequest = req.body;

  if (!body.label || !body.content || !Array.isArray(body.content)) {
    res.status(400).json({ error: 'Missing required fields: label, content[]' });
    return;
  }

  const jobId = uuidv4();
  printing = true;
  let jobStarted = false;

  try {
    console.log(`[PRINT] Job ${jobId} starting...`);

    // 1. Init SDK
    await commands.initSDK();
    await delay(SDK_DELAYS.AFTER_INIT);

    // 2. Scan and connect printer
    let targetName: string;
    let targetPort: number;

    if (body.printer?.name && body.printer?.port !== undefined) {
      // Explicit printer specified, skip scan
      targetName = body.printer.name;
      targetPort = body.printer.port;
    } else {
      const printers = await commands.scanUSBPrinters();
      if (printers.length > 0) {
        targetName = printers[0].printerName;
        targetPort = printers[0].port;
      } else if (lastPrinter) {
        // Fallback to last known printer
        console.log(`[PRINT] No printers found, using last known: ${lastPrinter.name}`);
        targetName = lastPrinter.name;
        targetPort = lastPrinter.port;
      } else {
        res.status(503).json({ error: 'No USB printers found' });
        return;
      }
    }

    await commands.connectPrinter(targetName, targetPort);
    lastPrinter = { name: targetName, port: targetPort };

    // 3. Resolve label type / print mode
    let labelType: number = DEFAULT_LABEL_TYPE;
    if (body.label.labelType !== undefined) {
      if (typeof body.label.labelType === 'string') {
        labelType = LABEL_TYPE_MAP[body.label.labelType] ?? DEFAULT_LABEL_TYPE;
      } else {
        labelType = body.label.labelType;
      }
    }

    let printMode: number = DEFAULT_PRINT_MODE;
    if (body.label.printMode !== undefined) {
      if (typeof body.label.printMode === 'string') {
        printMode = PRINT_MODE_MAP[body.label.printMode] ?? DEFAULT_PRINT_MODE;
      } else {
        printMode = body.label.printMode;
      }
    }

    const density = body.label.density ?? DEFAULT_DENSITY;
    const copies = body.copies ?? 1;

    // 4. Start job
    await commands.startJob(density, labelType, printMode, copies);
    jobStarted = true;

    // 5. Init board
    await commands.initBoard(
      body.label.width,
      body.label.height,
      body.label.rotate ?? 0
    );

    // 6. Draw content
    await drawContent(body.content);
    await delay(SDK_DELAYS.AFTER_DRAW_COMPLETE);

    // 7. Commit job
    await commands.commitJob(copies);
    await delay(SDK_DELAYS.AFTER_COMMIT);

    // 8. End job
    await commands.endJob();
    jobStarted = false;

    console.log(`[PRINT] Job ${jobId} completed`);
    res.json({
      success: true,
      jobId,
      printer: targetName,
      copies,
    });
  } catch (error: any) {
    console.error(`[PRINT] Job ${jobId} failed:`, error.message);

    // Ensure endJob is always called if job was started
    if (jobStarted) {
      try {
        await commands.endJob();
      } catch (e) {
        console.error('[PRINT] endJob cleanup failed:', e);
      }
    }

    res.status(500).json({
      error: 'Print failed',
      message: error.message,
      code: error.code,
      jobId,
    });
  } finally {
    printing = false;
  }
});

export default router;
