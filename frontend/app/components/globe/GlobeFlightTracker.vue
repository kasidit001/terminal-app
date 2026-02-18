<template>
  <div class="w-full h-full relative">
    <ClientOnly>
      <GlobeCesiumGlobe :interactive="true" :show-atmosphere="true" :initial-lat="midpoint[0]"
        :initial-lng="midpoint[1]" :initial-height="computedHeight" @ready="onGlobeReady" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import * as Cesium from 'cesium'
import type { Airport } from '../../stores/useAppStore'
import { useGreatCircle } from '../../composables/useGreatCircle'
import type { useCesium } from '../../composables/useCesium'

const props = defineProps<{
  departure: Airport
  arrival: Airport
  progressPercent: number
}>()

const { getArcPoints, getDistance } = useGreatCircle()

const midpoint = computed((): [number, number] => [
  (props.departure.lat + props.arrival.lat) / 2,
  (props.departure.lng + props.arrival.lng) / 2,
])

const computedHeight = computed(() => {
  const dist = getDistance(props.departure.lat, props.departure.lng, props.arrival.lat, props.arrival.lng)
  if (dist > 8000) return 20000000
  if (dist > 5000) return 15000000
  if (dist > 2000) return 8000000
  return 5000000
})

const arcPoints = computed(() =>
  getArcPoints(props.departure.lat, props.departure.lng, props.arrival.lat, props.arrival.lng, 200)
)

const currentPosition = computed((): [number, number] => {
  const points = arcPoints.value
  if (points.length === 0) return [0, 0] as [number, number]
  const idx = Math.min(
    Math.floor((props.progressPercent / 100) * (points.length - 1)),
    points.length - 1
  )
  return points[idx] as [number, number]
})

let cesiumRef: ReturnType<typeof useCesium> | null = null
let airplaneEntity: Cesium.Entity | null = null

const onGlobeReady = (cesium: ReturnType<typeof useCesium>) => {
  cesiumRef = cesium
  const viewer = cesium.viewer.value
  if (!viewer) return

  // Add departure and arrival markers
  cesium.addAirportMarker({ iata: props.departure.iata, lat: props.departure.lat, lng: props.departure.lng })
  cesium.addAirportMarker({ iata: props.arrival.iata, lat: props.arrival.lat, lng: props.arrival.lng })

  // Add flight arc
  cesium.addFlightArc(
    { lat: props.departure.lat, lng: props.departure.lng },
    { lat: props.arrival.lat, lng: props.arrival.lng },
  )

  // Add airplane entity
  const pos = currentPosition.value
  airplaneEntity = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(pos[1], pos[0], 50000),
    point: {
      pixelSize: 12,
      color: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.fromCssColorString('#FBBF24'),
      outlineWidth: 3,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      text: '✈',
      font: '24px sans-serif',
      fillColor: Cesium.Color.WHITE,
      pixelOffset: new Cesium.Cartesian2(0, -24),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  })
}

// Update airplane position when progress changes
watch(() => props.progressPercent, () => {
  if (!airplaneEntity || !cesiumRef?.viewer.value) return
  const pos = currentPosition.value
  airplaneEntity.position = new Cesium.ConstantPositionProperty(
    Cesium.Cartesian3.fromDegrees(pos[1], pos[0], 50000)
  )
  cesiumRef.viewer.value.scene.requestRender()
})
</script>
