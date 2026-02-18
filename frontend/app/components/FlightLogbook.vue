<template>
    <div class="h-full bg-surface flex flex-col overflow-hidden">
        <!-- Header -->
        <div class="px-6 pt-6 pb-4 flex items-center justify-between shrink-0">
            <button
                class="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                @click="appStore.navigateTo('home')">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <h1 class="text-lg font-bold text-white">Flight Logbook</h1>
            <div class="w-9" />
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="flex-1 flex items-center justify-center">
            <div class="flex flex-col items-center gap-3">
                <div class="w-8 h-8 border-2 border-flight-400/30 border-t-flight-400 rounded-full animate-spin" />
                <p class="text-gray-500 text-sm">Loading logbook...</p>
            </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="!loading && flights.length === 0"
            class="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
            <div class="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <svg class="w-10 h-10 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                    <path
                        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
            </div>
            <div>
                <p class="text-white font-semibold text-lg">No flights yet</p>
                <p class="text-gray-500 text-sm mt-1">Complete your first focus flight to see it here.</p>
            </div>
            <button class="btn-primary mt-2" @click="appStore.navigateTo('home')">
                Start First Flight
            </button>
        </div>

        <!-- Content -->
        <div v-else class="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
            <!-- Stats summary strip -->
            <div class="grid grid-cols-3 gap-2 px-2">
                <div class="glass-card p-3 text-center">
                    <p class="text-2xl font-mono font-bold text-white">{{ stats?.totalFlights ?? statsStore.totalFlights
                        }}</p>
                    <p class="label-sm mt-0.5">Flights</p>
                </div>
                <div class="glass-card p-3 text-center">
                    <p class="text-2xl font-mono font-bold text-flight-400">{{ totalHoursDisplay }}</p>
                    <p class="label-sm mt-0.5">Hours</p>
                </div>
                <div class="glass-card p-3 text-center">
                    <p class="text-2xl font-mono font-bold text-white">{{ totalDistanceDisplay }}</p>
                    <p class="label-sm mt-0.5">km flown</p>
                </div>
            </div>

            <!-- Top route badge -->
            <div v-if="stats?.topRoute"
                class="mx-2 px-4 py-2.5 rounded-xl bg-flight-400/5 border border-flight-400/20 flex items-center gap-3">
                <span class="text-flight-400 text-lg">🏆</span>
                <div>
                    <p class="text-xs text-gray-500 font-mono uppercase tracking-wider">Favourite Route</p>
                    <p class="text-white font-mono font-bold text-sm mt-0.5">{{ stats.topRoute.route }}</p>
                </div>
                <div class="ml-auto text-right">
                    <p class="text-flight-400 font-mono font-bold">{{ stats.topRoute.count }}×</p>
                </div>
            </div>

            <!-- Activity breakdown -->
            <div v-if="stats?.activityBreakdown?.length" class="mx-2">
                <p class="label-sm mb-2 px-1">Activity Breakdown</p>
                <div class="glass-card p-3 space-y-2">
                    <div v-for="item in stats.activityBreakdown" :key="item.activity" class="flex items-center gap-3">
                        <span class="text-base w-6 text-center">{{ activityIcon(item.activity) }}</span>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between mb-1">
                                <p class="text-white text-xs font-medium truncate">{{ item.activity }}</p>
                                <p class="text-gray-400 text-xs font-mono shrink-0 ml-2">{{ item.totalMinutes }}m</p>
                            </div>
                            <div class="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div class="h-full bg-flight-400/60 rounded-full transition-all duration-700"
                                    :style="{ width: `${activityPercent(item.totalMinutes)}%` }" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Flight history list -->
            <div class="mx-2">
                <p class="label-sm mb-2 px-1">Recent Flights</p>
                <div class="space-y-2">
                    <div v-for="flight in flights" :key="flight.id" class="glass-card p-4">
                        <!-- Route row -->
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-2">
                                <span class="text-white font-mono font-bold text-base">{{ flight.departureCode }}</span>
                                <svg class="w-3.5 h-3.5 text-flight-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path
                                        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                                </svg>
                                <span class="text-white font-mono font-bold text-base">{{ flight.arrivalCode }}</span>
                            </div>
                            <!-- Status badge -->
                            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full" :class="flight.status === 'landed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'">
                                {{ flight.status === 'landed' ? 'LANDED' : 'CANCELLED' }}
                            </span>
                        </div>

                        <!-- Details row -->
                        <div class="flex items-center gap-4 text-xs">
                            <div class="flex items-center gap-1 text-gray-400">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span class="font-mono">{{ flight.plannedDuration }}m</span>
                            </div>
                            <div v-if="flight.distance" class="flex items-center gap-1 text-gray-400">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                <span class="font-mono">{{ flight.distance.toLocaleString() }} km</span>
                            </div>
                            <div v-if="flight.focusActivity" class="flex items-center gap-1 text-gray-400">
                                <span>{{ activityIcon(flight.focusActivity) }}</span>
                                <span>{{ flight.focusActivity }}</span>
                            </div>
                            <div class="ml-auto text-gray-600 font-mono">
                                {{ formatDate(flight.completedAt || flight.startedAt) }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../stores/useAppStore'
import { useStatsStore } from '../stores/useStatsStore'

const appStore = useAppStore()
const statsStore = useStatsStore()

interface FlightRecord {
    id: string
    departureCode: string
    arrivalCode: string
    plannedDuration: number
    status: string
    distance?: number
    focusActivity?: string
    seatNumber?: string
    startedAt?: string
    completedAt?: string
}

interface StatsData {
    totalFlights: number
    totalMinutes: number
    totalHours: number
    totalDistance: number
    activityBreakdown: { activity: string; count: number; totalMinutes: number }[]
    topRoute: { route: string; count: number } | null
}

const flights = ref<FlightRecord[]>([])
const stats = ref<StatsData | null>(null)
const loading = ref(true)

const totalHoursDisplay = computed(() => {
    const minutes = stats.value?.totalMinutes ?? statsStore.totalFocusMinutes
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h${m > 0 ? m + 'm' : ''}` : `${m}m`
})

const totalDistanceDisplay = computed(() => {
    const dist = stats.value?.totalDistance ?? 0
    if (dist >= 1000) return `${(dist / 1000).toFixed(1)}k`
    return dist.toLocaleString()
})

const maxActivityMinutes = computed(() => {
    if (!stats.value?.activityBreakdown?.length) return 1
    return Math.max(...stats.value.activityBreakdown.map(a => a.totalMinutes))
})

const activityPercent = (minutes: number) => {
    return Math.round((minutes / maxActivityMinutes.value) * 100)
}

const activityIcon = (activity: string) => {
    const icons: Record<string, string> = {
        'Deep Work': '🧠',
        'Study': '📚',
        'Writing': '✍️',
        'Coding': '💻',
        'Reading': '📖',
        'Design': '🎨',
        'Planning': '📋',
        'Meditation': '🧘',
        'Focus': '🎯',
    }
    return icons[activity] ?? '✈️'
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

onMounted(async () => {
    try {
        const [flightsRes, statsRes] = await Promise.all([
            fetch('http://localhost:4000/api/flights/recent'),
            fetch('http://localhost:4000/api/stats'),
        ])
        if (flightsRes.ok) flights.value = await flightsRes.json()
        if (statsRes.ok) stats.value = await statsRes.json()
    } catch (e) {
        // Backend unavailable — fall back to local stats store data
        console.warn('Backend unavailable, using local stats')
    } finally {
        loading.value = false
    }
})
</script>
