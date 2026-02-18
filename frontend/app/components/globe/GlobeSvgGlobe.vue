<template>
    <div ref="containerRef" class="svg-globe-container w-full h-full relative overflow-hidden">
        <svg :viewBox="`0 0 ${W} ${H}`" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <!-- Globe sphere gradient -->
                <radialGradient id="globeGrad" cx="38%" cy="32%" r="65%">
                    <stop offset="0%" stop-color="#1e4a8a" />
                    <stop offset="45%" stop-color="#0f2a5e" />
                    <stop offset="100%" stop-color="#060d1a" />
                </radialGradient>
                <!-- Atmosphere glow -->
                <radialGradient id="atmosphereGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="72%" stop-color="transparent" />
                    <stop offset="88%" stop-color="#3b82f6" stop-opacity="0.15" />
                    <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0.08" />
                </radialGradient>
                <!-- Highlight (glass effect) -->
                <radialGradient id="highlightGrad" cx="33%" cy="26%" r="55%">
                    <stop offset="0%" stop-color="rgba(255,255,255,0.14)" />
                    <stop offset="60%" stop-color="rgba(255,255,255,0.03)" />
                    <stop offset="100%" stop-color="rgba(255,255,255,0)" />
                </radialGradient>
                <!-- Clip to circle -->
                <clipPath id="globeClip">
                    <circle :cx="cx" :cy="cy" :r="R" />
                </clipPath>
                <!-- Drop shadow filter -->
                <filter id="globeShadow" x="-25%" y="-25%" width="150%" height="150%">
                    <feDropShadow dx="0" dy="6" stdDeviation="20" flood-color="#000" flood-opacity="0.7" />
                </filter>
                <!-- Glow filter for flight path -->
                <filter id="pathGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <!-- Marker glow -->
                <filter id="markerGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <!-- Atmosphere ring (behind globe) -->
            <circle :cx="cx" :cy="cy" :r="R + 18" fill="url(#atmosphereGrad)" />

            <!-- Globe sphere -->
            <circle :cx="cx" :cy="cy" :r="R" fill="url(#globeGrad)" filter="url(#globeShadow)" />

            <!-- Clipped content group -->
            <g clip-path="url(#globeClip)">
                <!-- Grid lines -->
                <g opacity="0.10" stroke="#7dd3fc" stroke-width="0.5" fill="none">
                    <!-- Latitude lines -->
                    <ellipse v-for="lat in latLines" :key="`lat-${lat}`" :cx="cx" :cy="cy" :rx="R"
                        :ry="R * Math.abs(Math.cos(lat * Math.PI / 180))" />
                    <!-- Longitude lines -->
                    <ellipse v-for="lng in lngLines" :key="`lng-${lng}`" :cx="cx" :cy="cy"
                        :rx="R * Math.abs(Math.cos(lng * Math.PI / 180))" :ry="R" />
                </g>

                <!-- Continents -->
                <g fill="#2d6e3e" stroke="#3d9150" stroke-width="0.7" opacity="0.92">
                    <path :d="northAmericaPath" />
                    <path :d="southAmericaPath" />
                    <path :d="europePath" />
                    <path :d="africaPath" />
                    <path :d="asiaPath" />
                    <path :d="australiaPath" />
                    <path :d="antarcticaPath" />
                    <path :d="greenlandPath" />
                </g>

                <!-- Flight arc -->
                <g v-if="showFlight && flightPath">
                    <!-- Glow arc -->
                    <path :d="flightPath" fill="none" stroke="#fbbf24" stroke-width="4" stroke-dasharray="10 6"
                        opacity="0.35" filter="url(#pathGlow)" />
                    <!-- Main arc -->
                    <path :d="flightPath" fill="none" stroke="#fbbf24" stroke-width="1.8" stroke-dasharray="10 6"
                        opacity="0.95" />

                    <!-- Departure marker -->
                    <circle :cx="depX" :cy="depY" r="7" fill="#10b981" opacity="0.3" filter="url(#markerGlow)" />
                    <circle :cx="depX" :cy="depY" r="4" fill="#10b981" stroke="white" stroke-width="1.5" />
                    <!-- Arrival marker -->
                    <circle :cx="arrX" :cy="arrY" r="7" fill="#ef4444" opacity="0.3" filter="url(#markerGlow)" />
                    <circle :cx="arrX" :cy="arrY" r="4" fill="#ef4444" stroke="white" stroke-width="1.5" />

                    <!-- Labels -->
                    <text :x="depX" :y="depY - 12" text-anchor="middle" fill="white" font-size="11" font-weight="bold"
                        font-family="'Courier New', monospace" style="text-shadow: 0 1px 4px rgba(0,0,0,0.8)">
                        {{ depLabel }}
                    </text>
                    <text :x="arrX" :y="arrY - 12" text-anchor="middle" fill="white" font-size="11" font-weight="bold"
                        font-family="'Courier New', monospace" style="text-shadow: 0 1px 4px rgba(0,0,0,0.8)">
                        {{ arrLabel }}
                    </text>

                    <!-- Animated plane -->
                    <text :x="planeX" :y="planeY" text-anchor="middle" dominant-baseline="middle" font-size="18"
                        :transform="`rotate(${planeAngle}, ${planeX}, ${planeY})`"
                        style="user-select: none; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));">✈</text>
                </g>
            </g>

            <!-- Glass highlight overlay -->
            <circle :cx="cx" :cy="cy" :r="R" fill="url(#highlightGrad)" />

            <!-- Thin border ring -->
            <circle :cx="cx" :cy="cy" :r="R" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
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

// SVG canvas dimensions
const W = 800
const H = 800
const cx = W / 2
const cy = H / 2
const R = 360

// Grid
const latLines = [-60, -30, 0, 30, 60]
const lngLines = [-60, -30, 0, 30, 60]

// Convert lat/lng to SVG x/y using equirectangular projection centered on globe
function ll2xy(lat: number, lng: number): [number, number] {
    const x = cx + R * (lng / 180)
    const y = cy - R * (lat / 90)
    return [x, y]
}

function makePath(coords: [number, number][]): string {
    return coords.map(([lat, lng], i) => {
        const [x, y] = ll2xy(lat, lng)
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ') + ' Z'
}

// ─── Continent outlines (simplified, [lat, lng]) ─────────────────────────────

const northAmericaPath = makePath([
    [70, -140], [72, -100], [68, -85], [60, -65], [47, -53],
    [44, -66], [25, -80], [20, -87], [15, -85], [8, -77],
    [10, -75], [20, -87], [22, -90], [30, -97], [32, -117],
    [38, -122], [48, -124], [55, -130], [60, -140], [65, -168],
    [70, -155], [70, -140],
])

const southAmericaPath = makePath([
    [12, -72], [10, -62], [5, -52], [0, -50],
    [-5, -35], [-15, -39], [-23, -43], [-33, -53],
    [-42, -65], [-55, -68], [-56, -67], [-50, -75],
    [-42, -73], [-30, -71], [-18, -70], [-5, -81],
    [5, -77], [12, -72],
])

const europePath = makePath([
    [71, 28], [70, 18], [65, 14], [58, 5], [51, 2],
    [43, -9], [36, -9], [36, 3], [38, 15], [40, 18],
    [42, 28], [45, 30], [47, 38], [55, 37], [60, 28],
    [65, 25], [70, 28], [71, 28],
])

const africaPath = makePath([
    [37, -5], [37, 10], [30, 32], [22, 37], [12, 44],
    [5, 41], [-5, 40], [-15, 35], [-25, 33], [-35, 18],
    [-35, 27], [-25, 33], [-15, 35], [-5, 40], [5, 41],
    [12, 44], [22, 37], [30, 32], [37, 10], [37, -5],
    [30, -10], [20, -17], [10, -15], [5, -5], [-5, 10],
    [-15, 12], [-25, 15], [-35, 18],
])

const asiaPath = makePath([
    [70, 30], [72, 70], [72, 130], [60, 140], [50, 142],
    [43, 132], [35, 130], [22, 114], [10, 105], [1, 104],
    [-8, 115], [-8, 140], [5, 100], [15, 80], [8, 77],
    [20, 60], [22, 57], [25, 57], [30, 48], [37, 44],
    [40, 50], [45, 60], [50, 80], [55, 90], [60, 100],
    [65, 90], [70, 60], [70, 30],
])

const australiaPath = makePath([
    [-15, 130], [-12, 136], [-12, 142], [-18, 148],
    [-28, 154], [-38, 147], [-38, 140], [-32, 116],
    [-22, 114], [-15, 122], [-15, 130],
])

const antarcticaPath = makePath([
    [-68, -180], [-68, -90], [-68, 0], [-68, 90], [-68, 180],
    [-90, 180], [-90, 0], [-90, -180],
])

const greenlandPath = makePath([
    [83, -40], [76, -18], [72, -22], [65, -38], [60, -44],
    [65, -52], [72, -56], [76, -68], [83, -40],
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
    const my = (y1 + y2) / 2 - dist * 0.38
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

const planeX = computed(() => {
    if (!props.showFlight) return cx
    const { mx, my } = controlPoint.value
    return bezierPoint(props.progress, depX.value, depY.value, mx, my, arrX.value, arrY.value).x
})

const planeY = computed(() => {
    if (!props.showFlight) return cy
    const { mx, my } = controlPoint.value
    return bezierPoint(props.progress, depX.value, depY.value, mx, my, arrX.value, arrY.value).y
})

const planeAngle = computed(() => {
    if (!props.showFlight) return 0
    const { mx, my } = controlPoint.value
    const t = Math.min(props.progress + 0.01, 1)
    const t0 = Math.max(props.progress - 0.01, 0)
    const p1 = bezierPoint(t0, depX.value, depY.value, mx, my, arrX.value, arrY.value)
    const p2 = bezierPoint(t, depX.value, depY.value, mx, my, arrX.value, arrY.value)
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI)
})
</script>

<style scoped>
.svg-globe-container {
    background: transparent;
}
</style>
