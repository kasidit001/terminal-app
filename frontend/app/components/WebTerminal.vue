<template>
    <div class="web-terminal-wrapper h-full flex flex-col bg-[#0d1117] overflow-hidden">

        <!-- ── Top bar ─────────────────────────────────────────────────────────── -->
        <div class="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-white/8 shrink-0">
            <div class="flex items-center gap-2.5">
                <!-- macOS-style traffic lights -->
                <div class="flex items-center gap-1.5">
                    <div class="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div class="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div class="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <span class="text-gray-400 text-xs font-mono ml-1">zsh — FocusFlight Terminal</span>
            </div>

            <div class="flex items-center gap-3">
                <!-- Connection status pill -->
                <div class="flex items-center gap-1.5">
                    <div class="w-1.5 h-1.5 rounded-full transition-colors duration-300" :class="statusDotClass" />
                    <span class="text-[10px] font-mono transition-colors duration-300" :class="statusTextClass">
                        {{ statusLabel }}
                    </span>
                </div>

                <!-- Close -->
                <button class="text-gray-600 hover:text-gray-300 transition-colors" title="Close terminal"
                    @click="$emit('close')">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- ── xterm.js mount point ─────────────────────────────────────────────── -->
        <div ref="terminalEl" class="flex-1 p-1 min-h-0" />

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
                    <p class="text-gray-400 text-xs leading-relaxed">{{ errorMsg }}</p>
                    <button class="btn-primary text-sm py-2 px-6 mt-1" @click="reconnect">
                        Reconnect
                    </button>
                </div>
            </div>
        </Transition>

    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

// ── Props / Emits ─────────────────────────────────────────────────────────────
interface Props {
    /** Token sent to backend as ?token= on WS upgrade */
    authToken?: string
    /** Override the WS base URL (auto-detected by default) */
    wsUrl?: string
}
const props = withDefaults(defineProps<Props>(), {
    authToken: 'dev-secret-token',
    wsUrl: '',
})
defineEmits<{ (e: 'close'): void }>()

// ── Reactive state ────────────────────────────────────────────────────────────
const terminalEl = ref<HTMLDivElement | null>(null)
const errorMsg = ref<string | null>(null)
type Status = 'connecting' | 'connected' | 'disconnected' | 'error'
const status = ref<Status>('connecting')

// ── Status visuals ────────────────────────────────────────────────────────────
const statusDotClass = computed(() => ({
    'bg-yellow-400 animate-pulse': status.value === 'connecting',
    'bg-emerald-400': status.value === 'connected',
    'bg-gray-500': status.value === 'disconnected',
    'bg-red-400': status.value === 'error',
}))
const statusTextClass = computed(() => ({
    'text-yellow-400': status.value === 'connecting',
    'text-emerald-400': status.value === 'connected',
    'text-gray-500': status.value === 'disconnected',
    'text-red-400': status.value === 'error',
}))
const statusLabel = computed(() => ({
    connecting: 'Connecting…',
    connected: 'Connected',
    disconnected: 'Disconnected',
    error: 'Error',
}[status.value]))

// ── Internal handles ──────────────────────────────────────────────────────────
// Using `any` because xterm is loaded as a UMD global at runtime, not a package
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let term: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fitAddon: any = null
let ws: WebSocket | null = null
let pingInterval: ReturnType<typeof setInterval> | null = null
let resizeObserver: ResizeObserver | null = null

// ── Shared message types ──────────────────────────────────────────────────────
interface ServerMessage {
    type: 'output' | 'exit' | 'error' | 'pong' | 'ready'
    data?: string
    code?: number
}
type ClientMessage =
    | { type: 'input'; data: string }
    | { type: 'resize'; cols: number; rows: number }
    | { type: 'ping' }

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildWsUrl() {
    const base = props.wsUrl || `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.hostname}:4000`
    return `${base}/ws/terminal?token=${encodeURIComponent(props.authToken)}`
}

function sendMsg(msg: ClientMessage) {
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
}

function sendResize() {
    if (!term) return
    sendMsg({ type: 'resize', cols: term.cols, rows: term.rows })
}

// ── WebSocket connect / reconnect ─────────────────────────────────────────────
function connect() {
    status.value = 'connecting'
    errorMsg.value = null

    ws = new WebSocket(buildWsUrl())

    ws.onopen = () => {
        status.value = 'connected'
        sendResize()
        // Keep-alive heartbeat
        pingInterval = setInterval(() => sendMsg({ type: 'ping' }), 25_000)
    }

    ws.onmessage = ({ data: raw }: MessageEvent) => {
        let msg: ServerMessage
        try { msg = JSON.parse(raw) } catch { return }

        if (msg.type === 'output' && msg.data) {
            term?.write(msg.data)
        } else if (msg.type === 'ready') {
            term?.write(
                '\x1b[1;36m┌─ FocusFlight Web Terminal ────────────────────────────┐\x1b[0m\r\n' +
                '\x1b[1;36m│\x1b[0m  Session: \x1b[33m' + (msg.data ?? '?') + '\x1b[0m\r\n' +
                '\x1b[1;36m│\x1b[0m  Type \x1b[32mexit\x1b[0m or click ✕ to close.\r\n' +
                '\x1b[1;36m└───────────────────────────────────────────────────────┘\x1b[0m\r\n'
            )
        } else if (msg.type === 'exit') {
            term?.write(`\r\n\x1b[33mShell exited (code ${msg.code ?? 0})\x1b[0m\r\n`)
            status.value = 'disconnected'
        } else if (msg.type === 'error') {
            errorMsg.value = msg.data ?? 'Server error'
            status.value = 'error'
        }
    }

    ws.onclose = (ev) => {
        clearInterval(pingInterval!)
        if (status.value !== 'disconnected') {
            if (ev.code === 1006 || ev.code === 1015) {
                status.value = 'error'
                errorMsg.value = 'Connection lost. Ensure the backend is running on port 4000.'
            } else {
                status.value = 'disconnected'
            }
        }
    }

    ws.onerror = () => {
        status.value = 'error'
        errorMsg.value = 'Could not connect to ws://localhost:4000/ws/terminal — is the backend running?'
    }
}

function reconnect() {
    ws?.close(1000, 'Reconnecting')
    connect()
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
    if (!terminalEl.value) return

    // xterm.js is loaded as UMD via CDN <script> tag — grab from window
    // The CDN bundles expose: window.Terminal, window.FitAddon.FitAddon, window.WebLinksAddon.WebLinksAddon
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const TerminalCtor = w.Terminal
    const FitAddonCtor = w.FitAddon?.FitAddon ?? w.FitAddon
    const WebLinksCtor = w.WebLinksAddon?.WebLinksAddon ?? w.WebLinksAddon

    if (!TerminalCtor) {
        errorMsg.value = 'xterm.js failed to load. Check CDN availability.'
        status.value = 'error'
        return
    }

    // ── Initialize terminal ──────────────────────────────────────────────────
    term = new TerminalCtor({
        cursorBlink: true,
        cursorStyle: 'block',
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, monospace',
        fontSize: 13,
        lineHeight: 1.35,
        theme: {
            background: '#0d1117',
            foreground: '#e6edf3',
            cursor: '#79c0ff',
            cursorAccent: '#0d1117',
            selectionBackground: 'rgba(56, 139, 253, 0.4)',
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
    })

    if (FitAddonCtor) {
        fitAddon = new FitAddonCtor()
        term.loadAddon(fitAddon)
    }
    if (WebLinksCtor) {
        term.loadAddon(new WebLinksCtor())
    }

    term.open(terminalEl.value)
    fitAddon?.fit()

    // Keystroke → backend
    term.onData((data: string) => sendMsg({ type: 'input', data }))

    // Auto-resize on container size change
    resizeObserver = new ResizeObserver(() => {
        fitAddon?.fit()
        sendResize()
    })
    resizeObserver.observe(terminalEl.value)

    // Open WebSocket
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

/* Let xterm fill the flex container */
:deep(.xterm) {
    height: 100%;
}

:deep(.xterm-viewport) {
    overflow-y: auto !important;
    border-radius: 0;
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
