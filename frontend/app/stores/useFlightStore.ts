import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Airport } from './useAppStore'

export type FlightStatus = 'idle' | 'boarding' | 'in-flight' | 'paused' | 'landed' | 'cancelled'

export const useFlightStore = defineStore('flight', () => {
  const status = ref<FlightStatus>('idle')
  const currentFlightId = ref<string | null>(null)
  const departureAirport = ref<Airport | null>(null)
  const arrivalAirport = ref<Airport | null>(null)
  const plannedDuration = ref(25)
  const seatNumber = ref('')
  const distance = ref(0)
  const focusActivity = ref('')
  const customActivityName = ref('')
  const boardingStatus = ref<'pending' | 'checked-in' | 'boarding'>('pending')
  const speedMultiplier = ref(1)

  const timeRemaining = ref(0)
  const totalSeconds = ref(0)
  let timerInterval: ReturnType<typeof setInterval> | null = null

  const progressPercent = computed(() => {
    if (totalSeconds.value === 0) return 0
    const elapsed = totalSeconds.value - timeRemaining.value
    return Math.min(Math.round((elapsed / totalSeconds.value) * 100), 100)
  })

  const formattedTime = computed(() => {
    const m = Math.floor(timeRemaining.value / 60)
    const s = timeRemaining.value % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  })

  const distanceRemaining = computed(() => {
    if (distance.value === 0) return 0
    return Math.round(distance.value * (1 - progressPercent.value / 100))
  })

  const timeRemainingMinutes = computed(() => {
    return Math.ceil(timeRemaining.value / 60)
  })

  const isActive = computed(() =>
    status.value === 'in-flight' || status.value === 'paused'
  )

  const elapsedSeconds = computed(() =>
    totalSeconds.value - timeRemaining.value
  )

  const bookFlight = (params: {
    departure: Airport
    arrival: Airport
    duration: number
    dist: number
  }) => {
    departureAirport.value = params.departure
    arrivalAirport.value = params.arrival
    plannedDuration.value = params.duration
    distance.value = Math.round(params.dist)
    seatNumber.value = ''
    focusActivity.value = ''
    customActivityName.value = ''
    boardingStatus.value = 'pending'
    status.value = 'boarding'
  }

  const selectSeat = (seat: string) => {
    seatNumber.value = seat
  }

  const selectActivity = (activity: string, customName?: string) => {
    focusActivity.value = activity
    if (customName) customActivityName.value = customName
  }

  const checkIn = () => {
    boardingStatus.value = 'checked-in'
  }

  const startFlight = async () => {
    boardingStatus.value = 'boarding'
    try {
      const response = await fetch('http://localhost:4000/api/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departureCode: departureAirport.value?.iata,
          arrivalCode: arrivalAirport.value?.iata,
          taskCategory: focusActivity.value || 'Focus',
          plannedDuration: plannedDuration.value,
          seatNumber: seatNumber.value,
          distance: distance.value,
          focusActivity: focusActivity.value,
        }),
      })
      if (!response.ok) throw new Error('Failed to start flight')
      const data = await response.json()

      currentFlightId.value = data.id
      totalSeconds.value = plannedDuration.value * 60
      timeRemaining.value = totalSeconds.value
      status.value = 'in-flight'
      startTimer()
    } catch (error) {
      console.error('Error starting flight:', error)
      // Start timer locally even if API fails
      totalSeconds.value = plannedDuration.value * 60
      timeRemaining.value = totalSeconds.value
      status.value = 'in-flight'
      startTimer()
    }
  }

  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      if (timeRemaining.value > 0) {
        timeRemaining.value--
      } else {
        landFlight()
      }
    }, 1000 / speedMultiplier.value)
  }

  const pauseFlight = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    status.value = 'paused'
  }

  const resumeFlight = () => {
    status.value = 'in-flight'
    startTimer()
  }

  const setSpeed = (speed: number) => {
    speedMultiplier.value = speed
    if (status.value === 'in-flight') {
      startTimer()
    }
  }

  const landFlight = async () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    if (currentFlightId.value) {
      try {
        await fetch(`http://localhost:4000/api/flights/${currentFlightId.value}/land`, {
          method: 'PATCH',
        })
      } catch (error) {
        console.error('Error landing flight:', error)
      }
    }
    status.value = 'landed'
  }

  const cancelFlight = async () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    if (currentFlightId.value) {
      try {
        await fetch(`http://localhost:4000/api/flights/${currentFlightId.value}/cancel`, {
          method: 'PATCH',
        })
      } catch (error) {
        console.error('Error cancelling flight:', error)
      }
    }
    status.value = 'cancelled'
  }

  const reset = () => {
    status.value = 'idle'
    currentFlightId.value = null
    departureAirport.value = null
    arrivalAirport.value = null
    plannedDuration.value = 25
    seatNumber.value = ''
    distance.value = 0
    focusActivity.value = ''
    customActivityName.value = ''
    boardingStatus.value = 'pending'
    speedMultiplier.value = 1
    timeRemaining.value = 0
    totalSeconds.value = 0
  }

  return {
    status, currentFlightId, departureAirport, arrivalAirport,
    plannedDuration, seatNumber, distance,
    focusActivity, customActivityName, boardingStatus, speedMultiplier,
    timeRemaining, totalSeconds, progressPercent, formattedTime,
    distanceRemaining, timeRemainingMinutes, isActive, elapsedSeconds,
    bookFlight, selectSeat, selectActivity, checkIn,
    startFlight, pauseFlight, resumeFlight, setSpeed, landFlight, cancelFlight, reset,
  }
})
