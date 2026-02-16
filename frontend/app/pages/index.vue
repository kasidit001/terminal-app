<template>
  <div class="h-full flex flex-col items-center justify-center relative">
    <!-- Main Content Area -->
    <div class="w-full max-w-4xl px-4 flex flex-col gap-8">
      
      <!-- Welcome Message -->
      <div class="text-center space-y-2 mb-8">
        <h2 class="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg">
          <span class="text-flight-500">INITIATE</span> SEQUENCE
        </h2>
        <p class="text-gray-400 font-mono text-sm md:text-base tracking-widest uppercase">
          Enter task to generate flight plan
        </p>
      </div>

      <!-- Terminal Input -->
      <TerminalInput @submit="handleCommand" />

      <!-- Flight Plan List -->
      <FlightPlanList />

    </div>
  </div>
</template>

<script setup lang="ts">
import { useTasksStore } from '../stores/useTasksStore'
import TerminalInput from '../components/TerminalInput.vue'
import FlightPlanList from '../components/FlightPlanList.vue'

definePageMeta({
  layout: 'default'
})

const tasksStore = useTasksStore()

const handleCommand = (command: string) => {
  tasksStore.addTask(command)
}
</script>