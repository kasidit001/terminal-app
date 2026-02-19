import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Airport {
  iata: string
  name: string
  city: string
  country: string
  lat: number
  lng: number
}

export type AppView =
  | 'welcome'
  | 'airport-setup'
  | 'home'
  | 'boarding'
  | 'seat-selection'
  | 'activity-selection'
  | 'in-flight'
  | 'landed'
  | 'logbook'
  | 'terminal'

export const useAppStore = defineStore('app', () => {
  const currentView = ref<AppView>('welcome')
  const homeAirport = ref<Airport | null>(null)
  const onboardingComplete = ref(false)

  const navigateTo = (view: AppView) => {
    currentView.value = view
  }

  const setHomeAirport = (airport: Airport) => {
    homeAirport.value = airport
    onboardingComplete.value = true
    localStorage.setItem('focusflight_home_airport', JSON.stringify(airport))
  }

  const initialize = () => {
    const saved = localStorage.getItem('focusflight_home_airport')
    if (saved) {
      try {
        homeAirport.value = JSON.parse(saved)
        onboardingComplete.value = true
        currentView.value = 'home'
      } catch {
        currentView.value = 'welcome'
      }
    }
  }

  return {
    currentView,
    homeAirport,
    onboardingComplete,
    navigateTo,
    setHomeAirport,
    initialize,
  }
})
