<template>
  <div class="w-full max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden transition-all duration-500">
    <!-- Boarding State -->
    <div v-if="flightStore.status === 'draft'" class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div class="flex flex-col">
          <label class="text-xs text-gray-400 font-mono mb-1">DEPARTURE</label>
          <input 
            v-model="form.departureCode"
            type="text" 
            placeholder="BKK"
            class="bg-transparent text-2xl font-bold font-mono text-white placeholder-gray-600 focus:outline-none uppercase w-20"
            maxlength="3"
          />
        </div>
        <div class="text-gray-500">
          <svg class="w-6 h-6 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
        </div>
        <div class="flex flex-col text-right">
          <label class="text-xs text-gray-400 font-mono mb-1">ARRIVAL</label>
          <input 
            v-model="form.arrivalCode"
            type="text" 
            placeholder="LHR"
            class="bg-transparent text-2xl font-bold font-mono text-white placeholder-gray-600 focus:outline-none uppercase w-20 text-right"
            maxlength="3"
          />
        </div>
      </div>

      <!-- Body -->
      <div class="space-y-4">
        <div>
          <label class="block text-xs text-gray-400 font-mono mb-2">FLIGHT MISSION (TASK)</label>
          <select 
            v-model="form.taskCategory"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 appearance-none transition-colors"
          >
            <option value="" disabled>Select Mission Type</option>
            <option value="Coding">Coding</option>
            <option value="Writing">Writing</option>
            <option value="Design">Design</option>
            <option value="Research">Research</option>
            <option value="Meeting">Meeting</option>
          </select>
        </div>

        <div>
           <label class="block text-xs text-gray-400 font-mono mb-2">DURATION (MIN)</label>
           <input 
            v-model.number="form.plannedDuration"
            type="number"
            min="1"
            max="180"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-cyan-500/50 transition-colors"
           />
        </div>
      </div>

      <!-- Footer -->
      <button 
        @click="handleTakeOff"
        :disabled="!isValid"
        class="w-full bg-cyan-600/90 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-900/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <span class="group-hover:tracking-widest transition-all duration-300">TAKE OFF</span>
      </button>
    </div>

    <!-- In-Flight State -->
    <div v-else class="space-y-8 py-4">
      <div class="text-center space-y-2">
        <div class="flex justify-center space-x-8 text-sm font-mono text-gray-400">
           <span>{{ form.departureCode }}</span>
           <span class="text-cyan-400 animate-pulse">✈</span>
           <span>{{ form.arrivalCode }}</span>
        </div>
        <h2 class="text-6xl font-mono font-bold tracking-tighter tabular-nums">
          {{ formattedTime }}
        </h2>
        <p class="text-cyan-400/80 text-sm font-medium tracking-wide uppercase">{{ form.taskCategory }}</p>
      </div>

      <!-- Hash-mark Progress Bar -->
      <div class="space-y-2">
        <div class="flex justify-between text-[10px] font-mono text-gray-500">
          <span>ALTITUDE</span>
          <span>{{ progressPercent }}%</span>
        </div>
        <div class="relative h-6 bg-gray-900/50 rounded overflow-hidden flex items-center px-1 space-x-[2px]">
            <!-- Hash Marks -->
            <div 
              v-for="i in 40" 
              :key="i"
              class="h-3 w-1 rounded-full transition-colors duration-300"
              :class="i <= (progressPercent / 100 * 40) ? 'bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)]' : 'bg-white/10'"
            ></div>
        </div>
      </div>

      <button 
        @click="flightStore.landFlight"
        class="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-3 rounded-xl font-mono text-sm tracking-widest transition-colors"
      >
        EMERGENCY LANDING
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFlightStore } from '../stores/useFlightStore';

const flightStore = useFlightStore();

const form = ref({
  departureCode: 'BKK',
  arrivalCode: 'LHR',
  taskCategory: 'Coding',
  plannedDuration: 25
});

const isValid = computed(() => {
  return form.value.departureCode && 
         form.value.arrivalCode && 
         form.value.taskCategory && 
         form.value.plannedDuration > 0;
});

const handleTakeOff = () => {
  flightStore.startFlight({
    departureCode: form.value.departureCode,
    arrivalCode: form.value.arrivalCode,
    taskCategory: form.value.taskCategory,
    plannedDuration: form.value.plannedDuration
  });
};

const formattedTime = computed(() => {
  const m = Math.floor(flightStore.timeRemaining / 60);
  const s = flightStore.timeRemaining % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const progressPercent = computed(() => {
  const totalSeconds = form.value.plannedDuration * 60;
  if (totalSeconds === 0) return 0;
  const elapsed = totalSeconds - flightStore.timeRemaining;
  return Math.min(Math.round((elapsed / totalSeconds) * 100), 100);
});
</script>