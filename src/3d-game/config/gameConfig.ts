/**
 * Main Game Configuration
 * 
 * Aggregates all game configuration modules and provides unified access.
 * All configurations are mutable and can be modified at runtime.
 */

import { playerConfig, type PlayerConfig } from './playerConfig'
import { physicsConfig, type PhysicsConfig } from './physicsConfig'
import { bulletConfig, type BulletConfig } from './bulletConfig'
import { cameraConfig, type CameraConfig } from './cameraConfig'
import { lightingConfig, type LightingConfig } from './lightingConfig'
import { environmentConfig, type EnvironmentConfig } from './environmentConfig'
import { modelScalesConfig, type ModelScalesConfig } from './modelScalesConfig'
import { uiConfig, type UIConfig } from './uiConfig'
import { animationConfig, type AnimationConfig } from './animationConfig'
import { visualEffectsConfig, type VisualEffectsConfig } from './visualEffectsConfig'
import { spectatorConfig, type SpectatorConfig } from './spectatorConfig'
import { damageConfig, type DamageConfig } from './damageConfig'

/**
 * Complete game configuration interface
 */
export interface GameConfig {
  player: PlayerConfig
  physics: PhysicsConfig
  bullet: BulletConfig
  camera: CameraConfig
  lighting: LightingConfig
  environment: EnvironmentConfig
  modelScales: ModelScalesConfig
  ui: UIConfig
  animation: AnimationConfig
  visualEffects: VisualEffectsConfig
  spectator: SpectatorConfig
  damage: DamageConfig
}

/**
 * Main game configuration object
 * 
 * This object aggregates all configuration modules and provides
 * unified access to all game parameters. All values are mutable
 * and can be changed at runtime for easy tweaking.
 * 
 * Example usage:
 * ```typescript
 * import { gameConfig } from './config/gameConfig'
 * 
 * // Access player config
 * gameConfig.player.initialHealth = 150
 * 
 * // Access bullet config
 * gameConfig.bullet.speed = 0.8
 * 
 * // Access camera config
 * gameConfig.camera.perspective.fov = 75
 * ```
 */
export const gameConfig: GameConfig = {
  player: playerConfig,
  physics: physicsConfig,
  bullet: bulletConfig,
  camera: cameraConfig,
  lighting: lightingConfig,
  environment: environmentConfig,
  modelScales: modelScalesConfig,
  ui: uiConfig,
  animation: animationConfig,
  visualEffects: visualEffectsConfig,
  spectator: spectatorConfig,
  damage: damageConfig
}

/**
 * Get a specific configuration section
 * 
 * @param section - The configuration section name
 * @returns The configuration object for the specified section
 */
export function getConfig<T extends keyof GameConfig>(section: T): GameConfig[T] {
  return gameConfig[section]
}

/**
 * Update a specific configuration value
 * 
 * @param section - The configuration section name
 * @param updates - Partial updates to apply to the section
 */
export function updateConfig<T extends keyof GameConfig>(
  section: T,
  updates: Partial<GameConfig[T]>
): void {
  Object.assign(gameConfig[section], updates)
}

// Export individual configs for convenience
export {
  playerConfig,
  physicsConfig,
  bulletConfig,
  cameraConfig,
  lightingConfig,
  environmentConfig,
  modelScalesConfig,
  uiConfig,
  animationConfig,
  visualEffectsConfig,
  spectatorConfig,
  damageConfig
}

// Export types
export type {
  PlayerConfig,
  PhysicsConfig,
  BulletConfig,
  CameraConfig,
  LightingConfig,
  EnvironmentConfig,
  ModelScalesConfig,
  UIConfig,
  AnimationConfig,
  VisualEffectsConfig,
  SpectatorConfig,
  DamageConfig
}
