import sequelize from './config/database.js';
import Flight from './models/Flight.js'; // register model
import flightRoutes from './routes/flightRoutes.js';
import { terminalWsHandler, handleTerminalUpgrade, activeSessionCount } from './terminal/terminalWS.js';

import express from 'express';
import cors from 'cors';
import http from 'http';

const PORT = Number(process.env.PORT ?? 4000);
const EXPR_PORT = PORT + 1; // Express listens on 4001 internally

// ── Express app (REST API) ─────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/api', flightRoutes);
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', terminalSessions: activeSessionCount() });
});

// ── Boot ───────────────────────────────────────────────────────────────────
(async () => {
  try {
    await sequelize.authenticate();
    console.log('[DB] Connection established.');
    await sequelize.sync({ force: false });
    console.log('[DB] Synchronized.');

    // 1. Start Express on internal port (REST only)
    await new Promise<void>((resolve) =>
      http.createServer(app).listen(EXPR_PORT, () => {
        console.log(`[Express] REST API on http://localhost:${EXPR_PORT}`);
        resolve();
      })
    );

    // 2. Start Bun.serve on the public port (WS + proxy REST to Express)
    const server = Bun.serve({
      port: PORT,

      async fetch(req, server) {
        const url = new URL(req.url);

        // WebSocket upgrade
        if (url.pathname === '/ws/terminal') {
          return handleTerminalUpgrade(req, server)
            ?? new Response(null, { status: 101 });
        }

        // Proxy everything else to Express
        const proxied = new Request(
          `http://localhost:${EXPR_PORT}${url.pathname}${url.search}`,
          {
            method: req.method,
            headers: req.headers,
            body: req.body,
          }
        );
        try {
          return await fetch(proxied);
        } catch {
          return new Response('Bad Gateway', { status: 502 });
        }
      },

      websocket: terminalWsHandler,
    });

    console.log(`[Bun]  Public server on http://localhost:${server.port}`);
    console.log(`[Bun]  Terminal WebSocket at ws://localhost:${server.port}/ws/terminal`);
  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
})();