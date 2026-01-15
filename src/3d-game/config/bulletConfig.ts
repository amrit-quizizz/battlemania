/**
 * Bullet Configuration
 * 
 * Contains all bullet-related parameters including speed, geometry,
 * materials, cooldown, and boundary limits.
 */

export interface BulletConfig {
  /** Bullet speed for top-down view mode (units per frame) */
  speed: number

  /** Bullet speed for side-scrolling mode (units per frame) */
  speedSideScroll: number

  /** Bullet speed for fast projectiles (units per frame) */
  speedFast: number

  /** Velocity multiplier applied to delta time (for frame-rate independent movement) */
  velocityMultiplier: number

  /** Fire cooldown time in milliseconds (prevents rapid firing) */
  fireCooldown: number

  /** Forward offset from tank position when firing (units) */
  forwardOffset: number

  /** Alternative forward offset values */
  forwardOffsetAlternatives: {
    /** Standard offset */
    standard: number
    /** Close offset */
    close: number
    /** Far offset */
    far: number
  }

  /** Vertical offset from tank position (cannon height) */
  verticalOffset: number

  /** Bullet geometry radius */
  geometryRadius: number

  /** Bullet geometry segments (for sphere) */
  geometrySegments: number

  /** Alternative bullet geometry sizes */
  geometrySizes: {
    /** Standard size */
    standard: [number, number, number]
    /** Medium size */
    medium: [number, number, number]
    /** Small size */
    small: number
  }

  /** Bullet material color (hex) */
  materialColor: string

  /** Bullet emissive color (hex) */
  materialEmissive: string

  /** Bullet emissive intensity (0-1) */
  materialEmissiveIntensity: number

  /** Bullet metalness (0-1) */
  materialMetalness: number

  /** Bullet roughness (0-1) */
  materialRoughness: number

  /** X-axis boundary limit - bullets beyond this are removed */
  boundaryX: number

  /** Z-axis boundary limit - bullets beyond this are removed */
  boundaryZ: number

  /** Y-axis boundary limit for side-scrolling mode */
  boundaryY: number

  /** Alternative boundary limits */
  boundaryLimits: {
    /** Standard boundaries */
    standard: { x: number; z: number }
    /** Side-scroll boundaries */
    sideScroll: { x: number; y: number }
  }

  /** Turret-to-turret fire configuration */
  turretFire: {
    /** Speed of turret bullets */
    speed: number
    /** Speed multiplier for turret bullets relative to tank bullets */
    speedMultiplier: number
    /** Damage dealt by turret bullets (higher than tank) */
    damage: number
    /** Spread angle between the two bullets (radians) */
    spreadAngle: number
    /** Fire cooldown for turret (ms) */
    cooldown: number
    /** Hit radius for turret collision detection */
    turretHitRadius: number
    /** Missile model scale */
    missileScale: number
    /** Missile rotation for player 1 (facing right) [x, y, z] */
    missileRotationP1: [number, number, number]
    /** Missile rotation for player 2 (facing left) [x, y, z] */
    missileRotationP2: [number, number, number]
    /** Vertical offset between the two parallel bullets */
    verticalOffset: number
    /** Start offset - how far behind the turret bullets spawn */
    startOffset: number
    /** End offset - how far past enemy turret bullets travel */
    endOffset: number
    /** Nozzle height offset from turret base */
    nozzleHeightOffset: number
    /** Z-plane for bullet visibility */
    visibleZ: number
  }
}

/**
 * Default bullet configuration
 * All values are mutable and can be changed at runtime
 */
export const bulletConfig: BulletConfig = {
  speed: 0.5,
  speedSideScroll: 2,
  speedFast: 15,
  velocityMultiplier: 10,
  fireCooldown: 500,
  forwardOffset: 1.5,
  forwardOffsetAlternatives: {
    standard: 1.5,
    close: 1,
    far: 2
  },
  verticalOffset: 0.5,
  geometryRadius: 0.2,
  geometrySegments: 8,
  geometrySizes: {
    standard: [0.2, 8, 8],
    medium: [0.15, 8, 8],
    small: 0.1
  },
  materialColor: '#ffaa00',
  materialEmissive: '#ff6600',
  materialEmissiveIntensity: 0.8,
  materialMetalness: 0.8,
  materialRoughness: 0.2,
  boundaryX: 35,
  boundaryZ: 35,
  boundaryY: 20,
  boundaryLimits: {
    standard: { x: 35, z: 35 },
    sideScroll: { x: 25, y: 20 }
  },
  turretFire: {
    speed: 0.2,
    speedMultiplier: 1.1,
    damage: 30,
    spreadAngle: 0.15,
    cooldown: 800,
    turretHitRadius: 3,
    missileScale: 0.07,
    missileRotationP1: [0, Math.PI , 0],
    missileRotationP2: [0, Math.PI , 0],
    verticalOffset: 0.15,
    startOffset: 1.3,
    endOffset: 1.3,
    nozzleHeightOffset: 1.4,
    visibleZ: 2.5
  }
}
