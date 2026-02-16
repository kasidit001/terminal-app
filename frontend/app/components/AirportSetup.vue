<template>
  <div class="relative w-full h-screen overflow-hidden bg-surface">
    <!-- Background Map -->
    <div class="absolute inset-0 opacity-20">
      <ClientOnly>
        <LMap
          :zoom="3"
          :center="mapCenter"
          :zoom-control="false"
          :dragging="false"
          :scroll-wheel-zoom="false"
          :double-click-zoom="false"
          :touch-zoom="false"
          :keyboard="false"
          :attribution-control="false"
          style="width: 100%; height: 100%"
        >
          <LTileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        </LMap>
      </ClientOnly>
    </div>

    <!-- Gradient overlay -->
    <div class="absolute inset-0 bg-gradient-to-b from-surface/60 via-surface/40 to-surface z-10" />

    <!-- Content -->
    <div class="relative z-20 flex flex-col h-full">
      <!-- Header -->
      <div class="px-6 pt-12 pb-4">
        <h1 class="text-2xl font-bold text-white">Select Your Starting Airport</h1>
        <p class="text-gray-400 text-sm mt-1">Choose your home base for focus flights</p>
      </div>

      <!-- Search -->
      <div class="px-6 pb-4">
        <div class="relative">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="airportSearch.searchQuery.value"
            type="text"
            placeholder="Search Airport / City"
            class="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-flight-400/50 transition-colors text-sm"
          />
        </div>
      </div>

      <!-- Action buttons -->
      <div class="px-6 pb-3 flex gap-3">
        <button
          class="flex-1 btn-secondary flex items-center justify-center gap-2 !py-3"
          :disabled="geo.loading.value"
          @click="handleUseLocation"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="text-sm">{{ geo.loading.value ? 'Locating...' : 'Use Current Location' }}</span>
        </button>
        <button
          class="flex-shrink-0 btn-secondary flex items-center justify-center gap-2 !py-3 !w-auto px-4"
          @click="handleRandomLocation"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="text-sm">Random</span>
        </button>
      </div>

      <!-- Airport list -->
      <div class="flex-1 overflow-y-auto px-6 pb-6">
        <AirportSearchList
          :airports="airportSearch.filteredAirports.value"
          @select="handleAirportSelect"
        />
      </div>
    </div>

    <!-- Confirmation dialog -->
    <Transition name="confirm">
      <div v-if="confirmAirport" class="fixed inset-0 z-[3000] flex items-end justify-center">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="confirmAirport = null" />
        <div class="relative w-full max-w-md mx-4 mb-8 bg-surface-50 border border-white/10 rounded-3xl p-6 text-center space-y-5">
          <h2 class="text-xl font-bold text-white">Starting From Here?</h2>
          <p class="text-gray-400 text-sm">Once confirmed, the departure airport cannot be changed.</p>

          <div class="flex flex-col items-center gap-2 py-4">
            <AirportBadge :iata="confirmAirport.iata" :large="true" />
            <p class="text-white font-medium text-lg mt-2">{{ confirmAirport.city }}</p>
            <p class="text-gray-500 text-sm">{{ confirmAirport.name }}</p>
          </div>

          <button class="btn-primary" @click="handleConfirm">
            Confirm
          </button>
          <button
            class="w-full py-3 text-gray-400 hover:text-white transition-colors font-medium"
            @click="confirmAirport = null"
          >
            Cancel
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore, type Airport } from '../stores/useAppStore'
import { useAirports } from '../composables/useAirports'
import { useGeolocation } from '../composables/useGeolocation'

const appStore = useAppStore()
const airportSearch = useAirports()
const geo = useGeolocation()

const confirmAirport = ref<Airport | null>(null)
const mapCenter = ref<[number, number]>([20, 100])

const handleAirportSelect = (airport: Airport) => {
  confirmAirport.value = airport
}

const handleUseLocation = async () => {
  try {
    const { lat, lng } = await geo.requestLocation()
    mapCenter.value = [lat, lng]
    const nearest = airportSearch.findNearest(lat, lng, 10)
    if (nearest.length > 0) {
      airportSearch.searchQuery.value = nearest[0].city
    }
  } catch {
    // Geolocation denied or unavailable
  }
}

const handleRandomLocation = () => {
  const airport = airportSearch.getRandomAirport()
  confirmAirport.value = airport
  mapCenter.value = [airport.lat, airport.lng]
}

const handleConfirm = () => {
  if (confirmAirport.value) {
    appStore.setHomeAirport(confirmAirport.value)
    appStore.navigateTo('home')
  }
}
</script>

<style scoped>
.confirm-enter-active,
.confirm-leave-active {
  transition: all 0.3s ease;
}
.confirm-enter-active > div:last-child,
.confirm-leave-active > div:last-child {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}
.confirm-enter-from > div:last-child,
.confirm-leave-to > div:last-child {
  transform: translateY(30px);
}
</style>
