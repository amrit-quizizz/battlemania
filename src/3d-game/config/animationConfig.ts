/**
 * Animation Configuration
 * 
 * Contains all animation-related parameters including speeds,
 * amplitudes, and timing for various animated elements.
 */

export interface AnimationConfig {
  /** Cloud animation parameters */
  clouds: {
    /** Cloud 1 animation speed (radians per second) */
    cloud1Speed: number
    /** Cloud 1 X amplitude */
    cloud1AmplitudeX: number
    /** Cloud 1 Y base position */
    cloud1YBase: number
    /** Cloud 1 Y animation speed */
    cloud1YSpeed: number
    /** Cloud 1 Y amplitude */
    cloud1AmplitudeY: number
    /** Cloud 2 animation speed */
    cloud2Speed: number
    /** Cloud 2 X amplitude */
    cloud2AmplitudeX: number
    /** Cloud 2 X offset */
    cloud2XOffset: number
    /** Cloud 2 Y base position */
    cloud2YBase: number
    /** Cloud 2 Y animation speed */
    cloud2YSpeed: number
    /** Cloud 2 Y amplitude */
    cloud2AmplitudeY: number
    /** Cloud positions */
    positions: {
      cloud1: [number, number, number]
      cloud2: [number, number, number]
    }
  }
  
  /** Character animation parameters */
  characters: {
    /** Soldier patrol speed */
    patrolSpeed: number
    /** Soldier patrol amplitude */
    patrolAmplitude: number
    /** Soldier spacing multiplier */
    patrolSpacing: number
    /** Adventurer idle rotation speed */
    idleRotationSpeed: number
    /** Adventurer idle rotation amplitude */
    idleRotationAmplitude: number
  }
  
  /** General animation speeds */
  speeds: {
    /** Slow animation speed */
    slow: number
    /** Medium animation speed */
    medium: number
    /** Fast animation speed */
    fast: number
  }
}

/**
 * Default animation configuration
 * All values are mutable and can be changed at runtime
 */
export const animationConfig: AnimationConfig = {
  clouds: {
    cloud1Speed: 0.3,
    cloud1AmplitudeX: 2.5,
    cloud1YBase: 2.8,
    cloud1YSpeed: 0.1,
    cloud1AmplitudeY: 0.15,
    cloud2Speed: 0.3,
    cloud2AmplitudeX: 1.8,
    cloud2XOffset: 7,
    cloud2YBase: 2.4,
    cloud2YSpeed: 0.1,
    cloud2AmplitudeY: 0.15,
    positions: {
      cloud1: [-2, 5, -3],
      cloud2: [6, 2, -4]
    }
  },
  characters: {
    patrolSpeed: 0.3,
    patrolAmplitude: 5,
    patrolSpacing: 20,
    idleRotationSpeed: 1,
    idleRotationAmplitude: 0.2
  },
  speeds: {
    slow: 0.025,
    medium: 0.05,
    fast: 0.1
  }
}
