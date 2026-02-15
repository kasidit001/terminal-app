<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white font-sans antialiased selection:bg-cyan-500/30">
    <NuxtRouteAnnouncer />
    
    <!-- Main Content Area -->
    <main class="flex items-center justify-center min-h-screen p-4 relative overflow-hidden">
      <!-- Background Elements -->
      <div class="absolute inset-0 z-0 pointer-events-none">
        <div class="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl animate-blob"></div>
        <div class="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <!-- Interactive UI -->
      <div class="relative z-10 w-full max-w-md pointer-events-auto">
        <FlightTicket />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// Nuxt auto-imports components
</script>

<style>
/* Global Styles or Animation Utilities */
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}
</style>
