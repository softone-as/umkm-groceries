import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import type { Server } from 'node:http';
import { createApp } from './app.js';
import { pool } from './db/pool.js';
import { LocalDiskImageStorageAdapter } from './services/local-disk-storage-adapter.js';

/** Starts the HTTP server and closes its listener and database pool on shutdown signals. */
export async function startServer(port = Number(process.env['PORT'] ?? 3000)): Promise<Server> {
  const storage = new LocalDiskImageStorageAdapter();
  await storage.ensureDirectory();

  const app = createApp({ imageDirectory: storage.directory });
  const server = app.listen(port);
  let shutdownStarted = false;

  const shutdown = (): void => {
    if (shutdownStarted) return;
    shutdownStarted = true;
    server.close((error) => {
      if (error) {
        console.error('HTTP server shutdown failed.');
        process.exitCode = 1;
      }
      void pool.end().catch(() => {
        console.error('Database pool shutdown failed.');
        process.exitCode = 1;
      });
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void startServer().catch(() => {
    console.error('API server failed to start.');
    process.exitCode = 1;
  });
}