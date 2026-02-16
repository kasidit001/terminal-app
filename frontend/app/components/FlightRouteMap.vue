<template>
  <div class="w-full h-full rounded-xl overflow-hidden">
    <ClientOnly>
      <LMap
        :zoom="computedZoom"
        :center="midpoint"
        :zoom-control="false"
        :dragging="false"
        :scroll-wheel-zoom="false"
        :double-click-zoom="false"
        :touch-zoom="false"
        :keyboard="false"
        :attribution-control="false"
        style="width: 100%; height: 100%"
      >
        <LTileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <LPolyline
          :lat-lngs="arcPoints"
          :color="'#FBBF24'"
          :weight="2"
          :opacity="0.6"
          :dash-array="'6, 8'"
        />
        <LCircleMarker
          :lat-lng="[departure.lat, departure.lng]"
          :radius="4"
          :color="'#FBBF24'"
          :fill-color="'#FBBF24'"
          :fill-opacity="1"
          :weight="2"
        />
        <LCircleMarker
          :lat-lng="[arrival.lat, arrival.lng]"
          :radius="4"
          :color="'#FBBF24'"
          :fill-color="'#FBBF24'"
          :fill-opacity="1"
          :weight="2"
        />
      </LMap>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Airport } from '../stores/useAppStore'
import { useGreatCircle } from '../composables/useGreatCircle'

const props = defineProps<{
  departure: Airport
  arrival: Airport
}>()

const { getArcPoints, getDistance } = useGreatCircle()

const arcPoints = computed(() =>
  getArcPoints(props.departure.lat, props.departure.lng, props.arrival.lat, props.arrival.lng, 80)
)

const midpoint = computed((): [number, number] => [
  (props.departure.lat + props.arrival.lat) / 2,
  (props.departure.lng + props.arrival.lng) / 2,
])

const computedZoom = computed(() => {
  const dist = getDistance(props.departure.lat, props.departure.lng, props.arrival.lat, props.arrival.lng)
  if (dist > 8000) return 1
  if (dist > 5000) return 2
  if (dist > 2000) return 3
  if (dist > 1000) return 4
  if (dist > 500) return 5
  return 6
})
</script>
