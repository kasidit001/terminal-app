<template>
  <div class="max-w-md w-full mx-auto backdrop-blur-2xl bg-black/40 border border-white/10 rounded-xl p-8 text-white shadow-2xl transition-all duration-500">
    <!-- Boarding State (Input) -->
    <div v-if="!flightStore.flight || flightStore.flight.status !== 'ACTIVE'" class="space-y-6">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-mono tracking-widest text-cyan-400">FLIGHT PLAN</h2>
        <div class="px-2 py-1 text-xs border border-cyan-500/30 text-cyan-300 rounded bg-cyan-900/20">
          STANDBY
        </div>
      </div>

      <form @submit.prevent="handleStartFlight" class="space-y-4">
        <div class="space-y-1">
          <label class="text-xs text-gray-400 font-mono">FLIGHT NO.</label>
          <input 
            v-model="form.flightNumber"
            type="text" 
            placeholder="TRM-001"
            class="w-full bg-black/30 border border-white/20 rounded p-3 text-lg font-mono tracking-wider focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors uppercase placeholder-gray-700"
            required
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs text-gray-400 font-mono">ORIGIN</label>
            <input 
              v-model="form.origin"
              type="text" 
              placeholder="BKK"
              class="w-full bg-black/30 border border-white/20 rounded p-3 text-lg font-mono font-bold tracking-widest focus:border-cyan-500 focus:outline-none transition-colors uppercase placeholder-gray-700"
              maxlength="3"
              required
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-gray-400 font-mono">DESTINATION</label>
            <input 
              v-model="form.destination"
              type="text" 
              placeholder="LHR"
              class="w-full bg-black/30 border border-white/20 rounded p-3 text-lg font-mono font-bold tracking-widest focus:border-cyan-500 focus:outline-none transition-colors uppercase placeholder-gray-700"
              maxlength="3"
              required
            />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs text-gray-400 font-mono">MISSION (TASK)</label>
          <input 
            v-model="form.taskCategory"
            type="text" 
            placeholder="System Update"
            class="w-full bg-black/30 border border-white/20 rounded p-3 font-mono text-sm focus:border-cyan-500 focus:outline-none transition-colors placeholder-gray-700"
            required
          />
        </div>

        <button 
          type="submit"
          class="w-full mt-6 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 text-cyan-300 py-3 rounded font-mono tracking-widest transition-all duration-300 hover:shadow-[0_0_15px_rgba(8,145,178,0.3)] group"
        >
          <span class="group-hover:animate-pulse">INITIATE LAUNCH SEQUENCE</span>
        </button>
      </form>
    </div>

    <!-- In-Flight State (Active) -->
    <div v-else class="space-y-8 relative overflow-hidden">
      <!-- Decorative scanning line -->
      <div class="absolute top-0 left-0 w-full h-1 bg-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.5)] animate-scan"></div>

      <div class="flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-mono font-bold text-white tracking-tighter">{{ flightStore.flight.origin }}</h2>
          <div class="text-xs text-gray-500 font-mono mt-1">DEPARTURE</div>
        </div>
        <div class="flex flex-col items-center pt-2">
           <svg class="w-8 h-8 text-cyan-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
           <span class="text-[10px] text-cyan-500/80 font-mono mt-1">{{ flightStore.flight.flightNumber }}</span>
        </div>
        <div class="text-right">
          <h2 class="text-4xl font-mono font-bold text-white tracking-tighter">{{ flightStore.flight.destination }}</h2>
          <div class="text-xs text-gray-500 font-mono mt-1">ARRIVAL</div>
        </div>
      </div>

      <div class="bg-black/40 rounded-lg p-4 border border-white/5">
        <div class="flex justify-between items-end mb-2">
          <span class="text-xs font-mono text-gray-400">ALTITUDE</span>
          <span class="font-mono text-cyan-300 text-lg">{{ Math.floor(flightStore.progress * 350) }} FT</span>
        </div>
        
        <!-- Hash-mark Progress Bar -->
        <div class="relative h-4 bg-gray-900/50 rounded overflow-hidden flex items-center px-1 space-x-0.5">
          <div 
            class="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-900/50 to-cyan-500/50 transition-all duration-300 ease-linear"
            :style="{ width: `${flightStore.progress}%` }"
          ></div>
          <!-- Hash marks overlay -->
          <div v-for="i in 20" :key="i" class="z-10 w-[2px] h-2 bg-black/40 flex-1"></div>
        </div>
        
        <div class="flex justify-between mt-2 font-mono text-[10px] text-gray-500">
          <span>0%</span>
          <span>STATUS: {{ flightStore.flight.status }}</span>
          <span>100%</span>
        </div>
      </div>

      <div class="text-center">
         <div class="text-xs text-gray-400 font-mono mb-2">CURRENT TASK</div>
         <div class="text-lg text-white font-mono border-l-2 border-cyan-500 pl-3 text-left">
           {{ flightStore.flight.taskCategory }}
         </div>
      </div>

      <button 
        @click="flightStore.landFlight"
        class="w-full bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 text-red-400 py-3 rounded font-mono text-sm tracking-widest transition-colors"
      >
        EMERGENCY LANDING / CANCEL
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useFlightStore } from '@/stores/useFlightStore';

const flightStore = useFlightStore();

const form = ref({
  flightNumber: '',
  origin: '',
  destination: '',
  taskCategory: ''
});

const handleStartFlight = async () => {
  if (!form.value.flightNumber || !form.value.origin || !form.value.destination) return;
  
  await flightStore.startFlight(form.value);
  
  // Optional: Reset form or keep it for next time
  // form.value = { flightNumber: '', origin: '', destination: '', taskCategory: '' };
};
</script>

<style scoped>
.animate-scan {
  animation: scan 3s linear infinite;
}

@keyframes scan {
  0% { transform: translateY(-100%); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(400px); opacity: 0; }
}
</style>
