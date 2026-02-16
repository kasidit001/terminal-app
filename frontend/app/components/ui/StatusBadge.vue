<template>
  <span
    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider"
    :class="statusClasses"
  >
    <span class="w-1.5 h-1.5 rounded-full animate-pulse" :class="dotClass" />
    {{ status }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
}>()

const statusClasses = computed(() => {
  switch (props.status) {
    case 'ON TIME':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    case 'PAUSED':
      return 'bg-flight-400/10 text-flight-400 border border-flight-400/20'
    case 'BOARDING':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    case 'LANDED':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    default:
      return 'bg-white/5 text-gray-400 border border-white/10'
  }
})

const dotClass = computed(() => {
  switch (props.status) {
    case 'ON TIME':
      return 'bg-emerald-400'
    case 'PAUSED':
      return 'bg-flight-400'
    case 'BOARDING':
      return 'bg-blue-400'
    case 'LANDED':
      return 'bg-emerald-400'
    default:
      return 'bg-gray-400'
  }
})
</script>
