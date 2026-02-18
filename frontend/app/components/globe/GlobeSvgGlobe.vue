<template>
    <div ref="containerRef" class="svg-globe-container w-full h-full relative overflow-hidden">
        <svg ref="svgRef" :viewBox="`0 0 ${W} ${H}`" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <!-- Globe sphere gradient -->
                <radialGradient id="globeGrad" cx="38%" cy="32%" r="65%">
                    <stop offset="0%" stop-color="#2d5fa8" />
                    <stop offset="40%" stop-color="#1a3a6e" />
                    <stop offset="100%" stop-color="#0a1628" />
                </radialGradient>
                <!-- Atmosphere glow -->
                <radialGradient id="atmosphereGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="75%" stop-color="transparent" />
                    <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.25" />
                </radialGradient>
                <!-- Highlight (glass effect) -->
                <radialGradient id="highlightGrad" cx="35%" cy="28%" r="50%">
                    <stop offset="0%" stop-color="rgba(255,255,255,0.18)" />
                    <stop offset="100%" stop-color="rgba(255,255,255,0)" />
                </radialGradient>
                <!-- Clip to circle -->
                <clipPath id="globeClip">
                    <circle :cx="cx" :cy="cy" :r="R" />
                </clipPath>
                <!-- Drop shadow filter -->
                <filter id="globeShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="16" flood-color="#000" flood-opacity="0.6" />
                </filter>
                <!-- Glow filter for flight path -->
                <filter id="pathGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <!-- Atmosphere ring (behind globe) -->
            <circle :cx="cx" :cy="cy" :r="R + 14" fill="url(#atmosphereGrad)" />

            <!-- Globe sphere -->
            <circle :cx="cx" :cy="cy" :r="R" fill="url(#globeGrad)" filter="url(#globeShadow)" />

            <!-- Clipped content group -->
            <g clip-path="url(#globeClip)">
                <!-- Grid lines -->
                <g :opacity="0.12" stroke="white" stroke-width="0.6" fill="none">
                    <!-- Latitude lines -->
                    <ellipse v-for="lat in latLines" :key="`lat-${lat}`" :cx="cx" :cy="cy" :rx="R"
                        :ry="R * Math.abs(Math.cos(lat * Math.PI / 180))" />
                    <!-- Longitude lines (as vertical ellipses) -->
                    <ellipse v-for="lng in lngLines" :key="`lng-${lng}`" :cx="cx" :cy="cy"
                        :rx="R * Math.abs(Math.cos(lng * Math.PI / 180))" :ry="R" />
                </g>

                <!-- Continents -->
                <g fill="#2d6e3e" stroke="#3a8a4e" stroke-width="0.8" opacity="0.9">
                    <!-- North America -->
                    <path :d="scaleD(northAmerica)" />
                    <!-- South America -->
                    <path :d="scaleD(southAmerica)" />
                    <!-- Europe -->
                    <path :d="scaleD(europe)" />
                    <!-- Africa -->
                    <path :d="scaleD(africa)" />
                    <!-- Asia -->
                    <path :d="scaleD(asia)" />
                    <!-- Australia -->
                    <path :d="scaleD(australia)" />
                    <!-- Antarctica -->
                    <path :d="scaleD(antarctica)" />
                </g>

                <!-- Flight arc -->
                <g v-if="showFlight && flightPath">
                    <!-- Glow arc -->
                    <path :d="flightPath" fill="none" stroke="#fbbf24" stroke-width="3" stroke-dasharray="8 5"
                        opacity="0.4" filter="url(#pathGlow)" />
                    <!-- Main arc -->
                    <path :d="flightPath" fill="none" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="8 5"
                        opacity="0.9" />
                    <!-- Departure dot -->
                    <circle :cx="depX" :cy="depY" r="5" fill="#10b981" stroke="white" stroke-width="1.5" />
                    <!-- Arrival dot -->
                    <circle :cx="arrX" :cy="arrY" r="5" fill="#ef4444" stroke="white" stroke-width="1.5" />
                    <!-- Departure label -->
                    <text :x="depX" :y="depY - 10" text-anchor="middle" fill="white" font-size="10" font-weight="bold"
                        font-family="monospace">
                        {{ depLabel }}
                    </text>
                    <!-- Arrival label -->
                    <text :x="arrX" :y="arrY - 10" text-anchor="middle" fill="white" font-size="10" font-weight="bold"
                        font-family="monospace">
                        {{ arrLabel }}
                    </text>
                    <!-- Animated plane -->
                    <text :x="planeX" :y="planeY" text-anchor="middle" dominant-baseline="middle" font-size="16"
                        :transform="`rotate(${planeAngle}, ${planeX}, ${planeY})`" style="user-select: none;">✈</text>
                </g>
            </g>

            <!-- Glass highlight overlay -->
            <circle :cx="cx" :cy="cy" :r="R" fill="url(#highlightGrad)" />
        </svg>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

interface Props {
    /** Show animated flight arc */
    showFlight?: boolean
    /** Departure coords [lat, lng] */
    departure?: [number, number]
    /** Arrival coords [lat, lng] */
    arrival?: [number, number]
    /** IATA labels */
    depLabel?: string
    arrLabel?: string
    /** Progress 0-1 for plane position */
    progress?: number
    /** Slowly rotate the globe */
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

// SVG canvas dimensions
const W = 800
const H = 800
const cx = W / 2
const cy = H / 2
const R = 340

// Grid
const latLines = [-60, -30, 0, 30, 60]
const lngLines = [-60, -30, 0, 30, 60]

// ─── Continent SVG paths (Mercator-like, mapped to 800×800 space) ───────────
// These are simplified continent outlines scaled to a 1000×500 base then remapped
// Base coordinate system: x: 0-1000 (lng -180→180), y: 0-500 (lat 90→-90)

function ll2xy(lat: number, lng: number): [number, number] {
    // Map lat/lng to SVG coords centered on globe
    const x = cx + R * (lng / 180)
    const y = cy - R * (lat / 90)
    return [x, y]
}

function pts(coords: [number, number][]): string {
    return coords.map(([lat, lng], i) => {
        const [x, y] = ll2xy(lat, lng)
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ') + ' Z'
}

// Simplified continent outlines as [lat, lng] arrays
const northAmerica = pts([
    [72, -140], [72, -90], [60, -65], [47, -53], [45, -60], [25, -80],
    [10, -83], [8, -77], [10, -75], [20, -87], [22, -90], [30, -97],
    [32, -117], [38, -122], [48, -124], [60, -140], [65, -168], [72, -160],
])

const southAmerica = pts([
    [12, -72], [10, -62], [5, -52], [-5, -35], [-15, -39], [-23, -43],
    [-33, -53], [-42, -65], [-55, -68], [-56, -68], [-50, -75], [-42, -73],
    [-30, -71], [-18, -70], [-5, -81], [5, -77], [12, -72],
])

const europe = pts([
    [71, 28], [70, 18], [58, 5], [51, 2], [43, -9], [36, -9], [36, 3],
    [38, 15], [40, 18], [42, 28], [45, 30], [47, 38], [60, 28], [65, 25],
    [70, 28], [71, 28],
])

const africa = pts([
    [37, -5], [37, 10], [30, 32], [22, 37], [12, 44], [5, 41], [-5, 40],
    [-15, 35], [-25, 33], [-35, 18], [-35, 27], [-25, 33], [-15, 35],
    [-5, 40], [5, 41], [12, 44], [22, 37], [30, 32], [37, 10], [37, -5],
    [30, -10], [20, -17], [10, -15], [5, -5], [-5, 10], [-15, 12],
    [-25, 15], [-35, 18], [-35, 27], [-25, 33], [-15, 35], [-5, 40],
    [5, 41], [12, 44], [22, 37], [30, 32], [37, 10], [37, -5],
])

const asia = pts([
    [70, 30], [72, 70], [72, 130], [60, 140], [50, 142], [43, 132],
    [35, 130], [22, 114], [10, 105], [1, 104], [-8, 115], [-8, 140],
    [5, 100], [15, 80], [8, 77], [20, 60], [22, 57], [25, 57], [30, 48],
    [37, 44], [40, 50], [45, 60], [50, 80], [55, 90], [60, 100], [65, 90],
    [70, 60], [70, 30],
])

const australia = pts([
    [-15, 130], [-12, 136], [-12, 142], [-18, 148], [-28, 154], [-38, 147],
    [-38, 140], [-32, 116], [-22, 114], [-15, 122], [-15, 130],
])

const antarctica = pts([
    [-70, -180], [-70, -90], [-70, 0], [-70, 90], [-70, 180],
    [-90, 180], [-90, 0], [-90, -180],
])

// Dummy scaleD (paths are already computed above)
function scaleD(d: string): string { return d }

// ─── Flight arc ──────────────────────────────────────────────────────────────
const depX = computed(() => ll2xy(props.departure[0], props.departure[1])[0])
const depY = computed(() => ll2xy(props.departure[0], props.departure[1])[1])
const arrX = computed(() => ll2xy(props.arrival[0], props.arrival[1])[0])
const arrY = computed(() => ll2xy(props.arrival[0], props.arrival[1])[1])

const flightPath = computed(() => {
    if (!props.showFlight) return null
    const x1 = depX.value, y1 = depY.value
    const x2 = arrX.value, y2 = arrY.value
    // Control point: arc upward proportional to distance
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.35
    return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`
})

// Plane position along the quadratic bezier
function bezierPoint(t: number, x1: number, y1: number, cpx: number, cpy: number, x2: number, y2: number) {
    const mt = 1 - t
    return {
        x: mt * mt * x1 + 2 * mt * t * cpx + t * t * x2,
        y: mt * mt * y1 + 2 * mt * t * cpy + t * t * y2,
    }
}

const planeX = computed(() => {
    if (!props.showFlight) return cx
    const x1 = depX.value, y1 = depY.value, x2 = arrX.value, y2 = arrY.value
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.35
    return bezierPoint(props.progress, x1, y1, mx, my, x2, y2).x
})

const planeY = computed(() => {
    if (!props.showFlight) return cy
    const x1 = depX.value, y1 = depY.value, x2 = arrX.value, y2 = arrY.value
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.35
    return bezierPoint(props.progress, x1, y1, mx, my, x2, y2).y
})

const planeAngle = computed(() => {
    if (!props.showFlight) return 0
    const t = Math.min(props.progress + 0.01, 1)
    const t0 = Math.max(props.progress - 0.01, 0)
    const x1 = depX.value, y1 = depY.value, x2 = arrX.value, y2 = arrY.value
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.35
    const p1 = bezierPoint(t0, x1, y1, mx, my, x2, y2)
    const p2 = bezierPoint(t, x1, y1, mx, my, x2, y2)
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI)
})

// ─── Auto-rotate (subtle CSS animation) ─────────────────────────────────────
const svgRef = ref<SVGElement>()
const containerRef = ref<HTMLElement>()
</script>

<style scoped>
.svg-globe-container {
    background: transparent;
}
</style>
