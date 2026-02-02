import express from 'express';
import { PORT, HOST } from './config';
import { authMiddleware } from './middleware/auth';
import * as client from './printer/client';
import printRouter from './routes/print';
import statusRouter from './routes/status';

const app = express();

app.use(express.json({ limit: '10mb' }));

// Auth middleware
app.use(authMiddleware);

// Health check (skips auth via middleware)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    wsConnected: client.isConnected(),
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/print-label', printRouter);
app.use('/printer', statusRouter);

// Connect to Jingchen SDK WebSocket on startup
client.connect();

app.listen(PORT, HOST, () => {
  console.log(`[SERVER] Jingchen Bridge running on http://${HOST}:${PORT}`);
  console.log(`[SERVER] Health check: http://${HOST}:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[SERVER] Shutting down...');
  client.disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[SERVER] Shutting down...');
  client.disconnect();
  process.exit(0);
});
