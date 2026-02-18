<template>
  <div class="relative w-full h-screen overflow-hidden bg-[#060d1a]">
    <!-- Background SVG Globe -->
    <div class="absolute inset-0 flex items-center justify-center scale-110">
      <GlobeSvgGlobe :show-flight="false" :auto-rotate="true" />
    </div>

    <!-- Gradient overlay -->
    <div class="absolute inset-0 bg-gradient-to-b from-[#060d1a]/80 via-[#060d1a]/30 to-[#060d1a]/95 z-10" />

    <!-- Content -->
    <div class="relative z-20 flex flex-col items-center justify-between h-full px-6 py-12">

      <!-- Top: Logo + Title -->
      <div class="flex flex-col items-center text-center">
        <!-- Logo icon -->
        <div class="mb-5">
          <div
            class="w-[72px] h-[72px] rounded-2xl bg-flight-400/10 border border-flight-400/30 flex items-center justify-center shadow-lg shadow-flight-400/10">
            <svg class="w-9 h-9 text-flight-400" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          </div>
        </div>

        <h1 class="text-5xl font-bold tracking-tight text-white text-center leading-tight">
          Focus<span class="text-flight-400">Flight</span>
        </h1>

        <p class="text-gray-400 mt-3 text-base text-center max-w-xs leading-relaxed">
          Transform your focus sessions into immersive aviation journeys across the globe
        </p>
      </div>

      <!-- Middle: Feature pills -->
      <div class="w-full max-w-sm space-y-3">
        <div v-for="feature in features" :key="feature.label"
          class="flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" :class="feature.bg">
            <span class="text-xl">{{ feature.icon }}</span>
          </div>
          <div>
            <p class="text-white font-semibold text-sm">{{ feature.label }}</p>
            <p class="text-gray-500 text-xs mt-0.5 leading-relaxed">{{ feature.desc }}</p>
          </div>
        </div>
      </div>

      <!-- Bottom: CTA -->
      <div class="w-full max-w-sm space-y-3">
        <button class="w-full btn-primary" @click="appStore.navigateTo('airport-setup')">
          Start Journey
        </button>
        <p class="text-center text-gray-600 text-xs">
          No account needed · Works offline · Free forever
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../stores/useAppStore'

const appStore = useAppStore()

const features = [
  {
    icon: '🧠',
    label: 'Deep Focus Mode',
    desc: 'Aviation-themed Pomodoro sessions that train concentration and patience',
    bg: 'bg-blue-500/10',
  },
  {
    icon: '🌍',
    label: 'Fly the World',
    desc: 'Real airports, real routes — visualized on a beautiful interactive globe',
    bg: 'bg-flight-400/10',
  },
  {
    icon: '🧘',
    label: 'Mindful Productivity',
    desc: 'Ambient sounds and calm visuals reduce stress while you work',
    bg: 'bg-emerald-500/10',
  },
]
</script>
