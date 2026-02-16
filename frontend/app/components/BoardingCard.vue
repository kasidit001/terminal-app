<template>
  <div class="flex items-center justify-center min-h-screen bg-surface p-4">
    <div class="w-full max-w-md">
      <!-- Ticket card -->
      <div class="glass-card overflow-hidden">
        <!-- Route map -->
        <div class="h-36">
          <FlightRouteMap
            v-if="flightStore.departureAirport && flightStore.arrivalAirport"
            :departure="flightStore.departureAirport"
            :arrival="flightStore.arrivalAirport"
          />
        </div>

        <div class="p-6 space-y-5">
          <!-- IATA codes row -->
          <div class="flex items-center justify-between">
            <div>
              <p class="iata-large">{{ flightStore.departureAirport?.iata }}</p>
              <p class="text-sm text-gray-400 mt-0.5">{{ flightStore.departureAirport?.city }}</p>
            </div>

            <div class="flex flex-col items-center px-4">
              <p class="text-flight-400 text-sm font-mono font-bold">{{ flightStore.plannedDuration }}m</p>
              <div class="flex items-center gap-2 my-1.5">
                <div class="w-8 h-px bg-flight-400/30" />
                <svg class="w-4 h-4 text-flight-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
                <div class="w-8 h-px bg-flight-400/30" />
              </div>
              <p class="text-[10px] text-gray-500 font-mono">{{ flightStore.distance }} km</p>
            </div>

            <div class="text-right">
              <p class="iata-large">{{ flightStore.arrivalAirport?.iata }}</p>
              <p class="text-sm text-gray-400 mt-0.5">{{ flightStore.arrivalAirport?.city }}</p>
            </div>
          </div>

          <!-- Ticket tear line -->
          <div class="relative">
            <div class="border-t border-dashed border-white/10" />
            <div class="absolute -left-9 -top-3 w-6 h-6 bg-surface rounded-full" />
            <div class="absolute -right-9 -top-3 w-6 h-6 bg-surface rounded-full" />
          </div>

          <!-- Details grid -->
          <div class="grid grid-cols-3 gap-4">
            <div>
              <p class="label-sm">Seat</p>
              <p class="text-white font-mono font-bold mt-1">{{ flightStore.seatNumber }}</p>
            </div>
            <div>
              <p class="label-sm">Boarding</p>
              <p class="text-flight-400 font-mono font-bold mt-1">Now</p>
            </div>
            <div>
              <p class="label-sm">Date</p>
              <p class="text-white font-mono text-sm mt-1">{{ todayFormatted }}</p>
            </div>
          </div>

          <!-- Mission -->
          <div>
            <p class="label-sm">Mission</p>
            <div class="mt-1.5">
              <span class="inline-flex items-center px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-sm text-white font-medium">
                {{ flightStore.taskCategory }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Take off button -->
      <button
        class="btn-primary mt-6"
        @click="handleTakeOff"
      >
        TAKE OFF
      </button>

      <!-- Cancel -->
      <button
        class="w-full mt-3 py-3 text-gray-500 hover:text-gray-300 transition-colors text-sm font-medium"
        @click="handleCancel"
      >
        Cancel Flight
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../stores/useAppStore'
import { useFlightStore } from '../stores/useFlightStore'

const appStore = useAppStore()
const flightStore = useFlightStore()

const todayFormatted = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
})

const handleTakeOff = async () => {
  await flightStore.startFlight()
  appStore.navigateTo('in-flight')
}

const handleCancel = () => {
  flightStore.reset()
  appStore.navigateTo('home')
}
</script>
