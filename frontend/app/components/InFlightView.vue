<template>
  <div class="relative w-full h-screen overflow-hidden bg-surface">
    <!-- Full-screen Globe Tracker -->
    <div class="absolute inset-0">
      <ClientOnly>
        <GlobeFlightTracker v-if="flightStore.departureAirport && flightStore.arrivalAirport"
          :departure="flightStore.departureAirport" :arrival="flightStore.arrivalAirport"
          :progress-percent="flightStore.progressPercent" />
      </ClientOnly>
    </div>

    <!-- Top controls -->
    <div class="absolute top-0 inset-x-0 z-50 p-4 flex items-center justify-between">
      <!-- Close button -->
      <button
        class="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-all"
        @click="handleEmergencyLand">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div class="flex items-center gap-2">
        <!-- Sound toggle -->
        <button
          class="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all"
          :class="sounds.isEnabled.value ? 'text-flight-400' : 'text-white'" @click="showSoundPanel = true">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="sounds.isEnabled.value" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        </button>

        <!-- Status badge -->
        <div class="flex items-center gap-2">
          <div class="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
            <span class="text-xs font-mono font-bold"
              :class="flightStore.status === 'paused' ? 'text-flight-400' : 'text-emerald-400'">
              {{ flightStore.status === 'paused' ? 'PAUSED' : 'IN FLIGHT' }}
            </span>
          </div>
          <div v-if="flightStore.focusActivity"
            class="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
            <span class="text-xs font-mono text-gray-300">{{ flightStore.focusActivity }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Mini boarding pass overlay (left side) -->
    <Transition name="slide-up">
      <div v-if="showMiniCard" class="absolute left-4 bottom-56 z-40 w-52">
        <div class="glass-card p-3 space-y-2 bg-black/60">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-white font-mono font-bold text-xs">{{ flightStore.departureAirport?.iata }}</span>
              <svg class="w-3 h-3 text-flight-400" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
              <span class="text-white font-mono font-bold text-xs">{{ flightStore.arrivalAirport?.iata }}</span>
            </div>
            <button class="text-gray-500 hover:text-white" @click="showMiniCard = false">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="flex items-center justify-between text-[10px]">
            <span class="text-gray-400">{{ flightStore.focusActivity || 'Focus' }}</span>
            <span class="text-gray-400">{{ flightStore.seatNumber }}</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Bottom overlay -->
    <div
      class="absolute bottom-0 inset-x-0 z-50 bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-20 pb-8 px-6">
      <!-- Focus tip (rotates every 90s) -->
      <Transition name="tip-fade">
        <div v-if="showTip && flightStore.status === 'in-flight'" :key="currentTipIndex"
          class="mb-4 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-start gap-3">
          <span class="text-base flex-shrink-0">✨</span>
          <p class="text-gray-300 text-xs leading-relaxed">{{ focusTips[currentTipIndex] }}</p>
        </div>
      </Transition>

      <!-- Time & Distance -->
      <div class="flex items-end justify-between mb-4">
        <div>
          <p class="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Time Remaining</p>
          <p class="text-3xl font-mono font-bold text-white tabular-nums">
            {{ flightStore.timeRemainingMinutes }}
            <span class="text-sm text-gray-400">min</span>
          </p>
        </div>
        <div class="text-right">
          <p class="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Distance Remaining</p>
          <p class="text-3xl font-mono font-bold text-white tabular-nums">
            {{ flightStore.distanceRemaining.toLocaleString() }}
            <span class="text-sm text-gray-400">km</span>
          </p>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="w-full h-1.5 bg-white/10 rounded-full mb-6 overflow-hidden">
        <div class="h-full bg-flight-400 rounded-full transition-all duration-1000 ease-linear"
          :style="{ width: `${flightStore.progressPercent}%` }" />
      </div>

      <!-- Controls row -->
      <div class="flex items-center justify-between">
        <!-- Emergency land -->
        <button
          class="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
          @click="handleEmergencyLand">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Pause / Resume (center) -->
        <button
          class="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:bg-gray-100 transition-all active:scale-95"
          @click="togglePause">
          <svg v-if="flightStore.status === 'in-flight'" class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
          <svg v-else class="w-6 h-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        <!-- Speed control -->
        <button
          class="h-12 px-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-mono font-bold text-sm hover:bg-white/10 transition-all"
          @click="cycleSpeed">
          {{ flightStore.speedMultiplier }}x
        </button>
      </div>
    </div>

    <!-- Ambient Sounds Panel -->
    <AmbientSoundsPanel :open="showSoundPanel" :sounds="sounds" @update:open="showSoundPanel = $event" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from '../stores/useAppStore'
import { useFlightStore } from '../stores/useFlightStore'
import { useSounds } from '../composables/useSounds'

const appStore = useAppStore()
const flightStore = useFlightStore()
const sounds = useSounds()

const showSoundPanel = ref(false)
const showMiniCard = ref(true)

// Rotating focus tips
const focusTips = [
  'Stay in the zone. Every minute of deep focus compounds over time.',
  'Pilots maintain altitude by making small, consistent corrections. So does focus.',
  'You\'re cruising at 35,000 feet. The world below can wait.',
  'Deep work is a skill. The more you practice, the higher you fly.',
  'Turbulence is temporary. Stay the course — you\'re almost there.',
  'The best focus sessions feel effortless. Trust the process.',
  'Breathe. Adjust. Continue. That\'s how pilots — and focused people — succeed.',
]
const currentTipIndex = ref(0)
const showTip = ref(false)
let tipInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  // Show first tip after 30s, then rotate every 90s
  const initialDelay = setTimeout(() => {
    showTip.value = true
    tipInterval = setInterval(() => {
      showTip.value = false
      setTimeout(() => {
        currentTipIndex.value = (currentTipIndex.value + 1) % focusTips.length
        showTip.value = true
      }, 500)
    }, 90000)
  }, 30000)

  onUnmounted(() => clearTimeout(initialDelay))
})

const speeds = [1, 2, 5]

const togglePause = () => {
  if (flightStore.status === 'in-flight') {
    flightStore.pauseFlight()
  } else {
    flightStore.resumeFlight()
  }
}

const cycleSpeed = () => {
  const currentIndex = speeds.indexOf(flightStore.speedMultiplier)
  const nextIndex = (currentIndex + 1) % speeds.length
  flightStore.setSpeed(speeds[nextIndex]!)
}

const handleEmergencyLand = async () => {
  sounds.stopAll()
  await flightStore.cancelFlight()
  appStore.navigateTo('landed')
}

// Auto-navigate to landed when timer reaches 0
watch(() => flightStore.status, (newStatus) => {
  if (newStatus === 'landed') {
    sounds.stopAll()
    appStore.navigateTo('landed')
  }
})

onUnmounted(() => {
  sounds.stopAll()
  if (tipInterval) clearInterval(tipInterval)
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.tip-fade-enter-active,
.tip-fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.tip-fade-enter-from,
.tip-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
