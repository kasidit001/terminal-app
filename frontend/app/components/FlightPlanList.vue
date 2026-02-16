<template>
  <div class="w-full max-w-3xl mx-auto mt-8 animate-slide-up">
    <!-- Header -->
    <div class="flex items-center justify-between text-[10px] text-gray-500 font-mono px-4 pb-2 border-b border-white/5 uppercase tracking-widest">
      <div class="flex gap-8">
        <span class="w-16">ID</span>
        <span>Flight Plan (Task)</span>
      </div>
      <div class="flex gap-8 pr-2">
        <span class="w-20 text-right">Status</span>
      </div>
    </div>

    <!-- List -->
    <div class="space-y-1 mt-2">
      <div 
        v-for="(task, index) in tasks" 
        :key="task.id"
        class="group relative flex items-center justify-between p-3 rounded bg-surface-800/20 border border-transparent hover:border-flight-500/20 hover:bg-flight-500/5 transition-all duration-300 cursor-pointer"
      >
        <div class="flex items-center gap-4 text-sm font-mono">
          <!-- ID -->
          <span class="w-16 text-gray-600 text-[10px] font-bold group-hover:text-flight-500 transition-colors">
            #{{ String(index + 1).padStart(3, '0') }}
          </span>
          
          <!-- Command -->
          <div class="flex items-center gap-3">
            <span class="text-flight-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -ml-4">></span>
            <span class="text-gray-300 group-hover:text-white transition-colors truncate max-w-[200px] md:max-w-md">
              {{ task.command }}
            </span>
          </div>
        </div>

        <!-- Status Badge -->
        <div class="flex items-center gap-2">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-flight-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-flight-500"></span>
          </span>
          <span class="text-[10px] text-flight-400 font-bold tracking-wider uppercase">
            {{ task.status }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-if="tasks.length === 0" class="text-center py-12 text-gray-700 font-mono text-xs">
      // NO ACTIVE FLIGHT PLANS DETECTED //
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTasksStore } from '../stores/useTasksStore'

const tasksStore = useTasksStore()

// We can sort or filter here if needed, but for now just show all reverse chronological
const tasks = computed(() => [...tasksStore.tasks].reverse())
</script>
