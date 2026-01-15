/**
 * Health and Damage System
 * 
 * Abstract helper functions for managing health and damage in the game.
 * Designed to be extensible with useEffect hooks and event listeners.
 */

import useGameStore from '../store/gameStore'
import { DamageType } from '../config/damageConfig'

// Re-export DamageType for convenience
export { DamageType }

export type PlayerId = 'player1' | 'player2'
export type TeamId = 'teamA' | 'teamB'
export type DamageSource = 'bullet' | 'missile' | 'explosion' | 'environment' | 'other'

export interface DamageEvent {
  playerId: PlayerId
  teamId: TeamId
  damage: number
  damageType: DamageType
  source: DamageSource
  timestamp: number
}

export interface HealthChangeEvent {
  playerId: PlayerId
  teamId: TeamId
  oldHealth: number
  newHealth: number
  healthPercentage: number
  timestamp: number
}

type DamageCallback = (event: DamageEvent) => void
type HealthChangeCallback = (event: HealthChangeEvent) => void

// Event listeners storage
const damageListeners: Set<DamageCallback> = new Set()
const healthChangeListeners: Set<HealthChangeCallback> = new Set()

// Team mapping
const TEAM_MAP: Record<PlayerId, TeamId> = {
  player1: 'teamA',
  player2: 'teamB'
}

/**
 * Get team ID for a player
 */
export function getTeamId(playerId: PlayerId): TeamId {
  return TEAM_MAP[playerId]
}

/**
 * Get opponent team ID
 */
export function getOpponentTeamId(teamId: TeamId): TeamId {
  return teamId === 'teamA' ? 'teamB' : 'teamA'
}

/**
 * Get opponent player ID
 */
export function getOpponentPlayerId(playerId: PlayerId): PlayerId {
  return playerId === 'player1' ? 'player2' : 'player1'
}

/**
 * Apply damage to a player
 * This is the core damage application function
 */
export function applyDamage(
  playerId: PlayerId,
  damageType: DamageType,
  source: DamageSource = 'bullet'
): DamageEvent {
  const store = useGameStore.getState()
  const currentHealth = store[playerId].health
  const damage = damageType
  
  // Determine source player (opponent of the hit player)
  const sourcePlayerId = getOpponentPlayerId(playerId)
  
  // Apply damage through store (this also tracks damage dealt)
  store.applyDamageToPlayer(playerId, damage, sourcePlayerId)
  
  const newHealth = store[playerId].health
  const teamId = getTeamId(playerId)
  
  const event: DamageEvent = {
    playerId,
    teamId,
    damage,
    damageType,
    source,
    timestamp: Date.now()
  }
  
  // Notify damage listeners
  damageListeners.forEach(callback => {
    try {
      callback(event)
    } catch (error) {
      console.error('Error in damage listener:', error)
    }
  })
  
  // Notify health change listeners
  const healthPercentage = getHealthPercentage(playerId)
  const healthChangeEvent: HealthChangeEvent = {
    playerId,
    teamId,
    oldHealth: currentHealth,
    newHealth,
    healthPercentage,
    timestamp: Date.now()
  }
  
  healthChangeListeners.forEach(callback => {
    try {
      callback(healthChangeEvent)
    } catch (error) {
      console.error('Error in health change listener:', error)
    }
  })
  
  return event
}

/**
 * Trigger damage - can be called from anywhere
 * This is the main entry point for applying damage
 */
export function triggerDamage(
  playerId: PlayerId,
  damageType: DamageType,
  source: DamageSource = 'bullet'
): DamageEvent {
  return applyDamage(playerId, damageType, source)
}

/**
 * Get current health for a player
 */
export function getHealth(playerId: PlayerId): number {
  const store = useGameStore.getState()
  return store[playerId].health
}

/**
 * Get health percentage (0-100) for a player
 */
export function getHealthPercentage(playerId: PlayerId): number {
  const store = useGameStore.getState()
  const currentHealth = store[playerId].health
  const initialHealth = 100 // From playerConfig.initialHealth
  
  if (initialHealth === 0) return 0
  
  return Math.max(0, Math.min(100, (currentHealth / initialHealth) * 100))
}

/**
 * Get total health for a team
 */
export function getTeamHealth(teamId: TeamId): number {
  const store = useGameStore.getState()
  
  if (teamId === 'teamA') {
    return store.player1.health
  } else {
    return store.player2.health
  }
}

/**
 * Get team health percentage
 */
export function getTeamHealthPercentage(teamId: TeamId): number {
  return getHealthPercentage(teamId === 'teamA' ? 'player1' : 'player2')
}

/**
 * Register a damage event listener
 * Returns unsubscribe function
 */
export function registerDamageListener(callback: DamageCallback): () => void {
  damageListeners.add(callback)
  
  return () => {
    damageListeners.delete(callback)
  }
}

/**
 * Register a health change event listener
 * Returns unsubscribe function
 */
export function registerHealthChangeListener(callback: HealthChangeCallback): () => void {
  healthChangeListeners.add(callback)
  
  return () => {
    healthChangeListeners.delete(callback)
  }
}

/**
 * Reset health for all players
 */
export function resetHealth(): void {
  const store = useGameStore.getState()
  const initialHealth = 100 // From playerConfig.initialHealth
  
  store.damagePlayer('player1', -store.player1.health + initialHealth)
  store.damagePlayer('player2', -store.player2.health + initialHealth)
}

/**
 * Check if a player is alive
 */
export function isPlayerAlive(playerId: PlayerId): boolean {
  return getHealth(playerId) > 0
}

/**
 * Check if a team has any alive players
 */
export function isTeamAlive(teamId: TeamId): boolean {
  return getTeamHealth(teamId) > 0
}

/**
 * Damage system API object
 * Provides a clean interface for all damage system functions
 */
export const damageSystem = {
  triggerDamage,
  getHealth,
  getHealthPercentage,
  getTeamHealth,
  getTeamHealthPercentage,
  registerDamageListener,
  registerHealthChangeListener,
  resetHealth,
  isPlayerAlive,
  isTeamAlive,
  getTeamId,
  getOpponentTeamId,
  getOpponentPlayerId
}
