<template>
    <div ref="containerRef" class="svg-globe-container w-full h-full relative overflow-hidden">
        <svg :viewBox="`0 0 ${W} ${H}`" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <!-- Deep ocean sphere gradient -->
                <radialGradient id="oceanGrad" cx="36%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#1e5f8a" />
                    <stop offset="40%" stop-color="#0c3a60" />
                    <stop offset="75%" stop-color="#060e22" />
                    <stop offset="100%" stop-color="#020810" />
                </radialGradient>

                <!-- Atmosphere glow ring -->
                <radialGradient id="atmoGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="68%" stop-color="transparent" />
                    <stop offset="82%" stop-color="#38bdf8" stop-opacity="0.18" />
                    <stop offset="92%" stop-color="#0ea5e9" stop-opacity="0.10" />
                    <stop offset="100%" stop-color="#0369a1" stop-opacity="0.04" />
                </radialGradient>

                <!-- Glass highlight (top-left specular) -->
                <radialGradient id="glassGrad" cx="32%" cy="24%" r="50%">
                    <stop offset="0%" stop-color="rgba(255,255,255,0.20)" />
                    <stop offset="50%" stop-color="rgba(255,255,255,0.05)" />
                    <stop offset="100%" stop-color="rgba(255,255,255,0)" />
                </radialGradient>

                <!-- Bottom limb darkening -->
                <radialGradient id="limbGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="55%" stop-color="transparent" />
                    <stop offset="100%" stop-color="rgba(0,0,0,0.55)" />
                </radialGradient>

                <!-- Land gradient (vivid teal-green) -->
                <linearGradient id="landGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#4ade80" />
                    <stop offset="100%" stop-color="#16a34a" />
                </linearGradient>

                <!-- Land border -->
                <linearGradient id="landBorder" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#86efac" />
                    <stop offset="100%" stop-color="#22c55e" />
                </linearGradient>

                <!-- Clip to globe circle -->
                <clipPath id="globeClip">
                    <circle cx="400" cy="400" r="355" />
                </clipPath>

                <!-- Drop shadow -->
                <filter id="globeShadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="8" stdDeviation="22" flood-color="#000" flood-opacity="0.75" />
                </filter>

                <!-- Atmosphere outer glow -->
                <filter id="atmoGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                <!-- Flight path glow -->
                <filter id="pathGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                <!-- Dot / plane glow -->
                <filter id="dotGlow" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                <!-- Stars: a tiny noise field -->
                <filter id="noise">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" result="noiseOut" />
                    <feColorMatrix type="saturate" values="0" in="noiseOut" result="grayNoise" />
                    <feComponentTransfer in="grayNoise" result="stars">
                        <feFuncA type="discrete" tableValues="0 0 0 0 0 0 0 0 1" />
                    </feComponentTransfer>
                    <feComposite in="stars" in2="SourceGraphic" operator="in" />
                </filter>
            </defs>

            <!-- ── Starfield background ── -->
            <g opacity="0.6">
                <rect x="0" y="0" :width="W" :height="H" fill="transparent" />
                <circle v-for="s in stars" :key="s.id" :cx="s.x" :cy="s.y" :r="s.r" fill="white" :opacity="s.o" />
            </g>

            <!-- ── Outer atmosphere glow (behind globe) ── -->
            <circle :cx="cx" :cy="cy" :r="R + 22" fill="url(#atmoGrad)" filter="url(#atmoGlow)" />

            <!-- ── Globe sphere ── -->
            <circle :cx="cx" :cy="cy" :r="R" fill="url(#oceanGrad)" filter="url(#globeShadow)" />

            <!-- ── Clipped interior ── -->
            <g clip-path="url(#globeClip)">

                <!-- Latitude / longitude grid -->
                <g opacity="0.14" stroke="#7dd3fc" stroke-width="0.8" fill="none">
                    <ellipse v-for="lat in latLines" :key="`lat-${lat}`" :cx="cx" :cy="cy" :rx="R"
                        :ry="R * Math.abs(Math.cos(lat * Math.PI / 180))" />
                    <ellipse v-for="lng in lngLines" :key="`lng-${lng}`" :cx="cx" :cy="cy"
                        :rx="R * Math.abs(Math.cos(lng * Math.PI / 180))" :ry="R" />
                    <!-- Equator highlight -->
                    <line :x1="cx - R" :y1="cy" :x2="cx + R" :y2="cy" stroke="#38bdf8" stroke-width="1" opacity="1.8" />
                </g>

                <!-- ── Continents ── -->
                <!-- Subtle shadow beneath each land mass -->
                <g fill="rgba(0,0,0,0.25)" stroke="none">
                    <path :d="northAmericaPath" transform="translate(3,4)" />
                    <path :d="southAmericaPath" transform="translate(3,4)" />
                    <path :d="europePath" transform="translate(3,4)" />
                    <path :d="africaPath" transform="translate(3,4)" />
                    <path :d="asiaPath" transform="translate(3,4)" />
                    <path :d="australiaPath" transform="translate(3,4)" />
                    <path :d="greenlandPath" transform="translate(3,4)" />
                    <path :d="antarcticaPath" transform="translate(3,4)" />
                </g>

                <!-- Land fill -->
                <g fill="#22c55e" stroke="#4ade80" stroke-width="0.9" opacity="0.92">
                    <path :d="northAmericaPath" />
                    <path :d="southAmericaPath" />
                    <path :d="europePath" />
                    <path :d="africaPath" />
                    <path :d="asiaPath" />
                    <path :d="australiaPath" />
                    <path :d="greenlandPath" />
                    <path :d="antarcticaPath" />
                </g>

                <!-- ── Flight arc ── -->
                <g v-if="showFlight && flightPath">
                    <!-- Broad glow halo -->
                    <path :d="flightPath" fill="none" stroke="#fbbf24" stroke-width="10" opacity="0.12"
                        filter="url(#pathGlow)" />
                    <!-- Dashed thin trail -->
                    <path :d="flightPath" fill="none" stroke="#fde68a" stroke-width="1.2" stroke-dasharray="8 7"
                        opacity="0.55" />
                    <!-- Bright core line -->
                    <path :d="flightPath" fill="none" stroke="#fbbf24" stroke-width="2.2" stroke-dasharray="8 7"
                        opacity="0.90" />

                    <!-- Departure dot -->
                    <circle :cx="depX" :cy="depY" r="10" fill="#10b981" opacity="0.15" filter="url(#dotGlow)" />
                    <circle :cx="depX" :cy="depY" r="5" fill="#10b981" stroke="#d1fae5" stroke-width="1.5" />
                    <text :x="depX" :y="depY - 14" text-anchor="middle" fill="white" font-size="12" font-weight="700"
                        font-family="'Courier New', monospace" style="text-shadow: 0 1px 6px rgba(0,0,0,0.9)">{{
                            depLabel }}</text>

                    <!-- Arrival dot -->
                    <circle :cx="arrX" :cy="arrY" r="10" fill="#f43f5e" opacity="0.15" filter="url(#dotGlow)" />
                    <circle :cx="arrX" :cy="arrY" r="5" fill="#f43f5e" stroke="#fecdd3" stroke-width="1.5" />
                    <text :x="arrX" :y="arrY - 14" text-anchor="middle" fill="white" font-size="12" font-weight="700"
                        font-family="'Courier New', monospace" style="text-shadow: 0 1px 6px rgba(0,0,0,0.9)">{{
                            arrLabel }}</text>

                    <!-- Animated plane (SVG path, not emoji) -->
                    <g :transform="`translate(${planeX}, ${planeY}) rotate(${planeAngle})`" filter="url(#dotGlow)">
                        <!-- Glow halo -->
                        <circle r="12" fill="#fbbf24" opacity="0.20" />
                        <!-- Plane icon -->
                        <path d="M0,-7 L4,3 L0,1 L-4,3 Z M-1,1 L1,1 L1,5 L-1,5 Z M-5,2 L5,2 L5,3 L-5,3 Z" fill="#fbbf24"
                            stroke="#fff8" stroke-width="0.4" />
                    </g>
                </g>
            </g>

            <!-- ── Limb darkening (edge vignette) ── -->
            <circle :cx="cx" :cy="cy" :r="R" fill="url(#limbGrad)" />

            <!-- ── Glass specular highlight ── -->
            <circle :cx="cx" :cy="cy" :r="R" fill="url(#glassGrad)" />

            <!-- ── Thin border ring ── -->
            <circle :cx="cx" :cy="cy" :r="R" fill="none" stroke="rgba(56,189,248,0.12)" stroke-width="1.5" />
        </svg>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    showFlight?: boolean
    departure?: [number, number]
    arrival?: [number, number]
    depLabel?: string
    arrLabel?: string
    progress?: number
    autoRotate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    showFlight: false,
    departure: () => [0, 0],
    arrival: () => [0, 0],
    depLabel: 'DEP',
    arrLabel: 'ARR',
    progress: 0,
    autoRotate: true,
})

// SVG canvas
const W = 800
const H = 800
const cx = W / 2
const cy = H / 2
const R = 355

// Grid lines
const latLines = [-60, -30, 0, 30, 60]
const lngLines = [-75, -45, -15, 15, 45, 75]

// ─── Starfield ───────────────────────────────────────────────────────────────
const stars = Array.from({ length: 90 }, (_, i) => {
    const seed = (i * 2654435761) >>> 0
    return {
        id: i,
        x: ((seed * 1664525 + 1013904223) >>> 0) % W,
        y: (seed * 22695477 + 1) % H,
        r: ((seed % 5) < 2) ? 0.6 : ((seed % 5) < 4) ? 1.0 : 1.4,
        o: 0.25 + (seed % 60) / 100,
    }
})

// ─── Projection ──────────────────────────────────────────────────────────────
function ll2xy(lat: number, lng: number): [number, number] {
    const x = cx + R * (lng / 180)
    const y = cy - R * (lat / 90)
    return [x, y]
}

function makePath(coords: [number, number][]): string {
    if (coords.length === 0) return ''
    const pts = coords.map(([lat, lng]) => {
        const [x, y] = ll2xy(lat, lng)
        return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    return `M${pts[0]} L${pts.slice(1).join(' L')} Z`
}

// ─── Continent paths (improved shapes) ───────────────────────────────────────

const northAmericaPath = makePath([
    // Alaska & NW
    [71, -156], [68, -141], [65, -168], [60, -166], [57, -153],
    [58, -136], [56, -130],
    // West coast
    [48, -124], [38, -123], [32, -117],
    // Mexico
    [30, -110], [24, -110], [20, -87], [16, -90], [10, -84], [8, -77],
    // Caribbean coast
    [11, -74], [12, -72],
    // Atlantic coast
    [18, -66], [25, -77], [30, -81], [35, -76], [42, -70],
    [45, -66], [47, -53],
    // Eastern Canada
    [51, -56], [58, -68], [63, -64], [64, -83],
    [60, -94], [58, -94],
    // Hudson + Arctic
    [62, -82], [66, -83], [72, -80], [74, -94],
    [76, -85], [76, -70], [72, -68],
    // Baffin
    [72, -80], [70, -95], [68, -95],
    // Back to Alaska
    [70, -140], [71, -156],
])

const southAmericaPath = makePath([
    [12, -72], [10, -62], [8, -60], [5, -53], [4, -50],
    [0, -50], [-3, -43], [-5, -35], [-10, -37],
    [-15, -39], [-20, -40], [-23, -43],
    [-30, -51], [-33, -53], [-38, -57], [-42, -65],
    [-48, -66], [-53, -68], [-56, -68], [-55, -67],
    [-50, -75], [-46, -75], [-42, -73],
    [-35, -72], [-28, -71], [-18, -70],
    [-8, -78], [-2, -81], [5, -77], [12, -72],
])

const europePath = makePath([
    [71, 28], [70, 18], [68, 14], [65, 14],
    [62, 5], [58, 5], [53, 2], [51, 2],
    [48, -5], [44, -9], [36, -9], [36, -6],
    [37, 0], [38, 4], [40, 4], [38, 15],
    [40, 15], [40, 18], [42, 20], [42, 28],
    [44, 28], [45, 30], [46, 38], [48, 38],
    [52, 33], [55, 37], [58, 27],
    [60, 28], [64, 26], [68, 27], [71, 28],
])

const africaPath = makePath([
    // North coast
    [37, -5], [37, 12], [33, 11], [30, 32], [28, 34],
    [22, 37], [12, 44], [11, 43],
    // East coast
    [5, 41], [0, 42], [-5, 40],
    [-10, 38], [-15, 35],
    // South
    [-25, 33], [-30, 30], [-34, 26], [-34, 18],
    // West coast
    [-28, 16], [-18, 12], [-10, 15],
    [-5, 10], [0, 10], [5, -5],
    [10, -15], [15, -17], [21, -17],
    // North-west
    [30, -10], [35, -6], [37, -5],
])

const asiaPath = makePath([
    // Russia west to east
    [70, 30], [72, 55], [72, 80], [72, 110], [72, 130],
    [68, 141], [60, 141], [55, 135], [50, 142],
    [48, 140], [43, 132], [38, 130],
    // Korea / China coast
    [35, 120], [28, 121], [22, 114], [18, 110],
    [12, 109], [10, 105], [5, 103], [1, 104],
    [-6, 107], [-8, 115], [-8, 140],
    // SE Asia
    [5, 100], [8, 98], [10, 99], [13, 100],
    [20, 93], [20, 88],
    // India
    [22, 88], [8, 77], [9, 78], [22, 73],
    [23, 68], [25, 65], [22, 60],
    // Arabian peninsula
    [26, 57], [24, 57], [15, 50], [12, 44],
    // Back north (Tigris/Euphrates)
    [30, 48], [37, 44], [38, 44], [40, 44],
    // Turkey / Caucasus / Central Asia
    [40, 50], [42, 50], [44, 52], [48, 60],
    [52, 68], [55, 80], [58, 92], [62, 100],
    [65, 90], [68, 68], [70, 58], [70, 40], [70, 30],
])

const australiaPath = makePath([
    [-14, 130], [-12, 132], [-12, 136], [-13, 136],
    [-12, 141], [-16, 146], [-20, 149],
    [-28, 154], [-35, 151], [-38, 147],
    [-38, 140], [-37, 136], [-35, 117],
    [-32, 116], [-28, 114],
    [-22, 114], [-18, 122], [-14, 128], [-14, 130],
])

const antarcticaPath = makePath([
    [-70, -180], [-74, -150], [-76, -120], [-78, -90],
    [-75, -60], [-74, -30], [-75, 0],
    [-74, 30], [-76, 60], [-75, 90],
    [-72, 120], [-74, 150], [-70, 180],
    [-80, 180], [-80, 0], [-80, -180],
])

const greenlandPath = makePath([
    [83, -45], [80, -15], [76, -18], [72, -22],
    [66, -34], [60, -44], [64, -52],
    [68, -53], [72, -56], [76, -65],
    [80, -60], [83, -45],
])

// ─── Flight arc ──────────────────────────────────────────────────────────────
const depX = computed(() => ll2xy(props.departure[0], props.departure[1])[0])
const depY = computed(() => ll2xy(props.departure[0], props.departure[1])[1])
const arrX = computed(() => ll2xy(props.arrival[0], props.arrival[1])[0])
const arrY = computed(() => ll2xy(props.arrival[0], props.arrival[1])[1])

const controlPoint = computed(() => {
    const x1 = depX.value, y1 = depY.value
    const x2 = arrX.value, y2 = arrY.value
    const mx = (x1 + x2) / 2
    const dist = Math.hypot(x2 - x1, y2 - y1)
    const my = (y1 + y2) / 2 - dist * 0.40
    return { mx, my }
})

const flightPath = computed(() => {
    if (!props.showFlight) return null
    const { mx, my } = controlPoint.value
    return `M${depX.value},${depY.value} Q${mx},${my} ${arrX.value},${arrY.value}`
})

function bezierPoint(t: number, x1: number, y1: number, cpx: number, cpy: number, x2: number, y2: number) {
    const mt = 1 - t
    return {
        x: mt * mt * x1 + 2 * mt * t * cpx + t * t * x2,
        y: mt * mt * y1 + 2 * mt * t * cpy + t * t * y2,
    }
}

const planePos = computed(() => {
    if (!props.showFlight) return { x: cx, y: cy }
    const { mx, my } = controlPoint.value
    return bezierPoint(props.progress, depX.value, depY.value, mx, my, arrX.value, arrY.value)
})

const planeX = computed(() => planePos.value.x)
const planeY = computed(() => planePos.value.y)

const planeAngle = computed(() => {
    if (!props.showFlight) return 0
    const { mx, my } = controlPoint.value
    const t = Math.min(props.progress + 0.01, 1)
    const t0 = Math.max(props.progress - 0.01, 0)
    const p1 = bezierPoint(t0, depX.value, depY.value, mx, my, arrX.value, arrY.value)
    const p2 = bezierPoint(t, depX.value, depY.value, mx, my, arrX.value, arrY.value)
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI) + 90
})
</script>

<style scoped>
.svg-globe-container {
    background: transparent;
}
</style>
