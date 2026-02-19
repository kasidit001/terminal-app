import express from 'express';
import cors from 'cors';
import http from 'http';
import sequelize from './config/database.js';
import flightRoutes from './routes/flightRoutes.js';
import Flight from './models/Flight.js';
import { attachTerminalWS, activeSessionCount } from './terminal/terminalWS.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ── REST API routes ──────────────────────────────────────────────────────────
app.use('/api', flightRoutes);

// ── Health endpoint (also shows active terminal sessions) ───────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', terminalSessions: activeSessionCount() });
});

// ── Create HTTP server (needed so WS and HTTP share the same port) ──────────
const server = http.createServer(app);

// ── Attach WebSocket terminal server ────────────────────────────────────────
attachTerminalWS(server);

// ── Sync database and start ──────────────────────────────────────────────────
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    await sequelize.sync({ force: false });
    console.log('Database synchronized.');

    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`WebSocket terminal at ws://localhost:${PORT}/ws/terminal`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
})();