/**
 * Lighting Configuration
 * 
 * Contains all lighting-related parameters including ambient light,
 * directional lights, point lights, shadows, and sun effects.
 */

export interface LightingConfig {
  /** Ambient light intensity (0-1) */
  ambientIntensity: number
  
  /** Alternative ambient light intensity */
  ambientIntensityAlternative: number
  
  /** Ambient light color */
  ambientColor: string
  
  /** Main directional light configuration */
  directionalMain: {
    /** Light position [x, y, z] */
    position: [number, number, number]
    /** Light intensity (0-1) */
    intensity: number
    /** Enable shadow casting */
    castShadow: boolean
    /** Shadow map size [width, height] */
    shadowMapSize: [number, number]
    /** Shadow camera far plane */
    shadowCameraFar: number
    /** Shadow camera left bound */
    shadowCameraLeft: number
    /** Shadow camera right bound */
    shadowCameraRight: number
    /** Shadow camera top bound */
    shadowCameraTop: number
    /** Shadow camera bottom bound */
    shadowCameraBottom: number
    /** Shadow bias */
    shadowBias: number
  }
  
  /** Fill directional light configuration */
  directionalFill: {
    /** Light position [x, y, z] */
    position: [number, number, number]
    /** Light intensity (0-1) */
    intensity: number
  }
  
  /** Sun directional light configuration */
  directionalSun: {
    /** Light position [x, y, z] */
    position: [number, number, number]
    /** Light intensity (0-1) */
    intensity: number
    /** Enable shadow casting */
    castShadow: boolean
    /** Shadow map size [width, height] */
    shadowMapSize: [number, number]
    /** Shadow camera settings */
    shadowCamera: {
      far: number
      left: number
      right: number
      top: number
      bottom: number
      bias: number
    }
  }
  
  /** Warm fill light configuration */
  directionalFillWarm: {
    /** Light position [x, y, z] */
    position: [number, number, number]
    /** Light intensity (0-1) */
    intensity: number
    /** Light color */
    color: string
  }
  
  /** Rim light configuration */
  directionalRim: {
    /** Light position [x, y, z] */
    position: [number, number, number]
    /** Light intensity (0-1) */
    intensity: number
    /** Light color */
    color: string
  }
  
  /** Top directional light configuration */
  directionalTop: {
    /** Light position [x, y, z] */
    position: [number, number, number]
    /** Light intensity (0-1) */
    intensity: number
    /** Light color */
    color: string
  }
  
  /** Point light configuration (for sun) */
  pointLight: {
    /** Light intensity (0-1) */
    intensity: number
    /** Light color */
    color: string
    /** Light distance/range */
    distance: number
  }
  
  /** Sun glow effect layers */
  sunGlow: {
    /** Inner glow sphere radius */
    innerRadius: number
    /** Inner glow opacity */
    innerOpacity: number
    /** Inner glow color */
    innerColor: string
    /** Outer glow sphere radius */
    outerRadius: number
    /** Outer glow opacity */
    outerOpacity: number
    /** Outer glow color */
    outerColor: string
  }
}

/**
 * Default lighting configuration
 * All values are mutable and can be changed at runtime
 */
export const lightingConfig: LightingConfig = {
  ambientIntensity: 0.7,
  ambientIntensityAlternative: 0.8,
  ambientColor: '#ffffff',
  directionalMain: {
    position: [10, 20, 10],
    intensity: 1.2,
    castShadow: true,
    shadowMapSize: [2048, 2048],
    shadowCameraFar: 50,
    shadowCameraLeft: -20,
    shadowCameraRight: 20,
    shadowCameraTop: 20,
    shadowCameraBottom: -20,
    shadowBias: 0
  },
  directionalFill: {
    position: [-10, 15, 15],
    intensity: 0.5
  },
  directionalSun: {
    position: [7, 6, -5],
    intensity: 1.0,
    castShadow: true,
    shadowMapSize: [2048, 2048],
    shadowCamera: {
      far: 50,
      left: -15,
      right: 15,
      top: 10,
      bottom: -10,
      bias: -0.0001
    }
  },
  directionalFillWarm: {
    position: [-5, 4, 5],
    intensity: 0.4,
    color: '#e0e8f0'
  },
  directionalRim: {
    position: [0, 8, 5],
    intensity: 0.25,
    color: '#ffffff'
  },
  directionalTop: {
    position: [0, 10, 0],
    intensity: 0.15,
    color: '#ffffff'
  },
  pointLight: {
    intensity: 1,
    color: '#ffaa00',
    distance: 25
  },
  sunGlow: {
    innerRadius: 1.0,
    innerOpacity: 0.4,
    innerColor: '#FFD700',
    outerRadius: 1.3,
    outerOpacity: 0.2,
    outerColor: '#FFE55C'
  }
}
