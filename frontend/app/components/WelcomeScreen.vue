<template>
  <div class="relative w-full h-screen overflow-hidden">
    <!-- Background Globe -->
    <div class="absolute inset-0 opacity-40">
      <ClientOnly>
        <CesiumGlobe
          :interactive="false"
          :show-atmosphere="true"
          :initial-height="25000000"
          :auto-rotate-speed="0.5"
        />
      </ClientOnly>
    </div>

    <!-- Gradient overlay -->
    <div class="absolute inset-0 bg-gradient-to-b from-surface/80 via-surface/30 to-surface/95 z-10" />

    <!-- Content -->
    <div class="relative z-20 flex flex-col items-center justify-center h-full px-6">
      <!-- Logo icon -->
      <div class="mb-6">
        <div class="w-16 h-16 rounded-2xl bg-flight-400/10 border border-flight-400/30 flex items-center justify-center">
          <svg class="w-8 h-8 text-flight-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>
      </div>

      <!-- Title -->
      <h1 class="text-5xl font-bold tracking-tight text-white text-center">
        Welcome to
      </h1>
      <h1 class="text-5xl font-bold tracking-tight text-white text-center mt-2">
        Focus<span class="text-flight-400">Flight</span>
      </h1>

      <!-- Subtitle -->
      <p class="text-gray-400 mt-4 text-lg text-center max-w-xs">
        Your journey to deep focus starts here
      </p>

      <!-- Start button -->
      <button
        class="mt-16 w-full max-w-sm btn-primary"
        @click="appStore.navigateTo('airport-setup')"
      >
        Start Journey
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../stores/useAppStore'

const appStore = useAppStore()
</script>
