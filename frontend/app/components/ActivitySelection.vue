<template>
  <div class="h-full bg-surface flex flex-col items-center justify-center px-6 py-10 overflow-y-auto">
    <!-- Header -->
    <div class="mb-1 text-center">
      <p class="label-sm">
        <span class="text-flight-400 font-mono font-bold">{{ flightStore.departureAirport?.iata }}</span>
        <span class="mx-2 text-gray-600">→</span>
        <span class="text-flight-400 font-mono font-bold">{{ flightStore.arrivalAirport?.iata }}</span>
        <span class="ml-3 text-gray-500">· Seat {{ flightStore.seatNumber }}</span>
      </p>
    </div>
    <h1 class="text-2xl font-bold text-white text-center mb-1 mt-3">
      What's your mission?
    </h1>
    <p class="text-gray-500 text-sm text-center mb-8 max-w-xs">
      Set your intention before takeoff — focused pilots fly further
    </p>

    <!-- Activity cards -->
    <div class="grid grid-cols-3 gap-3 w-full max-w-sm mb-8">
      <button v-for="activity in activities" :key="activity.id"
        class="glass-card p-4 flex flex-col items-center gap-2 transition-all" :class="selected === activity.id
          ? 'border-flight-400/50 bg-flight-400/10 scale-[1.03]'
          : 'hover:bg-white/10 hover:scale-[1.02]'" @click="selected = activity.id">
        <span class="text-2xl">{{ activity.emoji }}</span>
        <span class="text-xs font-medium leading-tight text-center"
          :class="selected === activity.id ? 'text-flight-400' : 'text-white'">
          {{ activity.label }}
        </span>
      </button>
    </div>

    <!-- Custom input -->
    <div v-if="selected === 'custom'" class="w-full max-w-sm mb-6">
      <input v-model="customName" type="text" placeholder="What are you working on?"
        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-flight-400/50 transition-colors text-sm text-center"
        autofocus />
    </div>

    <!-- Focus tip -->
    <div
      class="w-full max-w-sm mb-8 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
      <span class="text-lg flex-shrink-0 mt-0.5">💡</span>
      <p class="text-gray-400 text-xs leading-relaxed">
        <span class="text-gray-300 font-medium">Tip: </span>{{ currentTip }}
      </p>
    </div>

    <!-- Start button -->
    <div class="w-full max-w-sm space-y-3">
      <button :disabled="!canStart"
        class="btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        @click="handleStart">
        Start Flight
      </button>
      <button class="w-full py-3 text-gray-500 hover:text-gray-300 transition-colors text-sm font-medium"
        @click="goBack">
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
  { id: 'study', emoji: '🎓', label: 'Study' },
  { id: 'code', emoji: '💻', label: 'Code' },
  { id: 'write', emoji: '✍️', label: 'Write' },
  { id: 'create', emoji: '🎨', label: 'Create' },
  { id: 'exercise', emoji: '🏃', label: 'Exercise' },
  { id: 'meditate', emoji: '🧘', label: 'Meditate' },
  { id: 'learn', emoji: '🌱', label: 'Learn' },
  { id: 'custom', emoji: '➕', label: 'Custom' },
]

const tips = [
  'Put your phone on Do Not Disturb before takeoff for maximum altitude.',
  'Pilots use checklists — try writing down your top 3 tasks before starting.',
  'The first 5 minutes are the hardest. Once airborne, focus becomes effortless.',
  'Spatial awareness improves with practice. So does concentration.',
  'Flight simulation research shows that focused tasks reduce cortisol levels.',
  'Treat each session like a real flight — no turning back once airborne.',
  'The best pilots stay calm under pressure. Breathe before you begin.',
]

const currentTip = computed(() => tips[Math.floor(Math.random() * tips.length)])

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
