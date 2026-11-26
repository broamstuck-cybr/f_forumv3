import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { app } from '../../server/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const distDir = path.join(projectRoot, 'dist');

const hostApp = express();
hostApp.disable('x-powered-by');
hostApp.use(app);
hostApp.use(express.static(distDir, { index: 'index.html' }));
hostApp.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const server = http.createServer(hostApp);
server.listen(0, '127.0.0.1', () => {
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  const url = `http://127.0.0.1:${port}`;
  if (process.env.E2E_STRICT_CORS !== '1') {
    const existing = (process.env.CORS_ALLOWED_ORIGINS || '').trim();
    process.env.CORS_ALLOWED_ORIGINS = existing ? `${existing},${url}` : url;
  }
  process.stdout.write(`${JSON.stringify({ url, port })}\n`);
});

function shutdown() {
  server.closeAllConnections?.();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
