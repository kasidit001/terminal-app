<template>
  <div class="flex items-center justify-center min-h-screen bg-surface p-6">
    <div class="w-full max-w-md text-center space-y-6">
      <!-- Globe route map -->
      <div class="h-40 rounded-2xl overflow-hidden">
        <ClientOnly>
          <GlobeRouteMap
            v-if="flightStore.departureAirport && flightStore.arrivalAirport"
            :departure="flightStore.departureAirport"
            :arrival="flightStore.arrivalAirport"
          />
        </ClientOnly>
      </div>

      <!-- Status icon -->
      <div class="flex justify-center">
        <div
          class="w-16 h-16 rounded-full flex items-center justify-center"
          :class="isCompleted ? 'bg-emerald-500/10 border-2 border-emerald-500/30' : 'bg-red-500/10 border-2 border-red-500/30'"
        >
          <svg v-if="isCompleted" class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>

      <!-- Title -->
      <div>
        <h1 class="text-3xl font-bold text-white">
          {{ isCompleted ? 'Flight Landed' : 'Flight Cancelled' }}
        </h1>
        <p class="text-gray-400 mt-2 text-sm">
          {{ isCompleted ? 'Well done! Another successful focus session.' : 'Flight ended early. Every flight counts.' }}
        </p>
      </div>

      <!-- Focused time (prominent) -->
      <div v-if="isCompleted" class="py-2">
        <p class="label-sm">Focused Time</p>
        <p class="text-5xl font-mono font-bold text-flight-400 mt-2">
          {{ focusedMinutes }}<span class="text-2xl text-gray-400">m</span>
        </p>
      </div>

      <!-- Flight stats card -->
      <div class="glass-card p-5 space-y-4" ref="summaryCardRef">
        <!-- Route -->
        <div class="flex items-center justify-between">
          <div class="text-left">
            <p class="text-2xl font-mono font-bold text-white">{{ flightStore.departureAirport?.iata }}</p>
            <p class="text-xs text-gray-400">{{ flightStore.departureAirport?.city }}</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-px bg-flight-400/30" />
            <svg class="w-4 h-4 text-flight-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
            <div class="w-6 h-px bg-flight-400/30" />
          </div>
          <div class="text-right">
            <p class="text-2xl font-mono font-bold text-white">{{ flightStore.arrivalAirport?.iata }}</p>
            <p class="text-xs text-gray-400">{{ flightStore.arrivalAirport?.city }}</p>
          </div>
        </div>

        <div class="border-t border-white/5" />

        <!-- Stats grid -->
        <div class="grid grid-cols-2 gap-4">
          <div class="text-left">
            <p class="label-sm">Duration</p>
            <p class="text-white font-mono font-bold mt-1">{{ flightStore.plannedDuration }}m</p>
          </div>
          <div class="text-right">
            <p class="label-sm">Distance</p>
            <p class="text-white font-mono font-bold mt-1">{{ flightStore.distance.toLocaleString() }} km</p>
          </div>
          <div class="text-left">
            <p class="label-sm">Seat</p>
            <p class="text-white font-mono font-bold mt-1">{{ flightStore.seatNumber || '---' }}</p>
          </div>
          <div class="text-right">
            <p class="label-sm">Mission</p>
            <p class="text-white font-medium text-sm mt-1">{{ flightStore.focusActivity || 'Focus' }}</p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="space-y-3 pt-2">
        <button class="btn-primary" @click="handleNewFlight">
          New Flight
        </button>
        <button
          class="w-full py-3 text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2"
          @click="handleShare"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Flight Certificate
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/useAppStore'
import { useFlightStore } from '../stores/useFlightStore'
import { useShare } from '../composables/useShare'

const appStore = useAppStore()
const flightStore = useFlightStore()
const { shareElement } = useShare()

const summaryCardRef = ref<HTMLElement>()

const isCompleted = computed(() => flightStore.status === 'landed')

const focusedMinutes = computed(() => {
  return Math.round(flightStore.elapsedSeconds / 60)
})

const handleNewFlight = () => {
  flightStore.reset()
  appStore.navigateTo('home')
}

const handleShare = () => {
  if (summaryCardRef.value) {
    shareElement(summaryCardRef.value, 'FocusFlight - Flight Certificate')
  }
}
</script>
