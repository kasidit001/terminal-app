<template>
  <div class="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
    <!-- Header -->
    <div class="mb-2">
      <p class="label-sm text-center">Seat: {{ flightStore.seatNumber }}</p>
    </div>
    <h1 class="text-2xl font-bold text-white text-center mb-2">
      What do you want to focus on?
    </h1>
    <p class="text-gray-500 text-sm text-center mb-10">
      Choose your mission for this flight
    </p>

    <!-- Activity cards -->
    <div class="grid grid-cols-2 gap-3 w-full max-w-sm mb-10">
      <button
        v-for="activity in activities"
        :key="activity.id"
        class="glass-card p-5 flex flex-col items-center gap-3 transition-all"
        :class="selected === activity.id
          ? 'border-flight-400/50 bg-flight-400/10'
          : 'hover:bg-white/10'"
        @click="selected = activity.id"
      >
        <span class="text-3xl">{{ activity.emoji }}</span>
        <span class="text-sm font-medium" :class="selected === activity.id ? 'text-flight-400' : 'text-white'">
          {{ activity.label }}
        </span>
      </button>
    </div>

    <!-- Custom input -->
    <div v-if="selected === 'custom'" class="w-full max-w-sm mb-8">
      <input
        v-model="customName"
        type="text"
        placeholder="What are you working on?"
        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-flight-400/50 transition-colors text-sm text-center"
        autofocus
      />
    </div>

    <!-- Start button -->
    <div class="w-full max-w-sm space-y-3">
      <button
        :disabled="!canStart"
        class="btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        @click="handleStart"
      >
        Start Flight
      </button>
      <button
        class="w-full py-3 text-gray-500 hover:text-gray-300 transition-colors text-sm font-medium"
        @click="goBack"
      >
        Back
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/useAppStore'
import { useFlightStore } from '../stores/useFlightStore'

const appStore = useAppStore()
const flightStore = useFlightStore()

const activities = [
  { id: 'read', emoji: '📚', label: 'Read' },
  { id: 'exercise', emoji: '🏃', label: 'Exercise' },
  { id: 'meditate', emoji: '🧘', label: 'Meditate' },
  { id: 'code', emoji: '💻', label: 'Code' },
  { id: 'write', emoji: '✍️', label: 'Write' },
  { id: 'custom', emoji: '➕', label: 'Custom' },
]

const selected = ref('')
const customName = ref('')

const canStart = computed(() => {
  if (!selected.value) return false
  if (selected.value === 'custom' && !customName.value.trim()) return false
  return true
})

const handleStart = async () => {
  if (!canStart.value) return
  const activityLabel = selected.value === 'custom'
    ? customName.value.trim()
    : activities.find(a => a.id === selected.value)?.label || selected.value
  flightStore.selectActivity(activityLabel, selected.value === 'custom' ? customName.value.trim() : undefined)
  await flightStore.startFlight()
  appStore.navigateTo('in-flight')
}

const goBack = () => {
  appStore.navigateTo('seat-selection')
}
</script>
