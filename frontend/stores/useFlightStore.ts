import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useFlightStore = defineStore('flight', () => {
  // State
  const status = ref<'draft' | 'active'>('draft');
  const timeRemaining = ref(0); // in seconds
  const currentFlightId = ref<string | null>(null);
  
  // Internal timer reference
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  // Actions
  const startFlight = async (payload: { 
    departureCode: string; 
    arrivalCode: string; 
    taskCategory: string; 
    plannedDuration: number; // in minutes
  }) => {
    try {
      const response = await fetch('http://localhost:4000/api/flights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to start flight');
      }

      const data = await response.json();
      
      // Update State
      currentFlightId.value = data.id;
      status.value = 'active';
      timeRemaining.value = payload.plannedDuration * 60; // Convert minutes to seconds

      // Start Countdown
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        if (timeRemaining.value > 0) {
          timeRemaining.value--;
        } else {
          landFlight(); // Auto-land when time runs out
        }
      }, 1000);

    } catch (error) {
      console.error('Error starting flight:', error);
    }
  };

  const landFlight = async () => {
    // Clear interval immediately
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (!currentFlightId.value) return;

    try {
      const response = await fetch(`http://localhost:4000/api/flights/${currentFlightId.value}/land`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to land flight');
      }

      // Reset State to Draft (Ready for next flight)
      status.value = 'draft';
      currentFlightId.value = null;
      timeRemaining.value = 0;

    } catch (error) {
      console.error('Error landing flight:', error);
    }
  };

  return {
    status,
    timeRemaining,
    currentFlightId,
    startFlight,
    landFlight,
  };
});