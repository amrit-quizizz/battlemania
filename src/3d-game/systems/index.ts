/**
 * Game Systems - External Integration API
 *
 * This module exports all game systems as contracts for external integration.
 * External systems can import these to interact with the game world.
 */

// Firing System - Control tank and turret weapons
export {
  // Types
  type PlayerId,
  type WeaponType,
  type FireIntensity,
  type FireRequest,
  type FireResult,
  type DamageEvent,
  type FiringSystemConfig,

  // Configuration
  defaultFiringConfig,

  // Event Listeners
  onFire,
  onDamage,
  emitFireEvent,
  emitDamageEvent,

  // Handler Registration (for game components)
  registerTankFireHandler,
  registerTurretFireHandler,
  unregisterHandlers,

  // Public API - Fire weapons
  fire,
  fireTank,
  fireTurret,

  // Configuration API
  configureFiring,
  setFiringEnabled,
  getFiringConfig,
  getDamageMultiplier,
  getSpeedMultiplier,
  resetFiringSystem
} from './firingSystem'
