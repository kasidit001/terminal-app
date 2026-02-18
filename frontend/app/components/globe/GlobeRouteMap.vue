<template>
  <div class="w-full h-full">
    <GlobeSvgGlobe :show-flight="true" :departure="[props.departure.lat, props.departure.lng]"
      :arrival="[props.arrival.lat, props.arrival.lng]" :dep-label="props.departure.iata"
      :arr-label="props.arrival.iata" :progress="1" :auto-rotate="false" />
  </div>
</template>

<script setup lang="ts">
import type { Airport } from '../../stores/useAppStore'

const props = defineProps<{
  departure: Airport
  arrival: Airport
}>()
</script>
