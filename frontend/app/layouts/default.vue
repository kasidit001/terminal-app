<template>
  <div class="min-h-screen bg-surface-900 text-white font-mono antialiased relative overflow-hidden flex flex-col">
    <!-- Background Grid Effect -->
    <div class="absolute inset-0 z-0 pointer-events-none opacity-20"
         style="background-image: linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px); background-size: 40px 40px;">
    </div>
    
    <!-- Scanline Effect (Optional, subtle) -->
    <div class="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-transparent via-white/5 to-transparent h-full w-full animate-scanline opacity-10"></div>

    <!-- Header -->
    <header class="relative z-10 w-full p-6 border-b border-white/10 bg-surface-900/80 backdrop-blur-md flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-flight-500/10 border border-flight-500/30 flex items-center justify-center text-flight-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>
        <div>
          <h1 class="text-xl font-bold tracking-wider text-white">FOCUS<span class="text-flight-500">FLIGHT</span></h1>
          <div class="text-[10px] text-gray-500 tracking-[0.2em] uppercase">Terminal System v2.0</div>
        </div>
      </div>
      
      <div class="hidden md:flex items-center gap-6 text-xs text-gray-400 font-mono">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          SYSTEM ONLINE
        </div>
        <div>{{ currentTime }}</div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 flex-grow container mx-auto px-4 py-8 md:px-6 lg:px-8 max-w-7xl">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="relative z-10 p-4 text-center text-[10px] text-gray-600 border-t border-white/5 bg-surface-900/50 backdrop-blur-sm">
      <p>EST. 2026 // FOCUS FLIGHT TERMINAL // OPERATIONAL</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const currentTime = ref('')
let timer: ReturnType<typeof setInterval>

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', { hour12: false }) + ' UTC'
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}
.animate-scanline {
  animation: scanline 8s linear infinite;
}
</style>
