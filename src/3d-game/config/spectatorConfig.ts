/**
 * Spectator Configuration
 * 
 * Contains all configuration for spectator figures including appearance,
 * animation parameters, and positioning settings.
 */

export interface SpectatorConfig {
  /** Appearance settings */
  appearance: {
    /** Body color (white for gudda-like figures) */
    color: string
    /** Eye color */
    eyeColor: string
    /** Head size (radius) */
    headSize: number
    /** Body dimensions [width, height, depth] */
    bodySize: [number, number, number]
    /** Arm length */
    armLength: number
    /** Arm thickness (radius) */
    armThickness: number
    /** Leg length */
    legLength: number
    /** Leg thickness (radius) */
    legThickness: number
    /** Eye size (radius) */
    eyeSize: number
    /** Eye position offset from head center [x, y, z] */
    eyeOffset: [number, number, number]
  }
  
  /** Animation parameters */
  animation: {
    /** Cheering animation speed (radians per second) */
    cheeringSpeed: number
    /** Arm rotation range during cheering [min, max] in radians */
    cheeringAmplitude: [number, number]
    /** Idle arm rotation (hanging down) */
    idleArmRotation: number
    /** Probability of starting a cheer per frame (0-1) */
    cheeringFrequency: number
    /** Duration of cheering burst in seconds */
    cheeringDuration: number
    /** Idle variation amplitude (slight random movement) */
    idleVariation: number
  }
  
  /** Positioning settings */
  positioning: {
    /** Number of spectator figures */
    count: number
    /** Spacing between figures [x, y, z] */
    spacing: [number, number, number]
    /** Base offset from stadium position [x, y, z] */
    baseOffset: [number, number, number]
    /** Layout type */
    layout: 'grid' | 'random'
    /** Grid dimensions [rows, cols] (only used for grid layout) */
    gridDimensions?: [number, number]
  }
  
  /** Physics properties */
  physics: {
    /** Mass of spectator (kg) - affects inertia and response to forces */
    mass: number
    /** Friction coefficient (0-1) - affects sliding on surfaces */
    friction: number
    /** Restitution (bounciness) coefficient (0-1) - affects collision bounce */
    restitution: number
    /** Linear damping (0-1) - reduces linear velocity over time */
    linearDamping: number
    /** Angular damping (0-1) - reduces angular velocity over time */
    angularDamping: number
  }
  
  /** Stair level configuration */
  stairs: {
    /** Number of stair levels in the stadium */
    stairLevels: number
    /** Height difference between stair levels */
    stairHeight: number
    /** Height above target stair level to start falling from */
    fallOffset: number
  }
}

/**
 * Default spectator configuration
 * All values are mutable and can be changed at runtime
 */
export const spectatorConfig: SpectatorConfig = {
  appearance: {
    color: '#ffffff',
    eyeColor: '#000000',
    headSize: 0.15,
    bodySize: [0.12, 0.18, 0.08],
    armLength: 0.12,
    armThickness: 0.03,
    legLength: 0.14,
    legThickness: 0.04,
    eyeSize: 0.02,
    eyeOffset: [0.04, 0.03, 0.13]
  },
  animation: {
    cheeringSpeed: 3.0,
    cheeringAmplitude: [-Math.PI / 3, Math.PI / 2],
    idleArmRotation: -0.2,
    cheeringFrequency: 0.002, // Low probability for occasional cheering
    cheeringDuration: 1.5,
    idleVariation: 0.05
  },
  positioning: {
    count: 32,
    spacing: [0.6, 1.0, 0.5],
    baseOffset: [0, 0.1, 0],
    layout: 'grid',
    gridDimensions: [5, 8] // 4 rows, 8 columns = 32 figures
  },
  physics: {
    mass: 0.8,
    friction: 0.9,
    restitution: 0.01,
    linearDamping: 0.5,
    angularDamping: 0.8
  },
  stairs: {
    stairLevels: 4,
    stairHeight: 0.15,
    fallOffset: 0.1
  }
}
