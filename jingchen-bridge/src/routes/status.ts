import { Router, Request, Response } from 'express';
import * as client from '../printer/client';
import * as commands from '../printer/commands';

const router = Router();

// GET /printer/status
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    wsConnected: client.isConnected(),
  });
});

// GET /printer/scan
router.get('/scan', async (_req: Request, res: Response) => {
  try {
    if (!client.isConnected()) {
      res.status(503).json({ error: 'WebSocket not connected to Jingchen SDK' });
      return;
    }

    await commands.initSDK();
    const printers = await commands.scanUSBPrinters();

    res.json({ printers });
  } catch (error: any) {
    res.status(500).json({
      error: 'Scan failed',
      message: error.message,
    });
  }
});

export default router;
