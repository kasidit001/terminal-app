import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Server } from 'http';
import { TerminalSession } from './TerminalSession.js';
import crypto from 'crypto';

// ────────────────────────────────────────────────────────────────────────────
//  Message envelope types (shared protocol with the frontend)
// ────────────────────────────────────────────────────────────────────────────
interface ClientMessage {
    type: 'input' | 'resize' | 'ping';
    data?: string;
    cols?: number;
    rows?: number;
}

interface ServerMessage {
    type: 'output' | 'exit' | 'error' | 'pong' | 'ready';
    data?: string;
    code?: number;
}

function send(ws: WebSocket, msg: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
    }
}

// ────────────────────────────────────────────────────────────────────────────
//  Simple token-based auth
//  In production: validate a real JWT / session cookie here.
// ────────────────────────────────────────────────────────────────────────────
const ADMIN_TOKENS = new Set<string>(
    (process.env.TERMINAL_TOKENS || 'dev-secret-token').split(',').map(t => t.trim())
);

function isAuthenticated(req: IncomingMessage): boolean {
    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token')
        ?? req.headers['x-terminal-token'] as string | undefined;
    if (!token) return false;
    return ADMIN_TOKENS.has(token);
}

// ────────────────────────────────────────────────────────────────────────────
//  WebSocket server
// ────────────────────────────────────────────────────────────────────────────
const sessions = new Map<string, TerminalSession>();

export function attachTerminalWS(httpServer: Server): void {
    const wss = new WebSocketServer({
        server: httpServer,
        path: '/ws/terminal',
        // Verify auth BEFORE the WS handshake completes (401 before TCP upgrade)
        verifyClient({ req }, callback) {
            if (isAuthenticated(req)) {
                callback(true);
            } else {
                console.warn('[Terminal] WS rejected — bad/missing token');
                callback(false, 401, 'Unauthorized');
            }
        },
    });

    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
        const sessionId = crypto.randomUUID();

        // Default to 80×24; frontend will send a resize Right After connecting.
        const session = new TerminalSession(sessionId, 80, 24);
        sessions.set(sessionId, session);

        console.log(`[Terminal] Client connected → session ${sessionId}`);

        // ── PTY → WebSocket ──────────────────────────────────────────────────────
        session.on('data', (data: string) => send(ws, { type: 'output', data }));
        session.on('exit', (code: number) => {
            send(ws, { type: 'exit', code });
            ws.close();
        });

        // Notify the frontend that the PTY is ready
        send(ws, { type: 'ready', data: sessionId });

        // ── WebSocket → PTY ──────────────────────────────────────────────────────
        ws.on('message', (raw) => {
            let msg: ClientMessage;
            try {
                msg = JSON.parse(raw.toString());
            } catch {
                return; // drop malformed frames
            }

            switch (msg.type) {
                case 'input':
                    if (typeof msg.data === 'string') {
                        session.write(msg.data);
                    }
                    break;

                case 'resize':
                    if (typeof msg.cols === 'number' && typeof msg.rows === 'number') {
                        session.resize(msg.cols, msg.rows);
                    }
                    break;

                case 'ping':
                    send(ws, { type: 'pong' });
                    break;
            }
        });

        // ── Cleanup ───────────────────────────────────────────────────────────────
        ws.on('close', () => {
            session.destroy();
            sessions.delete(sessionId);
            console.log(`[Terminal] Session ${sessionId} cleaned up`);
        });

        ws.on('error', (err) => {
            console.error(`[Terminal] WS error on ${sessionId}:`, err.message);
            session.destroy();
            sessions.delete(sessionId);
        });
    });

    console.log('[Terminal] WebSocket server attached at /ws/terminal');
}

/** Returns current active session count (for health checks). */
export function activeSessionCount(): number {
    return sessions.size;
}
