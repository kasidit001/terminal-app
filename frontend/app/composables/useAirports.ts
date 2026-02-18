import { ref, computed } from 'vue'
import airportsData from '../data/airports.json'
import type { Airport } from '../stores/useAppStore'

const airports: Airport[] = airportsData as Airport[]

export function useAirports() {
  const searchQuery = ref('')

  const filteredAirports = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return airports.slice(0, 20)
    return airports.filter(a =>
      a.iata.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q)
    ).slice(0, 50)
  })

  const findByIata = (iata: string): Airport | undefined => {
    return airports.find(a => a.iata === iata.toUpperCase())
  }

  const findNearest = (lat: number, lng: number, count: number = 5): Airport[] => {
    return [...airports]
      .map(a => ({
        ...a,
        _dist: haversineDistance(lat, lng, a.lat, a.lng)
      }))
      .sort((a, b) => a._dist - b._dist)
      .slice(0, count)
      .map(({ _dist, ...airport }) => airport)
  }

  const getRandomAirport = (): Airport => {
    return airports[Math.floor(Math.random() * airports.length)]!
  }

  return { airports, searchQuery, filteredAirports, findByIata, findNearest, getRandomAirport }
}

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
