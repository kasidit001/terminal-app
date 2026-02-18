<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />

    <!-- Desktop: full-screen globe background -->
    <div class="desktop-globe-bg" aria-hidden="true">
      <GlobeSvgGlobe :show-flight="false" :auto-rotate="true" />
    </div>

    <!-- App viewport: full-screen on mobile, centered card on desktop -->
    <div class="app-viewport">
      <Transition name="view-fade" mode="out-in">
        <WelcomeScreen v-if="appStore.currentView === 'welcome'" key="welcome" />
        <AirportSetup v-else-if="appStore.currentView === 'airport-setup'" key="airport-setup" />
        <HomeMap v-else-if="appStore.currentView === 'home'" key="home" />
        <BoardingCard v-else-if="appStore.currentView === 'boarding'" key="boarding" />
        <SeatSelection v-else-if="appStore.currentView === 'seat-selection'" key="seat-selection" />
        <ActivitySelection v-else-if="appStore.currentView === 'activity-selection'" key="activity-selection" />
        <InFlightView v-else-if="appStore.currentView === 'in-flight'" key="in-flight" />
        <LandedSummary v-else-if="appStore.currentView === 'landed'" key="landed" />
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from './stores/useAppStore'
import { useStatsStore } from './stores/useStatsStore'

const appStore = useAppStore()
const statsStore = useStatsStore()

onMounted(() => {
  appStore.initialize()
  statsStore.initialize()
})
</script>

<style>
/* ─── App shell ──────────────────────────────────────────────────────────── */
.app-shell {
  position: relative;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  background: #060d1a;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Desktop globe background — hidden on mobile */
.desktop-globe-bg {
  display: none;
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

/* App viewport — full-screen on mobile */
.app-viewport {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #060d1a;
}

/* ─── Tablet & Desktop (≥ 640px) ─────────────────────────────────────────── */
@media (min-width: 640px) {
  .app-shell {
    background: #020810;
  }

  /* Show the globe as a full-screen ambient background */
  .desktop-globe-bg {
    display: block;
  }

  /* Dim overlay so the card pops */
  .desktop-globe-bg::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(2, 8, 16, 0.55);
  }

  /* Center the app in a phone-sized card */
  .app-viewport {
    width: 420px;
    height: min(860px, 94vh);
    height: min(860px, 94dvh);
    border-radius: 32px;
    overflow: hidden;
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.08),
      0 40px 100px rgba(0, 0, 0, 0.8),
      0 0 0 0.5px rgba(59, 130, 246, 0.15) inset,
      0 0 160px rgba(59, 130, 246, 0.06);
    background: #060d1a;
  }
}

/* ─── Large desktop (≥ 1024px) — slightly taller card ───────────────────── */
@media (min-width: 1024px) {
  .app-viewport {
    width: 440px;
    height: min(880px, 94vh);
    height: min(880px, 94dvh);
  }
}

/* ─── View transitions ───────────────────────────────────────────────────── */
.view-fade-enter-active,
.view-fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
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
