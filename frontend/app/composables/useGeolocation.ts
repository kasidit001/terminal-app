import { ref } from 'vue'

export function useGeolocation() {
  const latitude = ref<number | null>(null)
  const longitude = ref<number | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  const requestLocation = (): Promise<{ lat: number; lng: number }> => {
    loading.value = true
    error.value = null

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        error.value = 'Geolocation not supported'
        loading.value = false
        reject(new Error('Geolocation not supported'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          latitude.value = pos.coords.latitude
          longitude.value = pos.coords.longitude
          loading.value = false
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        (err) => {
          error.value = err.message
          loading.value = false
          reject(err)
        },
        { enableHighAccuracy: false, timeout: 10000 }
      )
    })
  }

  return { latitude, longitude, error, loading, requestLocation }
}
