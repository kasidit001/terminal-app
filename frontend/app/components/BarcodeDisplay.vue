<template>
  <canvas ref="canvasRef" class="w-full h-12" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{ text: string }>()
const canvasRef = ref<HTMLCanvasElement | null>(null)

const render = async () => {
  if (!canvasRef.value || !props.text) return
  try {
    const bwipjs = (await import('bwip-js')) as any
    bwipjs.toCanvas(canvasRef.value, {
      bcid: 'code128',
      text: props.text,
      scale: 2,
      height: 10,
      backgroundcolor: '1A1A1A',
      barcolor: 'FFFFFF',
    })
  } catch (e) {
    console.error('Barcode render error:', e)
  }
}

onMounted(render)
watch(() => props.text, render)
</script>
