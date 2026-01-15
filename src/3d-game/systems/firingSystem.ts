/**
 * Firing System
 *
 * Abstraction layer for tank and turret firing mechanics.
 * Provides a clean contract/interface for external integration.
 */

// ============================================
// TYPES & INTERFACES (CONTRACT)
// ============================================

/** Player/Team identifier */
export type PlayerId = 'player1' | 'player2'

/** Type of weapon being fired */
export type WeaponType = 'tank' | 'turret'

/** Intensity level for firing */
export type FireIntensity = 'low' | 'medium' | 'high'

/** Fire event request - the contract for triggering a fire */
export interface FireRequest {
  /** Which player/team is firing */
  playerId: PlayerId
  /** Type of weapon to fire */
  weaponType: WeaponType
  /** Intensity of the shot (affects damage, visual effects) */
  intensity?: FireIntensity
  /** Optional custom damage override */
  customDamage?: number
  /** Optional custom speed override */
  customSpeed?: number
}

/** Fire event result - returned after firing */
export interface FireResult {
  /** Whether the fire was successful */
  success: boolean
  /** Unique ID of the fired projectile(s) */
  projectileIds: string[]
  /** Timestamp of the fire event */
  timestamp: number
  /** Error message if fire failed */
  error?: string
}

/** Damage event - emitted when a projectile hits */
export interface DamageEvent {
  /** Player who fired */
  sourcePlayer: PlayerId
  /** Player who was hit */
  targetPlayer: PlayerId
  /** Weapon type that caused the damage */
  weaponType: WeaponType
  /** Amount of damage dealt */
  damage: number
  /** Timestamp of the hit */
  timestamp: number
}

/** Firing system configuration */
export interface FiringSystemConfig {
  /** Whether firing is enabled */
  enabled: boolean
  /** Damage multipliers by intensity */
  intensityMultipliers: {
    low: number
    medium: number
    high: number
  }
  /** Speed multipliers by intensity */
  speedMultipliers: {
    low: number
    medium: number
    high: number
  }
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

export const defaultFiringConfig: FiringSystemConfig = {
  enabled: true,
  intensityMultipliers: {
    low: 0.5,
    medium: 1.0,
    high: 1.5
  },
  speedMultipliers: {
    low: 0.8,
    medium: 1.0,
    high: 1.2
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

type FireEventListener = (request: FireRequest, result: FireResult) => void
type DamageEventListener = (event: DamageEvent) => void

const fireEventListeners: Set<FireEventListener> = new Set()
const damageEventListeners: Set<DamageEventListener> = new Set()

/** Register a listener for fire events */
export function onFire(listener: FireEventListener): () => void {
  fireEventListeners.add(listener)
  return () => fireEventListeners.delete(listener)
}

/** Register a listener for damage events */
export function onDamage(listener: DamageEventListener): () => void {
  damageEventListeners.add(listener)
  return () => damageEventListeners.delete(listener)
}

/** Emit a fire event to all listeners */
export function emitFireEvent(request: FireRequest, result: FireResult): void {
  fireEventListeners.forEach(listener => {
    try {
      listener(request, result)
    } catch (err) {
      console.error('Fire event listener error:', err)
    }
  })
}

/** Emit a damage event to all listeners */
export function emitDamageEvent(event: DamageEvent): void {
  damageEventListeners.forEach(listener => {
    try {
      listener(event)
    } catch (err) {
      console.error('Damage event listener error:', err)
    }
  })
}

// ============================================
// FIRING HANDLERS (Set by game components)
// ============================================

type TankFireHandler = (playerId: PlayerId, intensity: FireIntensity) => FireResult
type TurretFireHandler = (playerId: PlayerId, intensity: FireIntensity) => FireResult

let tankFireHandler: TankFireHandler | null = null
let turretFireHandler: TurretFireHandler | null = null

/** Register the tank fire handler (called by game component) */
export function registerTankFireHandler(handler: TankFireHandler): void {
  tankFireHandler = handler
}

/** Register the turret fire handler (called by game component) */
export function registerTurretFireHandler(handler: TurretFireHandler): void {
  turretFireHandler = handler
}

/** Unregister handlers (cleanup) */
export function unregisterHandlers(): void {
  tankFireHandler = null
  turretFireHandler = null
}

// ============================================
// PUBLIC API
// ============================================

let firingConfig = { ...defaultFiringConfig }

/**
 * Fire a weapon
 *
 * @param request - The fire request containing player, weapon type, and intensity
 * @returns FireResult with success status and projectile IDs
 *
 * @example
 * ```typescript
 * import { fire } from './systems/firingSystem'
 *
 * // Fire player 1's tank with medium intensity
 * const result = fire({
 *   playerId: 'player1',
 *   weaponType: 'tank',
 *   intensity: 'medium'
 * })
 *
 * // Fire player 2's turret with high intensity
 * fire({
 *   playerId: 'player2',
 *   weaponType: 'turret',
 *   intensity: 'high'
 * })
 * ```
 */
export function fire(request: FireRequest): FireResult {
  const { playerId, weaponType, intensity = 'medium' } = request

  // Check if firing is enabled
  if (!firingConfig.enabled) {
    return {
      success: false,
      projectileIds: [],
      timestamp: Date.now(),
      error: 'Firing system is disabled'
    }
  }

  // Get the appropriate handler
  const handler = weaponType === 'tank' ? tankFireHandler : turretFireHandler

  if (!handler) {
    return {
      success: false,
      projectileIds: [],
      timestamp: Date.now(),
      error: `No handler registered for ${weaponType}`
    }
  }

  // Execute the fire
  const result = handler(playerId, intensity)

  // Emit event to listeners
  emitFireEvent(request, result)

  return result
}

/**
 * Fire tank weapon (convenience method)
 */
export function fireTank(playerId: PlayerId, intensity: FireIntensity = 'medium'): FireResult {
  return fire({ playerId, weaponType: 'tank', intensity })
}

/**
 * Fire turret weapon (convenience method)
 */
export function fireTurret(playerId: PlayerId, intensity: FireIntensity = 'medium'): FireResult {
  return fire({ playerId, weaponType: 'turret', intensity })
}

/**
 * Update firing system configuration
 */
export function configureFiring(config: Partial<FiringSystemConfig>): void {
  firingConfig = { ...firingConfig, ...config }
}

/**
 * Enable or disable firing
 */
export function setFiringEnabled(enabled: boolean): void {
  firingConfig.enabled = enabled
}

/**
 * Get current firing configuration
 */
export function getFiringConfig(): FiringSystemConfig {
  return { ...firingConfig }
}

/**
 * Get damage multiplier for intensity
 */
export function getDamageMultiplier(intensity: FireIntensity): number {
  return firingConfig.intensityMultipliers[intensity]
}

/**
 * Get speed multiplier for intensity
 */
export function getSpeedMultiplier(intensity: FireIntensity): number {
  return firingConfig.speedMultipliers[intensity]
}

/**
 * Reset firing system to defaults
 */
export function resetFiringSystem(): void {
  firingConfig = { ...defaultFiringConfig }
  fireEventListeners.clear()
  damageEventListeners.clear()
  tankFireHandler = null
  turretFireHandler = null
}
