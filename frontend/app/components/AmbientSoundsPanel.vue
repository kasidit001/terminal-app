<template>
  <BottomSheet v-model:open="isOpen">
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
          class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white"
          @click="$emit('update:open', false)"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.53 12.19l-1.61 1.59a3.006 3.006 0 000 4.24c.59.59 1.33.88 2.08.88s1.49-.29 2.08-.88c1.17-1.17 1.17-3.07 0-4.24l-1.61-1.59a.5.5 0 00-.71 0l-.23.24zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
          </svg>
        </button>
      </div>

      <!-- White Noise section -->
      <div>
        <p class="label-sm mb-3">White Noise</p>
        <div class="grid grid-cols-2 gap-3">
          <SoundCard
            v-for="track in whiteNoiseTracks"
            :key="track.id"
            :track="track"
            @toggle="sounds.toggleTrack(track.id)"
            @volume="(v: number) => sounds.setTrackVolume(track.id, v)"
          />
        </div>
      </div>

      <!-- Nature section -->
      <div>
        <p class="label-sm mb-3">Nature</p>
        <div class="grid grid-cols-2 gap-3">
          <SoundCard
            v-for="track in natureTracks"
            :key="track.id"
            :track="track"
            @toggle="sounds.toggleTrack(track.id)"
            @volume="(v: number) => sounds.setTrackVolume(track.id, v)"
          />
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
import type { useSounds, SoundTrack } from '../composables/useSounds'

const props = defineProps<{
  open: boolean
  sounds: ReturnType<typeof useSounds>
}>()

defineEmits<{ 'update:open': [value: boolean] }>()

const isOpen = computed({
  get: () => props.open,
  set: (v) => { /* handled by parent */ }
})

const whiteNoiseTracks = computed(() => props.sounds.tracks.filter(t => t.category === 'white-noise'))
const natureTracks = computed(() => props.sounds.tracks.filter(t => t.category === 'nature'))
</script>

<!-- Inline SoundCard sub-component -->
<script lang="ts">
import { defineComponent, h } from 'vue'
import type { PropType } from 'vue'

const SoundCard = defineComponent({
  name: 'SoundCard',
  props: {
    track: { type: Object as PropType<SoundTrack>, required: true },
  },
  emits: ['toggle', 'volume'],
  setup(props, { emit }) {
    const icons: Record<string, string> = {
      airplane: '✈️',
      rain: '🌧️',
      ocean: '🌊',
      forest: '🌲',
    }
    return () => h('button', {
      class: [
        'glass-card p-4 text-left transition-all',
        props.track.enabled ? 'border-flight-400/40 bg-flight-400/10' : 'hover:bg-white/10'
      ],
      onClick: () => emit('toggle'),
    }, [
      h('div', { class: 'flex items-center justify-between mb-2' }, [
        h('span', { class: 'text-xl' }, icons[props.track.id] || '🔊'),
        h('span', {
          class: [
            'text-[10px] font-bold px-2 py-0.5 rounded',
            props.track.enabled ? 'bg-flight-400 text-black' : 'bg-white/10 text-gray-500'
          ],
        }, props.track.enabled ? 'ON' : 'OFF'),
      ]),
      h('p', {
        class: ['text-sm font-medium', props.track.enabled ? 'text-flight-400' : 'text-white']
      }, props.track.name),
    ])
  }
})
export { SoundCard }
</script>
