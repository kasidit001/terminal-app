<template>
  <div class="space-y-1">
    <button
      v-for="airport in airports"
      :key="airport.iata"
      class="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors text-left"
      @click="$emit('select', airport)"
    >
      <AirportBadge :iata="airport.iata" />
      <div class="flex-1 min-w-0">
        <p class="text-white font-medium text-sm truncate">{{ airport.city }}</p>
        <p class="text-gray-500 text-xs truncate">{{ airport.name }}</p>
      </div>
      <span class="text-gray-600 text-xs flex-shrink-0">{{ airport.country }}</span>
    </button>

    <p v-if="airports.length === 0" class="text-center text-gray-500 text-sm py-8">
      No airports found
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Airport } from '../stores/useAppStore'

defineProps<{
  airports: Airport[]
}>()

defineEmits<{
  select: [airport: Airport]
}>()
</script>
