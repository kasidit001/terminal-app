import sequelize from './config/database.js';
import Flight from './models/Flight.js'; // register model
import flightRoutes from './routes/flightRoutes.js';
import { terminalWsHandler, handleTerminalUpgrade, activeSessionCount } from './terminal/terminalWS.js';

import express from 'express';
import cors from 'cors';
import http from 'http';

const PORT = Number(process.env.PORT ?? 4000);

// ── Express app (REST API) ────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/api', flightRoutes);
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', terminalSessions: activeSessionCount() });
});

// ── Boot ──────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await sequelize.authenticate();
    console.log('[DB] Connection established.');
    await sequelize.sync({ force: false });
    console.log('[DB] Synchronized.');

    // Start Express on a random available port (0 = OS picks one for us)
    const exprServer = http.createServer(app);
    const exprPort = await new Promise<number>((resolve, reject) => {
      exprServer.listen(0, () => {
        const addr = exprServer.address();
        if (addr && typeof addr === 'object') resolve(addr.port);
        else reject(new Error('Could not determine Express port'));
      });
      exprServer.on('error', reject);
    });
    console.log(`[Express] REST API on internal port ${exprPort}`);

    // Bun.serve on the public port — handles WS + proxies REST to Express
    const server = Bun.serve({
      port: PORT,

      async fetch(req, server) {
        const url = new URL(req.url);

        // WebSocket upgrade
        if (url.pathname === '/ws/terminal') {
          return handleTerminalUpgrade(req, server)
            ?? new Response(null, { status: 101 });
        }

        // Proxy REST requests to Express
        const proxied = new Request(
          `http://localhost:${exprPort}${url.pathname}${url.search}`,
          { method: req.method, headers: req.headers, body: req.body }
        );
        try {
          return await fetch(proxied);
        } catch {
          return new Response('Bad Gateway', { status: 502 });
        }
      },

      websocket: terminalWsHandler,
    });

    console.log(`[Server] http://localhost:${server.port}`);
    console.log(`[WS]     ws://localhost:${server.port}/ws/terminal`);

  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
})();