<template>
  <div class="w-full max-w-3xl mx-auto bg-surface-800/50 backdrop-blur border border-white/10 rounded-lg p-4 shadow-2xl relative overflow-hidden group">
    <!-- Glow effect -->
    <div class="absolute -inset-1 bg-gradient-to-r from-flight-500/20 to-purple-500/20 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
    
    <div class="relative flex items-center gap-3 text-lg md:text-xl font-mono">
      <span class="text-flight-500 font-bold select-none whitespace-nowrap">
        ➜ ~
      </span>
      
      <div class="flex-grow relative">
        <input
          ref="inputRef"
          v-model="command"
          type="text"
          class="w-full bg-transparent border-none outline-none text-white placeholder-gray-600 font-mono caret-flight-500"
          placeholder="Enter flight plan..."
          spellcheck="false"
          autocomplete="off"
          @keydown.enter="handleSubmit"
        />
      </div>

      <div v-if="processing" class="text-flight-500 animate-spin">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits<{
  (e: 'submit', command: string): void
}>()

const command = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const processing = ref(false)

const handleSubmit = () => {
  if (!command.value.trim()) return
  
  processing.value = true
  emit('submit', command.value)
  
  // Simulate a brief processing delay for effect
  setTimeout(() => {
    command.value = ''
    processing.value = false
    // Keep focus
    inputRef.value?.focus()
  }, 300)
}

onMounted(() => {
  inputRef.value?.focus()
})
</script>
