<template>
  <div class="w-full h-full">
    <ClientOnly>
      <CesiumGlobe
        ref="globeRef"
        :interactive="false"
        :show-atmosphere="false"
        :initial-lat="midpoint[0]"
        :initial-lng="midpoint[1]"
        :initial-height="computedHeight"
        @ready="onGlobeReady"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Airport } from '../../stores/useAppStore'
import { useGreatCircle } from '../../composables/useGreatCircle'
import type { useCesium } from '../../composables/useCesium'

const props = defineProps<{
  departure: Airport
  arrival: Airport
}>()

const { getDistance } = useGreatCircle()

const midpoint = computed((): [number, number] => [
  (props.departure.lat + props.arrival.lat) / 2,
  (props.departure.lng + props.arrival.lng) / 2,
])

const computedHeight = computed(() => {
  const dist = getDistance(props.departure.lat, props.departure.lng, props.arrival.lat, props.arrival.lng)
  if (dist > 8000) return 20000000
  if (dist > 5000) return 15000000
  if (dist > 2000) return 8000000
  if (dist > 1000) return 5000000
  if (dist > 500) return 3000000
  return 2000000
})

const onGlobeReady = (cesium: ReturnType<typeof useCesium>) => {
  cesium.addAirportMarker({ iata: props.departure.iata, lat: props.departure.lat, lng: props.departure.lng })
  cesium.addAirportMarker({ iata: props.arrival.iata, lat: props.arrival.lat, lng: props.arrival.lng })
  cesium.addFlightArc(
    { lat: props.departure.lat, lng: props.departure.lng },
    { lat: props.arrival.lat, lng: props.arrival.lng },
  )
}
</script>
