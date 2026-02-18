<template>
  <div ref="containerRef" class="w-full h-full" style="min-height: 100%" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
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
let resizeObserver: ResizeObserver | null = null

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

onMounted(async () => {
  // Wait for the DOM to be fully laid out before initializing Cesium
  await nextTick()

  cesium.initialize()

  if (cesium.ready.value) {
    emit('ready', cesium)
    if (props.autoRotateSpeed > 0) {
      removeRotation = cesium.autoRotate(props.autoRotateSpeed) || null
    }

    // Force Cesium to resize its canvas to match the container
    const viewer = cesium.viewer.value
    if (viewer) {
      viewer.resize()
      viewer.scene.requestRender()
    }

    // Set up ResizeObserver to keep canvas in sync with container
    if (containerRef.value) {
      resizeObserver = new ResizeObserver(() => {
        if (cesium.viewer.value && !cesium.viewer.value.isDestroyed()) {
          cesium.viewer.value.resize()
          cesium.viewer.value.scene.requestRender()
        }
      })
      resizeObserver.observe(containerRef.value)
    }
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (removeRotation) removeRotation()
  cesium.destroy()
})

defineExpose({ cesium })
</script>
