import * as pty from 'node-pty';
import { EventEmitter } from 'events';
import os from 'os';

// ────────────────────────────────────────────────────────────────────────────
//  Security: blocked command patterns (hard-coded denylist as a backstop)
//  Real isolation should be a Docker container / restricted OS user.
// ────────────────────────────────────────────────────────────────────────────
const BLOCKED_PATTERNS: RegExp[] = [
    /rm\s+-rf\s+\/(?!\w)/,       // rm -rf / (root wipe)
    /:\(\)\{.*\};:/,              // fork bomb  :(){:|:&};:
    /mkfs\b/,                     // filesystem format
    /dd\s+.*of=\/dev\//,          // raw disk write
    />(\/dev\/sd|\/dev\/nvme)/,   // redirect to block device
];

type SessionEvent = 'data' | 'exit';

export interface ResizePayload {
    cols: number;
    rows: number;
}

/** Returns true if the input contains a blocked pattern (pre-flight screen). */
function isDangerous(input: string): boolean {
    return BLOCKED_PATTERNS.some(re => re.test(input));
}

export class TerminalSession extends EventEmitter {
    private ptyProcess: pty.IPty;
    private idleTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 min

    readonly sessionId: string;

    constructor(sessionId: string, cols = 80, rows = 24) {
        super();
        this.sessionId = sessionId;

        // ── Spawn a restricted shell ─────────────────────────────────────────────
        const shell = process.env.SHELL || (os.platform() === 'win32' ? 'cmd.exe' : '/bin/zsh');

        this.ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols,
            rows,
            cwd: process.env.HOME ?? '/tmp',   // start in home, never root
            env: {
                ...process.env,
                TERM: 'xterm-256color',
                COLORTERM: 'truecolor',
                // Strip any sudo / root capabilities from the env
                SUDO_COMMAND: undefined as any,
                SUDO_USER: undefined as any,
            },
        });

        // ── Pipe PTY output → emitter ────────────────────────────────────────────
        this.ptyProcess.onData((data: string) => {
            this.resetIdleTimer();
            this.emit('data', data);
        });

        this.ptyProcess.onExit(({ exitCode }) => {
            this.clearIdleTimer();
            this.emit('exit', exitCode);
        });

        this.resetIdleTimer();
        console.log(`[Terminal] Session ${sessionId} spawned PID ${this.ptyProcess.pid}`);
    }

    /** Write user input to the PTY (with safety check). */
    write(data: string): void {
        if (isDangerous(data)) {
            this.emit('data', '\r\n\x1b[31m[BLOCKED] Dangerous command detected and rejected.\x1b[0m\r\n');
            return;
        }
        this.resetIdleTimer();
        this.ptyProcess.write(data);
    }

    /** Resize the PTY window to match the frontend terminal dimensions. */
    resize(cols: number, rows: number): void {
        try {
            this.ptyProcess.resize(
                Math.max(1, Math.min(cols, 300)),
                Math.max(1, Math.min(rows, 100)),
            );
        } catch {
            // PTY may already be dead — ignore silently
        }
    }

    /** Gracefully terminate the session. */
    destroy(): void {
        this.clearIdleTimer();
        try {
            this.ptyProcess.kill();
        } catch {
            // already dead
        }
        console.log(`[Terminal] Session ${this.sessionId} destroyed`);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private resetIdleTimer(): void {
        this.clearIdleTimer();
        this.idleTimer = setTimeout(() => {
            this.emit('data', '\r\n\x1b[33m[Session timed out due to inactivity]\x1b[0m\r\n');
            this.destroy();
        }, this.IDLE_TIMEOUT_MS);
    }

    private clearIdleTimer(): void {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }
}
