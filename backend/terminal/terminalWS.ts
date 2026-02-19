import type { Server } from 'bun';

// ────────────────────────────────────────────────────────────────────────────
//  Security: blocked command denylist
// ────────────────────────────────────────────────────────────────────────────
const BLOCKED: RegExp[] = [
    /rm\s+-rf\s+\/(?!\w)/,
    /:\(\)\{.*\};:/,
    /mkfs\b/,
    /dd\s+.*of=\/dev\//,
];

function isDangerous(input: string): boolean {
    return BLOCKED.some(re => re.test(input));
}

// ────────────────────────────────────────────────────────────────────────────
//  Auth
// ────────────────────────────────────────────────────────────────────────────
const VALID_TOKENS = new Set<string>(
    (process.env.TERMINAL_TOKENS ?? 'dev-secret-token').split(',').map(t => t.trim())
);

function isAuthenticated(req: Request): boolean {
    const url = new URL(req.url);
    const token = url.searchParams.get('token')
        ?? req.headers.get('x-terminal-token');
    return token != null && VALID_TOKENS.has(token);
}

// ────────────────────────────────────────────────────────────────────────────
//  Session store
// ────────────────────────────────────────────────────────────────────────────
interface Session {
    id: string;
    proc: ReturnType<typeof Bun.spawn>;
    ws: ServerWebSocket<unknown>;
    idleTimer: ReturnType<typeof setTimeout>;
}

const IDLE_MS = 10 * 60 * 1000; // 10 min
const sessions = new Map<string, Session>();

function clearSession(id: string) {
    const s = sessions.get(id);
    if (!s) return;
    clearTimeout(s.idleTimer);
    try { s.proc.kill(); } catch { }
    sessions.delete(id);
    console.log(`[Terminal] Session ${id} removed`);
}

function resetIdle(s: Session) {
    clearTimeout(s.idleTimer);
    s.idleTimer = setTimeout(() => {
        s.ws.send(JSON.stringify({
            type: 'output',
            data: '\r\n\x1b[33m[Session timed out]\x1b[0m\r\n',
        }));
        clearSession(s.id);
        s.ws.close();
    }, IDLE_MS);
}

// ────────────────────────────────────────────────────────────────────────────
//  Bun WebSocket handler (to be merged into Bun.serve config)
// ────────────────────────────────────────────────────────────────────────────
type ServerWebSocket<T> = import('bun').ServerWebSocket<T>;

export const terminalWsHandler = {
    // Called when the HTTP→WS upgrade succeeds
    open(ws: ServerWebSocket<{ sessionId: string }>) {
        const sessionId = crypto.randomUUID();
        (ws.data as any).sessionId = sessionId;

        const shell = process.env.SHELL ?? '/bin/zsh';
        const HOME = process.env.HOME ?? '/tmp';

        // Bun.spawn returns a process; we stream stdin/stdout manually
        const proc = Bun.spawn([shell], {
            cwd: HOME,
            env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' },
            stdin: 'pipe',
            stdout: 'pipe',
            stderr: 'pipe',
        });

        const session: Session = {
            id: sessionId,
            proc,
            ws: ws as ServerWebSocket<unknown>,
            idleTimer: setTimeout(() => { }, 0),
        };
        sessions.set(sessionId, session);
        resetIdle(session);

        console.log(`[Terminal] Session ${sessionId} opened`);

        // Send "ready" message immediately
        ws.send(JSON.stringify({ type: 'ready', data: sessionId }));

        // Stream stdout → WebSocket
        async function pipeOutput(stream: ReadableStream<Uint8Array> | null, label: string) {
            if (!stream) return;
            const reader = stream.getReader();
            const decoder = new TextDecoder();
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const text = decoder.decode(value);
                    if (ws.readyState === 1 /* OPEN */) {
                        ws.send(JSON.stringify({ type: 'output', data: text }));
                    }
                    resetIdle(session);
                }
            } catch {
                // stream closed
            } finally {
                if (ws.readyState === 1) {
                    ws.send(JSON.stringify({ type: 'exit', code: 0 }));
                    ws.close();
                }
            }
        }

        pipeOutput(proc.stdout, 'stdout');
        pipeOutput(proc.stderr, 'stderr');
    },

    message(ws: ServerWebSocket<{ sessionId: string }>, raw: string | Buffer) {
        const sessionId = (ws.data as any).sessionId as string;
        const session = sessions.get(sessionId);
        if (!session) return;

        let msg: { type: string; data?: string; cols?: number; rows?: number };
        try { msg = JSON.parse(raw.toString()); } catch { return; }

        if (msg.type === 'input' && typeof msg.data === 'string') {
            if (isDangerous(msg.data)) {
                ws.send(JSON.stringify({
                    type: 'output',
                    data: '\r\n\x1b[31m[BLOCKED] Dangerous command rejected.\x1b[0m\r\n',
                }));
                return;
            }
            resetIdle(session);
            session.proc.stdin?.write(msg.data);
        } else if (msg.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
        }
        // Note: resize (cols/rows) is a no-op without node-pty; full PTY resize
        // requires `bun add node-pty` — the shell still works, just no SIGWINCH.
    },

    close(ws: ServerWebSocket<{ sessionId: string }>) {
        const sessionId = (ws.data as any).sessionId as string;
        clearSession(sessionId);
        console.log(`[Terminal] Session ${sessionId} closed`);
    },

    error(ws: ServerWebSocket<{ sessionId: string }>, error: Error) {
        console.error('[Terminal] WS error:', error.message);
        const sessionId = (ws.data as any).sessionId as string;
        clearSession(sessionId);
    },
};

export function activeSessionCount() {
    return sessions.size;
}

/**
 * Returns a Response that upgrades the HTTP request to a WebSocket,
 * or a 401 if not authenticated.
 */
export function handleTerminalUpgrade(req: Request, server: Server): Response | undefined {
    if (!isAuthenticated(req)) {
        console.warn('[Terminal] Rejected WS — bad token');
        return new Response('Unauthorized', { status: 401 });
    }
    const upgraded = server.upgrade(req, { data: { sessionId: '' } });
    if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 500 });
    }
    // Return undefined means Bun will handle the upgrade response
    return undefined;
}
