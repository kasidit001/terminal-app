<template>
  <div class="relative w-full h-screen overflow-hidden">
    <!-- Full-screen globe -->
    <div class="absolute inset-0">
      <ClientOnly>
        <GlobeCesiumGlobe ref="globeRef" :interactive="true" :show-atmosphere="true"
          :initial-lat="appStore.homeAirport!.lat" :initial-lng="appStore.homeAirport!.lng" :initial-height="8000000"
          @ready="onGlobeReady" />
      </ClientOnly>
    </div>

    <!-- Top bar -->
    <div class="absolute top-0 inset-x-0 z-[1000] p-6 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-flight-400/10 border border-flight-400/30 flex items-center justify-center">
          <svg class="w-4 h-4 text-flight-400" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
        </div>
        <span class="text-white font-bold text-lg">Focus<span class="text-flight-400">Flight</span></span>
      </div>

      <!-- Home airport info -->
      <div class="glass-card px-3 py-1.5 flex items-center gap-2">
        <span class="text-gray-400 text-xs">HOME</span>
        <span class="text-flight-400 font-mono font-bold text-sm">{{ appStore.homeAirport!.iata }}</span>
      </div>
    </div>

    <!-- Bottom action area -->
    <div class="absolute bottom-0 inset-x-0 z-[1000] p-6 pb-10 space-y-4">
      <!-- Stats strip (shown after first flight) -->
      <div v-if="statsStore.totalFlights > 0" class="w-full max-w-md mx-auto flex items-center justify-center gap-4">
        <div
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
          <span class="text-sm">🔥</span>
          <span class="text-xs font-mono font-bold text-flight-400">{{ statsStore.currentStreak }}</span>
          <span class="text-xs text-gray-500">day streak</span>
        </div>
        <div
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
          <span class="text-sm">✈️</span>
          <span class="text-xs font-mono font-bold text-white">{{ statsStore.totalFlights }}</span>
          <span class="text-xs text-gray-500">flights</span>
        </div>
        <div
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
          <span class="text-sm">{{ statsStore.focusLevel.icon }}</span>
          <span class="text-xs font-semibold" :class="statsStore.focusLevel.color">{{ statsStore.focusLevel.label
            }}</span>
        </div>
      </div>
      <button class="w-full max-w-md mx-auto block btn-primary" @click="showNewFlight = true">
        New Flight
      </button>
    </div>

    <!-- New flight bottom sheet -->
    <UiBottomSheet v-model:open="showNewFlight">
      <div class="space-y-6">
        <h2 class="text-xl font-bold text-white">Plan Your Flight</h2>

        <!-- Departure (locked) -->
        <div>
          <label class="label-sm mb-2 block">DEPARTURE</label>
          <div class="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
            <AirportBadge :iata="appStore.homeAirport!.iata" />
            <div>
              <p class="text-white font-medium text-sm">{{ appStore.homeAirport!.city }}</p>
              <p class="text-gray-500 text-xs">{{ appStore.homeAirport!.name }}</p>
            </div>
          </div>
        </div>

        <!-- Arrival (searchable) -->
        <div>
          <label class="label-sm mb-2 block">DESTINATION</label>
          <div class="relative">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input v-model="arrivalSearch.searchQuery.value" type="text" placeholder="Search destination airport..."
              class="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-flight-400/50 transition-colors text-sm" />
          </div>

          <!-- Selected arrival -->
          <div v-if="selectedArrival"
            class="mt-2 flex items-center gap-3 bg-flight-400/5 rounded-xl px-4 py-3 border border-flight-400/20">
            <AirportBadge :iata="selectedArrival.iata" />
            <div class="flex-1">
              <p class="text-white font-medium text-sm">{{ selectedArrival.city }}</p>
              <p class="text-gray-500 text-xs">{{ selectedArrival.name }}</p>
            </div>
            <button @click="selectedArrival = null" class="text-gray-500 hover:text-white">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Airport list -->
          <div v-else class="mt-2 max-h-48 overflow-y-auto">
            <AirportSearchList :airports="arrivalSearch.filteredAirports.value" @select="handleArrivalSelect" />
          </div>
        </div>

        <!-- Duration -->
        <div>
          <label class="label-sm mb-2 block">DURATION (MINUTES)</label>
          <div class="flex items-center gap-3">
            <button v-for="d in presetDurations" :key="d"
              class="flex-1 py-2.5 rounded-xl text-sm font-mono font-bold transition-all border" :class="duration === d
                ? 'bg-flight-400/10 border-flight-400/40 text-flight-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'" @click="duration = d">
              {{ d }}
            </button>
            <input v-model.number="duration" type="number" min="1" max="180"
              class="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono text-center text-sm focus:outline-none focus:border-flight-400/50" />
          </div>
        </div>

        <!-- Board flight button -->
        <button :disabled="!canBoard"
          class="btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          @click="handleBoardFlight">
          Board Flight
        </button>
      </div>
    </UiBottomSheet>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore, type Airport } from '../stores/useAppStore'
import { useFlightStore } from '../stores/useFlightStore'
import { useStatsStore } from '../stores/useStatsStore'
import { useAirports } from '../composables/useAirports'
import { useGreatCircle } from '../composables/useGreatCircle'
import type { useCesium } from '../composables/useCesium'

const appStore = useAppStore()
const flightStore = useFlightStore()
const statsStore = useStatsStore()
const arrivalSearch = useAirports()
const { getDistance } = useGreatCircle()

const globeRef = ref()
const showNewFlight = ref(false)
const selectedArrival = ref<Airport | null>(null)
const duration = ref(25)

const presetDurations = [15, 25, 45, 60]

const canBoard = computed(() =>
  selectedArrival.value && duration.value > 0
)

const onGlobeReady = (cesium: ReturnType<typeof useCesium>) => {
  if (appStore.homeAirport) {
    cesium.addAirportMarker({
      iata: appStore.homeAirport.iata,
      lat: appStore.homeAirport.lat,
      lng: appStore.homeAirport.lng,
    })
  }
}

const handleArrivalSelect = (airport: Airport) => {
  selectedArrival.value = airport
  arrivalSearch.searchQuery.value = ''
}

const handleBoardFlight = () => {
  if (!selectedArrival.value || !appStore.homeAirport) return

  const dist = getDistance(
    appStore.homeAirport.lat, appStore.homeAirport.lng,
    selectedArrival.value.lat, selectedArrival.value.lng
  )

  flightStore.bookFlight({
    departure: appStore.homeAirport,
    arrival: selectedArrival.value,
    duration: duration.value,
    dist,
  })

  showNewFlight.value = false
  appStore.navigateTo('boarding')

  // Reset form
  selectedArrival.value = null
  duration.value = 25
}
</script>
