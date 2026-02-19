import sequelize from './config/database.js';
import Flight from './models/Flight.js'; // register model
import flightRoutes from './routes/flightRoutes.js';
import { activeSessionCount } from './terminal/terminalWS.js';

import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';

const PORT = Number(process.env.PORT ?? 4000);

// ── Security ──────────────────────────────────────────────────────────────────
const VALID_TOKENS = new Set<string>(
  (process.env.TERMINAL_TOKENS ?? 'dev-secret-token').split(',').map(t => t.trim())
);
const BLOCKED = [
  /rm\s+-rf\s+\/(?!\w)/,
  /:\(\)\{.*\};:/,
  /mkfs\b/,
  /dd\s+.*of=\/dev\//,
];

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/api', flightRoutes);
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', terminalSessions: activeSessionCount() });
});

// ── HTTP server ───────────────────────────────────────────────────────────────
const httpServer = http.createServer(app);

// ── WebSocket server (ws package — vanilla Node/Bun compat) ──────────────────
const wss = new WebSocketServer({
  noServer: true, // we handle the upgrade ourselves
});

// ── Session idle cleanup ──────────────────────────────────────────────────────
const IDLE_MS = 10 * 60 * 1000;
const sessions = new Map<string, { proc: any; timer: ReturnType<typeof setTimeout> }>();

function clearSession(id: string) {
  const s = sessions.get(id);
  if (!s) return;
  clearTimeout(s.timer);
  try { s.proc.kill(); } catch { }
  sessions.delete(id);
}

// ── Handle HTTP → WS upgrade ──────────────────────────────────────────────────
httpServer.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url ?? '', `http://${req.headers.host}`);

  if (url.pathname !== '/ws/terminal') {
    socket.destroy();
    return;
  }

  // Authenticate before completing the upgrade
  const token = url.searchParams.get('token') ?? (req.headers['x-terminal-token'] as string);
  if (!token || !VALID_TOKENS.has(token)) {
    console.warn('[WS] Rejected — bad token');
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

// ── WebSocket connection handler ──────────────────────────────────────────────
wss.on('connection', (ws: WebSocket) => {
  const sessionId = crypto.randomUUID();
  console.log(`[WS] Session ${sessionId} connected`);

  const shell = process.env.SHELL ?? '/bin/zsh';
  const HOME = process.env.HOME ?? '/tmp';

  // Bun.spawn: fully built-in, no npm package needed
  const proc = Bun.spawn([shell, '--login'], {
    cwd: HOME,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      HOME,
    },
    stdin: 'pipe',
    stdout: 'pipe',
    stderr: 'pipe',
  });

  let timer = setTimeout(() => { }, 0);

  function resetIdle() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      safeSend({ type: 'output', data: '\r\n\x1b[33m[Session timed out]\x1b[0m\r\n' });
      clearSession(sessionId);
      ws.close();
    }, IDLE_MS);
    const s = sessions.get(sessionId);
    if (s) s.timer = timer;
  }

  sessions.set(sessionId, { proc, timer });

  function safeSend(msg: object) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  // Send ready message
  safeSend({ type: 'ready', data: sessionId });
  resetIdle();

  // Pipe stdout → WebSocket
  async function pipeStream(stream: ReadableStream<Uint8Array> | null) {
    if (!stream) return;
    const reader = stream.getReader();
    const dec = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        safeSend({ type: 'output', data: dec.decode(value) });
        resetIdle();
      }
    } catch { /* stream closed */ }
    safeSend({ type: 'exit', code: 0 });
    ws.close();
  }

  pipeStream(proc.stdout as ReadableStream<Uint8Array>);
  pipeStream(proc.stderr as ReadableStream<Uint8Array>);

  // WebSocket message → shell stdin
  ws.on('message', (raw) => {
    let msg: { type: string; data?: string };
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.type === 'input' && typeof msg.data === 'string') {
      if (BLOCKED.some(re => re.test(msg.data!))) {
        safeSend({ type: 'output', data: '\r\n\x1b[31m[BLOCKED] Rejected.\x1b[0m\r\n' });
        return;
      }
      resetIdle();
      proc.stdin!.write(msg.data);
    } else if (msg.type === 'ping') {
      safeSend({ type: 'pong' });
    }
  });

  ws.on('close', () => {
    clearSession(sessionId);
    console.log(`[WS] Session ${sessionId} disconnected`);
  });

  ws.on('error', (err) => {
    console.error(`[WS] Error on ${sessionId}:`, err.message);
    clearSession(sessionId);
  });
});

// ── Boot ──────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await sequelize.authenticate();
    console.log('[DB] Connection established.');
    await sequelize.sync({ force: false });
    console.log('[DB] Synchronized.');

    httpServer.listen(PORT, () => {
      console.log(`[Server] http://localhost:${PORT}`);
      console.log(`[WS]     ws://localhost:${PORT}/ws/terminal`);
    });
  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
})();