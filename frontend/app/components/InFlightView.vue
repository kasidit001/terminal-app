<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-surface p-6">
    <!-- Route -->
    <div class="flex items-center gap-6 mb-3">
      <span class="text-2xl font-mono font-bold text-white">{{ flightStore.departureAirport?.iata }}</span>
      <div class="flex items-center gap-3">
        <div class="w-12 h-px bg-white/20" />
        <svg class="w-5 h-5 text-flight-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
        <div class="w-12 h-px bg-white/20" />
      </div>
      <span class="text-2xl font-mono font-bold text-white">{{ flightStore.arrivalAirport?.iata }}</span>
    </div>

    <!-- Status badge -->
    <StatusBadge :status="statusLabel" />

    <!-- Countdown timer -->
    <h1 class="text-8xl font-mono font-bold tracking-tighter tabular-nums text-white mt-10 mb-4 select-none">
      {{ flightStore.formattedTime }}
    </h1>

    <!-- Task -->
    <p class="text-flight-400/70 text-sm font-medium uppercase tracking-[0.2em] mb-12">
      {{ flightStore.taskCategory }}
    </p>

    <!-- Progress bar -->
    <div class="w-full max-w-sm mb-16">
      <ProgressBar :percent="flightStore.progressPercent" />
    </div>

    <!-- Controls -->
    <div class="flex items-center gap-6">
      <!-- Emergency land -->
      <button
        class="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
        title="Emergency Landing"
        @click="handleEmergencyLand"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Pause / Resume -->
      <button
        class="w-20 h-20 rounded-full bg-flight-500 text-black flex items-center justify-center shadow-lg shadow-flight-500/30 hover:bg-flight-400 transition-all active:scale-95"
        @click="togglePause"
      >
        <!-- Pause icon -->
        <svg v-if="flightStore.status === 'in-flight'" class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
        <!-- Play icon -->
        <svg v-else class="w-7 h-7 ml-1" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>

      <!-- Land (complete) -->
      <button
        class="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all"
        title="Complete Flight"
        @click="handleLand"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </div>

    <!-- Distance info -->
    <p class="text-gray-600 text-xs font-mono mt-8">
      {{ flightStore.distance }} km
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../stores/useAppStore'
import { useFlightStore } from '../stores/useFlightStore'

const appStore = useAppStore()
const flightStore = useFlightStore()

const statusLabel = computed(() => {
  if (flightStore.status === 'paused') return 'PAUSED'
  return 'ON TIME'
})

const togglePause = () => {
  if (flightStore.status === 'in-flight') {
    flightStore.pauseFlight()
  } else {
    flightStore.resumeFlight()
  }
}

const handleLand = async () => {
  await flightStore.landFlight()
  appStore.navigateTo('landed')
}

const handleEmergencyLand = async () => {
  await flightStore.cancelFlight()
  appStore.navigateTo('landed')
}
</script>
