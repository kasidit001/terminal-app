<template>
  <div ref="containerRef" class="w-full h-full" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useCesium, type CesiumGlobeOptions } from '../../composables/useCesium'

const props = withDefaults(defineProps<{
  interactive?: boolean
  showAtmosphere?: boolean
  initialLat?: number
  initialLng?: number
  initialHeight?: number
  autoRotateSpeed?: number
}>(), {
  interactive: true,
  showAtmosphere: true,
  initialLat: 20,
  initialLng: 0,
  initialHeight: 20000000,
  autoRotateSpeed: 0,
})

const emit = defineEmits<{
  ready: [cesium: ReturnType<typeof useCesium>]
}>()

const containerRef = ref<HTMLElement | null>(null)
let removeRotation: (() => void) | null = null

const cesium = useCesium({
  container: containerRef,
  interactive: props.interactive,
  showAtmosphere: props.showAtmosphere,
  initialView: {
    lat: props.initialLat,
    lng: props.initialLng,
    height: props.initialHeight,
  },
})

onMounted(() => {
  cesium.initialize()
  if (cesium.ready.value) {
    emit('ready', cesium)
    if (props.autoRotateSpeed > 0) {
      removeRotation = cesium.autoRotate(props.autoRotateSpeed) || null
    }
  }
})

onUnmounted(() => {
  if (removeRotation) removeRotation()
  cesium.destroy()
})

defineExpose({ cesium })
</script>
