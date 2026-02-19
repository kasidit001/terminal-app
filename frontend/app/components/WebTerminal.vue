<template>
    <div class="web-terminal-wrapper h-full flex flex-col bg-[#0d1117] overflow-hidden">

        <!-- ── Top bar ─────────────────────────────────────────────────────────── -->
        <div class="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-white/8 shrink-0">
            <div class="flex items-center gap-2.5">
                <!-- Traffic lights -->
                <div class="flex items-center gap-1.5">
                    <div class="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div class="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div class="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <span class="text-gray-400 text-xs font-mono ml-1">bash — FocusFlight Terminal</span>
            </div>

            <div class="flex items-center gap-3">
                <!-- Status indicator -->
                <div class="flex items-center gap-1.5">
                    <div class="w-1.5 h-1.5 rounded-full transition-colors" :class="statusColor" />
                    <span class="text-[10px] font-mono" :class="statusTextColor">{{ statusLabel }}</span>
                </div>

                <!-- Close button -->
                <button class="text-gray-600 hover:text-gray-300 transition-colors" @click="$emit('close')"
                    title="Close terminal">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- ── Terminal viewport ────────────────────────────────────────────────── -->
        <div ref="terminalEl" class="flex-1 p-1 overflow-hidden" />

        <!-- ── Error overlay ────────────────────────────────────────────────────── -->
        <Transition name="fade">
            <div v-if="errorMsg"
                class="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-10">
                <div class="bg-[#161b22] border border-red-500/30 rounded-xl p-6 max-w-sm mx-4 text-center space-y-3">
                    <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                        <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p class="text-white font-semibold text-sm">Connection Error</p>
                    <p class="text-gray-400 text-xs">{{ errorMsg }}</p>
                    <button class="btn-primary text-sm py-2 px-4" @click="reconnect">
                        Reconnect
                    </button>
                </div>
            </div>
        </Transition>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

// ── Props / Emits ─────────────────────────────────────────────────────────────
interface Props {
    /** Authentication token sent to the backend on WS handshake. */
    authToken?: string
    /** WS endpoint base (default: auto-detected from window.location). */
    wsUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
    authToken: 'dev-secret-token',
    wsUrl: '',
})

defineEmits<{ (e: 'close'): void }>()

// ── Refs ──────────────────────────────────────────────────────────────────────
const terminalEl = ref<HTMLDivElement | null>(null)
const errorMsg = ref<string | null>(null)

type ConnStatus = 'connecting' | 'connected' | 'disconnected' | 'error'
const connStatus = ref<ConnStatus>('connecting')

// ── Computed status styles ────────────────────────────────────────────────────
const statusColor = computed(() => ({
    'bg-yellow-400 animate-pulse': connStatus.value === 'connecting',
    'bg-emerald-400': connStatus.value === 'connected',
    'bg-gray-500': connStatus.value === 'disconnected',
    'bg-red-400': connStatus.value === 'error',
}))

const statusTextColor = computed(() => ({
    'text-yellow-400': connStatus.value === 'connecting',
    'text-emerald-400': connStatus.value === 'connected',
    'text-gray-500': connStatus.value === 'disconnected',
    'text-red-400': connStatus.value === 'error',
}))

const statusLabel = computed(() => ({
    connecting: 'Connecting…',
    connected: 'Connected',
    disconnected: 'Disconnected',
    error: 'Error',
}[connStatus.value]))

// ── Core objects ──────────────────────────────────────────────────────────────
let term: Terminal | null = null
let fitAddon: FitAddon | null = null
let ws: WebSocket | null = null
let pingInterval: ReturnType<typeof setInterval> | null = null
let resizeObserver: ResizeObserver | null = null

// ── Helper: build WS URL ──────────────────────────────────────────────────────
function buildWsUrl(): string {
    if (props.wsUrl) {
        return `${props.wsUrl}?token=${encodeURIComponent(props.authToken)}`
    }
    // Auto-detect: same host, port 4000 (the backend)
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//localhost:4000/ws/terminal?token=${encodeURIComponent(props.authToken)}`
}

// ── Message types (shared with backend) ──────────────────────────────────────
interface ServerMessage {
    type: 'output' | 'exit' | 'error' | 'pong' | 'ready'
    data?: string
    code?: number
}

// ── Connect ───────────────────────────────────────────────────────────────────
function connect(): void {
    connStatus.value = 'connecting'
    errorMsg.value = null

    ws = new WebSocket(buildWsUrl())

    ws.onopen = () => {
        connStatus.value = 'connected'
        sendResize()   // immediately tell backend current terminal size

        // Keep-alive ping every 30 s
        pingInterval = setInterval(() => {
            sendMsg({ type: 'ping' })
        }, 30_000)
    }

    ws.onmessage = (event: MessageEvent) => {
        let msg: ServerMessage
        try { msg = JSON.parse(event.data) } catch { return }

        switch (msg.type) {
            case 'output':
                if (msg.data) term?.write(msg.data)
                break
            case 'ready':
                // PTY is live — print a welcome banner
                term?.write('\x1b[1;36m┌─ FocusFlight Web Terminal ─────────────────────────┐\x1b[0m\r\n')
                term?.write('\x1b[1;36m│\x1b[0m Session ID: \x1b[33m' + (msg.data ?? '?') + '\x1b[0m\r\n')
                term?.write('\x1b[1;36m│\x1b[0m Type \x1b[32mexit\x1b[0m to close the session.\r\n')
                term?.write('\x1b[1;36m└────────────────────────────────────────────────────┘\x1b[0m\r\n')
                break
            case 'exit':
                term?.write(`\r\n\x1b[33mShell exited (code ${msg.code ?? 0})\x1b[0m\r\n`)
                connStatus.value = 'disconnected'
                break
            case 'error':
                errorMsg.value = msg.data ?? 'Unknown server error'
                connStatus.value = 'error'
                break
            case 'pong':
                // heartbeat acknowledged — no-op
                break
        }
    }

    ws.onclose = (ev) => {
        clearInterval(pingInterval!)
        if (connStatus.value !== 'disconnected') {
            connStatus.value = ev.code === 1006 ? 'error' : 'disconnected'
            if (ev.code === 1006) {
                errorMsg.value = 'Connection lost unexpectedly. Check the backend is running.'
            }
        }
    }

    ws.onerror = () => {
        connStatus.value = 'error'
        errorMsg.value = 'WebSocket connection failed. Is the backend running on port 4000?'
    }
}

// ── Send helpers ──────────────────────────────────────────────────────────────
type ClientMessage =
    | { type: 'input'; data: string }
    | { type: 'resize'; cols: number; rows: number }
    | { type: 'ping' }

function sendMsg(msg: ClientMessage): void {
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg))
    }
}

function sendResize(): void {
    if (!term) return
    sendMsg({ type: 'resize', cols: term.cols, rows: term.rows })
}

// ── Reconnect (user action) ───────────────────────────────────────────────────
function reconnect(): void {
    ws?.close()
    connect()
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
    if (!terminalEl.value) return

    // ── Initialize xterm.js ────────────────────────────────────────────────────
    term = new Terminal({
        cursorBlink: true,
        cursorStyle: 'block',
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
        fontSize: 13,
        lineHeight: 1.35,
        theme: {
            background: '#0d1117',
            foreground: '#e6edf3',
            cursor: '#79c0ff',
            cursorAccent: '#0d1117',
            black: '#484f58',
            red: '#ff7b72',
            green: '#3fb950',
            yellow: '#d29922',
            blue: '#58a6ff',
            magenta: '#bc8cff',
            cyan: '#39c5cf',
            white: '#b1bac4',
            brightBlack: '#6e7681',
            brightRed: '#ffa198',
            brightGreen: '#56d364',
            brightYellow: '#e3b341',
            brightBlue: '#79c0ff',
            brightMagenta: '#d2a8ff',
            brightCyan: '#56d4dd',
            brightWhite: '#f0f6fc',
        },
        allowProposedApi: true,
    })

    fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.loadAddon(new WebLinksAddon())

    term.open(terminalEl.value)
    fitAddon.fit()

    // ── Forward keystrokes to backend ────────────────────────────────────────
    term.onData((data) => sendMsg({ type: 'input', data }))

    // ── Observe container resize → update PTY dimensions ────────────────────
    resizeObserver = new ResizeObserver(() => {
        fitAddon?.fit()
        sendResize()
    })
    resizeObserver.observe(terminalEl.value)

    // ── Connect to backend ───────────────────────────────────────────────────
    connect()
})

onBeforeUnmount(() => {
    clearInterval(pingInterval!)
    resizeObserver?.disconnect()
    ws?.close(1000, 'Component unmounted')
    term?.dispose()
})
</script>

<style scoped>
.web-terminal-wrapper {
    position: relative;
}

/* Make xterm's inner canvas fill the available space */
:deep(.xterm) {
    height: 100%;
}

:deep(.xterm-viewport) {
    overflow-y: auto !important;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
