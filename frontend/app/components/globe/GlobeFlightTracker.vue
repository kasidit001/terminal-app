<template>
  <div class="w-full h-full relative">
    <GlobeSvgGlobe :show-flight="true" :departure="[props.departure.lat, props.departure.lng]"
      :arrival="[props.arrival.lat, props.arrival.lng]" :dep-label="props.departure.iata"
      :arr-label="props.arrival.iata" :progress="props.progressPercent / 100" :auto-rotate="false" />
  </div>
</template>

<script setup lang="ts">
import type { Airport } from '../../stores/useAppStore'

const props = defineProps<{
  departure: Airport
  arrival: Airport
  progressPercent: number
}>()
</script>
