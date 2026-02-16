<template>
  <div class="min-h-screen bg-surface text-white font-sans antialiased">
    <NuxtRouteAnnouncer />

    <Transition name="view-fade" mode="out-in">
      <WelcomeScreen v-if="appStore.currentView === 'welcome'" key="welcome" />
      <AirportSetup v-else-if="appStore.currentView === 'airport-setup'" key="airport-setup" />
      <HomeMap v-else-if="appStore.currentView === 'home'" key="home" />
      <BoardingCard v-else-if="appStore.currentView === 'boarding'" key="boarding" />
      <InFlightView v-else-if="appStore.currentView === 'in-flight'" key="in-flight" />
      <LandedSummary v-else-if="appStore.currentView === 'landed'" key="landed" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from './stores/useAppStore'

const appStore = useAppStore()

onMounted(() => {
  appStore.initialize()
})
</script>

<style>
.view-fade-enter-active,
.view-fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.view-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.view-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
