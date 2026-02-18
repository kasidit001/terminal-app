<template>
  <div ref="containerRef" class="w-full h-full" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useCesium } from '../../composables/useCesium'

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

const forceResize = () => {
  const viewer = cesium.viewer.value
  if (!viewer || viewer.isDestroyed()) return
  // Force Cesium to re-read the container dimensions
  viewer.resize()
  viewer.scene.requestRender()
}

onMounted(async () => {
  // Wait two ticks to ensure the container has its final layout dimensions
  await nextTick()
  await nextTick()

  cesium.initialize()

  if (cesium.ready.value) {
    emit('ready', cesium)

    // Force resize immediately after init
    forceResize()

    if (props.autoRotateSpeed > 0) {
      removeRotation = cesium.autoRotate(props.autoRotateSpeed) || null
    }

    // Watch for container size changes
    if (containerRef.value) {
      resizeObserver = new ResizeObserver(() => {
        forceResize()
      })
      resizeObserver.observe(containerRef.value)
    }

    // Also force resize after a short delay to catch any late layout changes
    setTimeout(forceResize, 100)
    setTimeout(forceResize, 500)
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

<style scoped>
/* Ensure the Cesium canvas fills the container */
:deep(.cesium-widget),
:deep(.cesium-widget canvas) {
  width: 100% !important;
  height: 100% !important;
}
</style>
