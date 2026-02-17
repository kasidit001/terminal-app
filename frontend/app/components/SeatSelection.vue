<template>
  <div class="min-h-screen bg-surface flex flex-col">
    <!-- Header -->
    <div class="p-6 flex items-center justify-between">
      <button @click="goBack" class="text-gray-400 hover:text-white transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h2 class="text-lg font-bold text-white">Select Your Seat</h2>
      <div class="w-6" />
    </div>

    <!-- Route info -->
    <div class="flex items-center justify-center gap-4 pb-4">
      <span class="text-flight-400 font-mono font-bold">{{ flightStore.departureAirport?.iata }}</span>
      <svg class="w-4 h-4 text-flight-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
      <span class="text-flight-400 font-mono font-bold">{{ flightStore.arrivalAirport?.iata }}</span>
    </div>

    <!-- Airplane body -->
    <div class="flex-1 flex flex-col items-center overflow-y-auto px-4 pb-32">
      <!-- Nose cone -->
      <div class="w-72 flex justify-center">
        <svg width="240" height="80" viewBox="0 0 240 80">
          <path d="M20 80 Q20 20 120 0 Q220 20 220 80" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
          <!-- Cockpit windows -->
          <rect x="100" y="35" width="16" height="10" rx="3" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>
          <rect x="124" y="35" width="16" height="10" rx="3" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>
        </svg>
      </div>

      <!-- Cabin grid -->
      <div class="w-72 border-x border-white/10 bg-white/[0.02]">
        <div
          v-for="row in 20"
          :key="row"
          class="flex items-center justify-center gap-1 py-[3px] px-3"
        >
          <!-- Left seats (A, B, C) -->
          <button
            v-for="col in leftCols"
            :key="`${row}${col}`"
            class="w-9 h-8 rounded-md text-[10px] font-mono font-bold transition-all"
            :class="getSeatClass(row, col)"
            :disabled="isTaken(row, col)"
            @click="selectSeat(row, col)"
          >
            {{ isTaken(row, col) ? '' : col }}
          </button>

          <!-- Aisle / Row number -->
          <div class="w-8 text-center text-[10px] text-gray-600 font-mono">
            {{ String(row).padStart(2, '0') }}
          </div>

          <!-- Right seats (D, E, F) -->
          <button
            v-for="col in rightCols"
            :key="`${row}${col}`"
            class="w-9 h-8 rounded-md text-[10px] font-mono font-bold transition-all"
            :class="getSeatClass(row, col)"
            :disabled="isTaken(row, col)"
            @click="selectSeat(row, col)"
          >
            {{ isTaken(row, col) ? '' : col }}
          </button>
        </div>
      </div>

      <!-- Tail -->
      <div class="w-72 flex justify-center">
        <svg width="240" height="40" viewBox="0 0 240 40">
          <path d="M20 0 Q20 40 120 40 Q220 40 220 0" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
        </svg>
      </div>
    </div>

    <!-- Legend + Confirm button (fixed bottom) -->
    <div class="fixed bottom-0 inset-x-0 z-50 bg-gradient-to-t from-surface via-surface/95 to-transparent pt-8 pb-8 px-6">
      <!-- Legend -->
      <div class="flex items-center justify-center gap-6 mb-4 text-[10px]">
        <div class="flex items-center gap-1.5">
          <div class="w-4 h-3 rounded-sm bg-white/10 border border-white/10" />
          <span class="text-gray-500">Available</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-4 h-3 rounded-sm bg-flight-400" />
          <span class="text-gray-500">Selected</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-4 h-3 rounded-sm bg-white/5" />
          <span class="text-gray-500">Taken</span>
        </div>
      </div>

      <button
        :disabled="!selectedSeatLabel"
        class="btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        @click="confirmSeat"
      >
        {{ selectedSeatLabel ? `Confirm Seat ${selectedSeatLabel}` : 'Select a Seat' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../stores/useAppStore'
import { useFlightStore } from '../stores/useFlightStore'

const appStore = useAppStore()
const flightStore = useFlightStore()

const leftCols = ['A', 'B', 'C']
const rightCols = ['D', 'E', 'F']

const selectedRow = ref<number | null>(null)
const selectedCol = ref<string | null>(null)
const takenSeats = ref<Set<string>>(new Set())

const selectedSeatLabel = computed(() => {
  if (selectedRow.value && selectedCol.value) {
    return `${String(selectedRow.value).padStart(2, '0')}${selectedCol.value}`
  }
  return ''
})

// Generate some random "taken" seats for realism
onMounted(() => {
  const taken = new Set<string>()
  const numTaken = Math.floor(Math.random() * 25) + 15
  for (let i = 0; i < numTaken; i++) {
    const row = Math.floor(Math.random() * 20) + 1
    const cols = [...leftCols, ...rightCols]
    const col = cols[Math.floor(Math.random() * cols.length)]
    taken.add(`${row}-${col}`)
  }
  takenSeats.value = taken
})

const isTaken = (row: number, col: string) => takenSeats.value.has(`${row}-${col}`)

const getSeatClass = (row: number, col: string) => {
  if (isTaken(row, col)) {
    return 'bg-white/5 border border-white/5 text-transparent cursor-not-allowed'
  }
  if (selectedRow.value === row && selectedCol.value === col) {
    return 'bg-flight-400 border border-flight-400 text-black'
  }
  return 'bg-white/10 border border-white/10 text-gray-400 hover:bg-white/15 hover:border-white/20'
}

const selectSeat = (row: number, col: string) => {
  if (isTaken(row, col)) return
  selectedRow.value = row
  selectedCol.value = col
}

const goBack = () => {
  appStore.navigateTo('boarding')
}

const confirmSeat = () => {
  if (selectedSeatLabel.value) {
    flightStore.selectSeat(selectedSeatLabel.value)
    appStore.navigateTo('activity-selection')
  }
}
</script>
