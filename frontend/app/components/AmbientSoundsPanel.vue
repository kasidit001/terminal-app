<template>
  <BottomSheet :open="open" @update:open="$emit('update:open', $event)">
    <div class="space-y-6">
      <!-- Header with master toggle -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-bold text-white">Sound</h2>
          <button
            class="px-3 py-1 rounded-lg text-xs font-bold transition-all"
            :class="sounds.isEnabled.value
              ? 'bg-flight-400 text-black'
              : 'bg-white/10 text-gray-400'"
            @click="sounds.toggleMaster()"
          >
            {{ sounds.isEnabled.value ? 'ON' : 'OFF' }}
          </button>
        </div>
        <button
          class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          @click="$emit('update:open', false)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- White Noise section -->
      <div>
        <p class="label-sm mb-3">White Noise</p>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="track in whiteNoiseTracks"
            :key="track.id"
            class="glass-card p-4 text-left transition-all"
            :class="track.enabled ? 'border-flight-400/40 bg-flight-400/10' : 'hover:bg-white/10'"
            @click="sounds.toggleTrack(track.id)"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-xl">{{ soundIcons[track.id] || '🔊' }}</span>
              <span
                class="text-[10px] font-bold px-2 py-0.5 rounded"
                :class="track.enabled ? 'bg-flight-400 text-black' : 'bg-white/10 text-gray-500'"
              >{{ track.enabled ? 'ON' : 'OFF' }}</span>
            </div>
            <p class="text-sm font-medium" :class="track.enabled ? 'text-flight-400' : 'text-white'">
              {{ track.name }}
            </p>
          </button>
        </div>
      </div>

      <!-- Nature section -->
      <div>
        <p class="label-sm mb-3">Nature</p>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="track in natureTracks"
            :key="track.id"
            class="glass-card p-4 text-left transition-all"
            :class="track.enabled ? 'border-flight-400/40 bg-flight-400/10' : 'hover:bg-white/10'"
            @click="sounds.toggleTrack(track.id)"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-xl">{{ soundIcons[track.id] || '🔊' }}</span>
              <span
                class="text-[10px] font-bold px-2 py-0.5 rounded"
                :class="track.enabled ? 'bg-flight-400 text-black' : 'bg-white/10 text-gray-500'"
              >{{ track.enabled ? 'ON' : 'OFF' }}</span>
            </div>
            <p class="text-sm font-medium" :class="track.enabled ? 'text-flight-400' : 'text-white'">
              {{ track.name }}
            </p>
          </button>
        </div>
      </div>

      <!-- Focus Sound (coming soon) -->
      <div>
        <p class="label-sm mb-3">Focus Sound</p>
        <div class="glass-card p-4 text-center">
          <p class="text-gray-500 text-sm">Coming Soon</p>
        </div>
      </div>
    </div>
  </BottomSheet>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { useSounds } from '../composables/useSounds'

const props = defineProps<{
  open: boolean
  sounds: ReturnType<typeof useSounds>
}>()

defineEmits<{ 'update:open': [value: boolean] }>()

const soundIcons: Record<string, string> = {
  airplane: '✈️',
  rain: '🌧️',
  ocean: '🌊',
  forest: '🌲',
}

const whiteNoiseTracks = computed(() => props.sounds.tracks.filter(t => t.category === 'white-noise'))
const natureTracks = computed(() => props.sounds.tracks.filter(t => t.category === 'nature'))
</script>
