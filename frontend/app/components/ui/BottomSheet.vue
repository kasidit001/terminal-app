<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="open" class="fixed inset-0 z-[2000]">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="$emit('update:open', false)"
        />

        <!-- Sheet -->
        <div class="absolute bottom-0 inset-x-0 max-h-[85vh] bg-surface-50 border-t border-white/10 rounded-t-3xl overflow-hidden flex flex-col">
          <!-- Drag handle -->
          <div class="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div class="w-10 h-1 bg-white/20 rounded-full" />
          </div>

          <!-- Content -->
          <div class="overflow-y-auto flex-1 px-6 pb-8">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>()
defineEmits<{ 'update:open': [value: boolean] }>()
</script>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.sheet-enter-active > div:first-child,
.sheet-leave-active > div:first-child {
  transition: opacity 0.35s ease;
}

.sheet-enter-active > div:last-child,
.sheet-leave-active > div:last-child {
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.sheet-enter-from > div:first-child,
.sheet-leave-to > div:first-child {
  opacity: 0;
}

.sheet-enter-from > div:last-child,
.sheet-leave-to > div:last-child {
  transform: translateY(100%);
}
</style>
