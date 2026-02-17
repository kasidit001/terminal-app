import { ref, reactive } from 'vue'

export interface SoundTrack {
  id: string
  name: string
  category: 'white-noise' | 'nature'
  file: string
  enabled: boolean
  volume: number
  source?: AudioBufferSourceNode
  gain?: GainNode
  buffer?: AudioBuffer
}

export function useSounds() {
  let audioContext: AudioContext | null = null
  let masterGain: GainNode | null = null
  const masterVolume = ref(0.5)
  const isEnabled = ref(false)

  const tracks = reactive<SoundTrack[]>([
    { id: 'airplane', name: 'Airplane Sound', category: 'white-noise', file: '/sounds/airplane-cabin.mp3', enabled: false, volume: 0.5 },
    { id: 'rain', name: 'Raindrop', category: 'white-noise', file: '/sounds/rain.mp3', enabled: false, volume: 0.5 },
    { id: 'ocean', name: 'Ocean Waves', category: 'nature', file: '/sounds/ocean.mp3', enabled: false, volume: 0.5 },
    { id: 'forest', name: 'Forest', category: 'nature', file: '/sounds/forest.mp3', enabled: false, volume: 0.5 },
  ])

  const ensureContext = () => {
    if (!audioContext) {
      audioContext = new AudioContext()
      masterGain = audioContext.createGain()
      masterGain.gain.value = masterVolume.value
      masterGain.connect(audioContext.destination)
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
  }

  const loadBuffer = async (url: string): Promise<AudioBuffer | null> => {
    if (!audioContext) return null
    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      return await audioContext.decodeAudioData(arrayBuffer)
    } catch (e) {
      console.error('Failed to load sound:', url, e)
      return null
    }
  }

  const startTrack = async (track: SoundTrack) => {
    ensureContext()
    if (!audioContext || !masterGain) return

    // Load buffer if not cached
    if (!track.buffer) {
      const buffer = await loadBuffer(track.file)
      if (!buffer) return
      track.buffer = buffer
    }

    // Stop existing source
    stopTrack(track)

    const source = audioContext.createBufferSource()
    source.buffer = track.buffer
    source.loop = true

    const gain = audioContext.createGain()
    gain.gain.value = track.volume

    source.connect(gain)
    gain.connect(masterGain)
    source.start()

    track.source = source
    track.gain = gain
    track.enabled = true
  }

  const stopTrack = (track: SoundTrack) => {
    if (track.source) {
      try { track.source.stop() } catch {}
      track.source = undefined
    }
    track.gain = undefined
    track.enabled = false
  }

  const toggleTrack = async (trackId: string) => {
    const track = tracks.find(t => t.id === trackId)
    if (!track) return

    if (track.enabled) {
      stopTrack(track)
    } else {
      await startTrack(track)
    }

    // Update master enabled state
    isEnabled.value = tracks.some(t => t.enabled)
  }

  const setTrackVolume = (trackId: string, volume: number) => {
    const track = tracks.find(t => t.id === trackId)
    if (!track) return
    track.volume = volume
    if (track.gain) {
      track.gain.gain.value = volume
    }
  }

  const setMasterVolume = (vol: number) => {
    masterVolume.value = vol
    if (masterGain) {
      masterGain.gain.value = vol
    }
  }

  const toggleMaster = () => {
    if (isEnabled.value) {
      tracks.forEach(t => {
        if (t.enabled) stopTrack(t)
      })
      isEnabled.value = false
    } else {
      // Enable airplane sound by default
      const airplane = tracks.find(t => t.id === 'airplane')
      if (airplane) startTrack(airplane)
      isEnabled.value = true
    }
  }

  const stopAll = () => {
    tracks.forEach(t => stopTrack(t))
    isEnabled.value = false
    if (audioContext) {
      audioContext.close()
      audioContext = null
      masterGain = null
    }
  }

  return {
    tracks, masterVolume, isEnabled,
    toggleTrack, setTrackVolume, setMasterVolume, toggleMaster, stopAll,
  }
}
