import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useFlightStore = defineStore('flight', () => {
  const flight = ref<any>(null); // Replace 'any' with a proper type later
  const progress = ref(0);
  const intervalId = ref<any>(null);

  const startFlight = async (flightData: {
    flightNumber: string;
    origin: string;
    destination: string;
    taskCategory: string;
  }) => {
    try {
      // Create flight via API
      const response = await fetch('http://localhost:4000/api/flights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flightData),
      });

      if (!response.ok) {
        throw new Error('Failed to create flight');
      }

      flight.value = await response.json();
      
      // Start progress simulation
      startProgress();
    } catch (error) {
      console.error('Error starting flight:', error);
    }
  };

  const startProgress = () => {
    if (intervalId.value) clearInterval(intervalId.value);
    progress.value = 0;

    intervalId.value = setInterval(() => {
      if (progress.value < 100) {
        progress.value += 1;
      } else {
        landFlight();
      }
    }, 100); // Adjust speed as needed
  };

  const landFlight = async () => {
    if (intervalId.value) {
      clearInterval(intervalId.value);
      intervalId.value = null;
    }

    if (!flight.value) return;

    try {
      const response = await fetch(`http://localhost:4000/api/flights/${flight.value.id}/land`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to land flight');
      }

      const updatedFlight = await response.json();
      flight.value = { ...flight.value, status: updatedFlight.status, arrivalTime: updatedPhase };
    } catch (error) {
      console.error('Error landing flight:', error);
    }
  };

  return {
    flight,
    progress,
    startFlight,
    landFlight,
  };
});
