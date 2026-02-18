import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface FlightRecord {
    date: string // YYYY-MM-DD
    minutes: number
    route: string
    activity: string
}

export const useStatsStore = defineStore('stats', () => {
    const totalFlights = ref(0)
    const totalFocusMinutes = ref(0)
    const currentStreak = ref(0)
    const bestStreak = ref(0)
    const lastFlightDate = ref<string | null>(null)
    const recentFlights = ref<FlightRecord[]>([])

    const focusHours = computed(() => Math.floor(totalFocusMinutes.value / 60))
    const focusMinutesRemainder = computed(() => totalFocusMinutes.value % 60)

    const focusScore = computed(() => {
        // Score based on: flights × 10 + minutes × 0.5 + streak × 20
        return Math.round(totalFlights.value * 10 + totalFocusMinutes.value * 0.5 + currentStreak.value * 20)
    })

    const focusLevel = computed(() => {
        const score = focusScore.value
        if (score >= 1000) return { label: 'Captain', icon: '✈️', color: 'text-yellow-400' }
        if (score >= 500) return { label: 'First Officer', icon: '🛫', color: 'text-blue-400' }
        if (score >= 200) return { label: 'Senior Pilot', icon: '🌍', color: 'text-emerald-400' }
        if (score >= 50) return { label: 'Co-Pilot', icon: '🛩️', color: 'text-cyan-400' }
        return { label: 'Trainee', icon: '🎓', color: 'text-gray-400' }
    })

    const recordFlight = (minutes: number, route: string, activity: string) => {
        const today = new Date().toISOString().split('T')[0]!

        totalFlights.value++
        totalFocusMinutes.value += minutes

        // Streak logic
        if (lastFlightDate.value === null) {
            currentStreak.value = 1
        } else {
            const last = new Date(lastFlightDate.value)
            const now = new Date(today)
            const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
            if (diffDays === 0) {
                // Same day — streak unchanged
            } else if (diffDays === 1) {
                // Consecutive day — extend streak
                currentStreak.value++
            } else {
                // Gap — reset streak
                currentStreak.value = 1
            }
        }

        if (currentStreak.value > bestStreak.value) {
            bestStreak.value = currentStreak.value
        }

        lastFlightDate.value = today

        // Keep last 10 flights
        recentFlights.value.unshift({ date: today, minutes, route, activity })
        if (recentFlights.value.length > 10) {
            recentFlights.value = recentFlights.value.slice(0, 10)
        }

        persist()
    }

    const persist = () => {
        localStorage.setItem('focusflight_stats', JSON.stringify({
            totalFlights: totalFlights.value,
            totalFocusMinutes: totalFocusMinutes.value,
            currentStreak: currentStreak.value,
            bestStreak: bestStreak.value,
            lastFlightDate: lastFlightDate.value,
            recentFlights: recentFlights.value,
        }))
    }

    const initialize = () => {
        const saved = localStorage.getItem('focusflight_stats')
        if (saved) {
            try {
                const data = JSON.parse(saved)
                totalFlights.value = data.totalFlights ?? 0
                totalFocusMinutes.value = data.totalFocusMinutes ?? 0
                currentStreak.value = data.currentStreak ?? 0
                bestStreak.value = data.bestStreak ?? 0
                lastFlightDate.value = data.lastFlightDate ?? null
                recentFlights.value = data.recentFlights ?? []

                // Check if streak should be reset (no flight yesterday or today)
                if (lastFlightDate.value) {
                    const last = new Date(lastFlightDate.value)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
                    if (diffDays > 1) {
                        currentStreak.value = 0
                        persist()
                    }
                }
            } catch {
                // ignore
            }
        }
    }

    return {
        totalFlights,
        totalFocusMinutes,
        currentStreak,
        bestStreak,
        lastFlightDate,
        recentFlights,
        focusHours,
        focusMinutesRemainder,
        focusScore,
        focusLevel,
        recordFlight,
        initialize,
    }
})
