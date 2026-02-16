import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Airport } from './useAppStore'

export type FlightStatus = 'idle' | 'boarding' | 'in-flight' | 'paused' | 'landed' | 'cancelled'

export const useFlightStore = defineStore('flight', () => {
  const status = ref<FlightStatus>('idle')
  const currentFlightId = ref<string | null>(null)
  const departureAirport = ref<Airport | null>(null)
  const arrivalAirport = ref<Airport | null>(null)
  const taskCategory = ref('')
  const plannedDuration = ref(25)
  const seatNumber = ref('')
  const distance = ref(0)

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

  const isActive = computed(() =>
    status.value === 'in-flight' || status.value === 'paused'
  )

  const generateSeat = (): string => {
    const row = Math.floor(Math.random() * 30) + 1
    const col = ['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)]
    return `${row}${col}`
  }

  const bookFlight = (params: {
    departure: Airport
    arrival: Airport
    task: string
    duration: number
    dist: number
  }) => {
    departureAirport.value = params.departure
    arrivalAirport.value = params.arrival
    taskCategory.value = params.task
    plannedDuration.value = params.duration
    distance.value = Math.round(params.dist)
    seatNumber.value = generateSeat()
    status.value = 'boarding'
  }

  const startFlight = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departureCode: departureAirport.value?.iata,
          arrivalCode: arrivalAirport.value?.iata,
          taskCategory: taskCategory.value,
          plannedDuration: plannedDuration.value,
          seatNumber: seatNumber.value,
          distance: distance.value,
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
    }, 1000)
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

  const landFlight = async () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    if (!currentFlightId.value) return

    try {
      await fetch(`http://localhost:4000/api/flights/${currentFlightId.value}/land`, {
        method: 'PATCH',
      })
    } catch (error) {
      console.error('Error landing flight:', error)
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
    taskCategory.value = ''
    plannedDuration.value = 25
    seatNumber.value = ''
    distance.value = 0
    timeRemaining.value = 0
    totalSeconds.value = 0
  }

  return {
    status, currentFlightId, departureAirport, arrivalAirport,
    taskCategory, plannedDuration, seatNumber, distance,
    timeRemaining, totalSeconds, progressPercent, formattedTime, isActive,
    bookFlight, startFlight, pauseFlight, resumeFlight, landFlight, cancelFlight, reset,
  }
})
