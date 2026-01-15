/**
 * Sound Manager
 *
 * Manages all game audio including sound effects and ambient sounds.
 */

import { audioConfig } from '../config/audioConfig'

// Cache for preloaded audio elements
const audioCache: Map<string, HTMLAudioElement> = new Map()

// Track last play time for each sound to prevent rapid repeat
const lastPlayTime: Map<string, number> = new Map()

// Ambient sound instances
let ambientSound: HTMLAudioElement | null = null

/**
 * Preload a sound file
 */
function preloadSound(src: string): HTMLAudioElement {
  if (audioCache.has(src)) {
    return audioCache.get(src)!
  }

  const audio = new Audio(src)
  audio.preload = 'auto'
  audioCache.set(src, audio)
  return audio
}

/**
 * Play a sound effect
 */
export function playSound(
  src: string,
  volume: number = audioConfig.volumes.sfx,
  allowRepeat: boolean = true
): void {
  if (!audioConfig.settings.enabled) return

  // Check repeat delay
  const now = Date.now()
  const lastTime = lastPlayTime.get(src) || 0
  if (!allowRepeat && now - lastTime < audioConfig.settings.repeatDelay) {
    return
  }
  lastPlayTime.set(src, now)

  // Create new audio instance for overlapping sounds
  const audio = new Audio(src)
  audio.volume = volume * audioConfig.volumes.master
  audio.play().catch((err) => {
    console.warn('Failed to play sound:', err)
  })
}

/**
 * Play tank firing sound
 */
export function playTankFireSound(): void {
  playSound(
    audioConfig.sounds.tankFire,
    audioConfig.volumes.tankFire,
    true
  )
}

/**
 * Play turret/missile firing sound
 */
export function playTurretFireSound(): void {
  playSound(
    audioConfig.sounds.turretFire,
    audioConfig.volumes.turretFire,
    true
  )
}

/**
 * Play hit/damage sound (crowd reaction)
 */
export function playHitSound(): void {
  // Randomly choose between cheering and clapping for variety
  const sounds = [
    audioConfig.sounds.crowdClapping,
    audioConfig.sounds.crowdShouting
  ]
  const randomSound = sounds[Math.floor(Math.random() * sounds.length)]
  playSound(randomSound, audioConfig.volumes.hit, false)
}

/**
 * Play tank movement sound
 */
let movementAudio: HTMLAudioElement | null = null

export function playTankMovementSound(): void {
  if (!audioConfig.settings.enabled) return

  if (!movementAudio) {
    movementAudio = new Audio(audioConfig.sounds.tankMovement)
    movementAudio.volume = audioConfig.volumes.movement * audioConfig.volumes.master
    movementAudio.loop = true
  }

  if (movementAudio.paused) {
    movementAudio.play().catch((err) => {
      console.warn('Failed to play movement sound:', err)
    })
  }
}

export function stopTankMovementSound(): void {
  if (movementAudio && !movementAudio.paused) {
    movementAudio.pause()
    movementAudio.currentTime = 0
  }
}

/**
 * Start ambient crowd sounds
 */
export function startAmbientSound(): void {
  if (!audioConfig.settings.enabled) return

  if (!ambientSound) {
    ambientSound = new Audio(audioConfig.sounds.crowdCheering)
    ambientSound.volume = audioConfig.volumes.crowd * audioConfig.volumes.master
    ambientSound.loop = audioConfig.settings.loopAmbient
  }

  if (ambientSound.paused) {
    ambientSound.play().catch((err) => {
      console.warn('Failed to play ambient sound:', err)
    })
  }
}

/**
 * Stop ambient sounds
 */
export function stopAmbientSound(): void {
  if (ambientSound && !ambientSound.paused) {
    ambientSound.pause()
    ambientSound.currentTime = 0
  }
}

/**
 * Set master volume
 */
export function setMasterVolume(volume: number): void {
  audioConfig.volumes.master = Math.max(0, Math.min(1, volume))

  // Update ambient sound volume
  if (ambientSound) {
    ambientSound.volume = audioConfig.volumes.crowd * audioConfig.volumes.master
  }

  // Update movement sound volume
  if (movementAudio) {
    movementAudio.volume = audioConfig.volumes.movement * audioConfig.volumes.master
  }
}

/**
 * Toggle audio on/off
 */
export function toggleAudio(enabled?: boolean): boolean {
  audioConfig.settings.enabled = enabled ?? !audioConfig.settings.enabled

  if (!audioConfig.settings.enabled) {
    stopAmbientSound()
    stopTankMovementSound()
  }

  return audioConfig.settings.enabled
}

/**
 * Preload all game sounds
 */
export function preloadAllSounds(): void {
  Object.values(audioConfig.sounds).forEach((src) => {
    preloadSound(src)
  })
}

/**
 * Cleanup all audio resources
 */
export function cleanupAudio(): void {
  stopAmbientSound()
  stopTankMovementSound()
  audioCache.clear()
  lastPlayTime.clear()
  ambientSound = null
  movementAudio = null
}
