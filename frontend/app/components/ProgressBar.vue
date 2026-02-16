<template>
  <div class="space-y-2">
    <div class="flex justify-between text-[10px] font-mono text-gray-500">
      <span>PROGRESS</span>
      <span>{{ percent }}%</span>
    </div>
    <div class="relative h-6 bg-white/5 rounded-lg overflow-hidden flex items-center px-1 gap-[2px]">
      <div
        v-for="i in 40"
        :key="i"
        class="h-3 w-1 rounded-full transition-colors duration-300"
        :class="i <= (percent / 100 * 40)
          ? 'bg-flight-400 shadow-[0_0_4px_rgba(245,158,11,0.4)]'
          : 'bg-white/10'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ percent: number }>()
</script>
