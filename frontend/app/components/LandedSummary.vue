<template>
  <div class="flex items-center justify-center min-h-screen bg-surface p-6">
    <div class="w-full max-w-md text-center space-y-8">
      <!-- Status icon -->
      <div class="flex justify-center">
        <div
          class="w-20 h-20 rounded-full flex items-center justify-center"
          :class="isCompleted ? 'bg-emerald-500/10 border-2 border-emerald-500/30' : 'bg-red-500/10 border-2 border-red-500/30'"
        >
          <svg v-if="isCompleted" class="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>

      <!-- Title -->
      <div>
        <h1 class="text-3xl font-bold text-white">
          {{ isCompleted ? 'Flight Landed' : 'Flight Cancelled' }}
        </h1>
        <p class="text-gray-400 mt-2">
          {{ isCompleted ? 'Well done! Another successful focus session.' : 'Flight ended early.' }}
        </p>
      </div>

      <!-- Route summary -->
      <div class="glass-card p-6 space-y-4">
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

        <div class="border-t border-white/5 pt-4 grid grid-cols-3 gap-4">
          <div>
            <p class="label-sm">Duration</p>
            <p class="text-white font-mono font-bold mt-1">{{ flightStore.plannedDuration }}m</p>
          </div>
          <div>
            <p class="label-sm">Distance</p>
            <p class="text-white font-mono font-bold mt-1">{{ flightStore.distance }} km</p>
          </div>
          <div>
            <p class="label-sm">Mission</p>
            <p class="text-white font-medium text-sm mt-1">{{ flightStore.taskCategory }}</p>
          </div>
        </div>
      </div>

      <!-- Back button -->
      <button class="btn-primary" @click="handleBack">
        Back to Terminal
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

const isCompleted = computed(() => flightStore.status === 'landed')

const handleBack = () => {
  flightStore.reset()
  appStore.navigateTo('home')
}
</script>
