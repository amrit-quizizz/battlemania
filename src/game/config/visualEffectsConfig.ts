/**
 * Visual Effects Configuration
 * 
 * Contains all visual effects-related parameters including emissive
 * intensities, material properties, and special effects.
 */

export interface VisualEffectsConfig {
  /** Emissive intensity values */
  emissive: {
    /** Standard emissive intensity */
    standard: number
    /** High emissive intensity */
    high: number
    /** Medium emissive intensity */
    medium: number
    /** Low emissive intensity */
    low: number
  }
  
  /** Material properties */
  materials: {
    /** Standard metalness value */
    metalness: number
    /** Standard roughness value */
    roughness: number
    /** Alternative roughness value */
    roughnessAlternative: number
  }
  
  /** Sun glow effect configuration */
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
  
  /** Smoke effect configuration */
  smoke: {
    /** Number of particles per smoke effect */
    particleCount: number
    /** Minimum particle size */
    particleSizeMin: number
    /** Maximum particle size */
    particleSizeMax: number
    /** Initial upward velocity */
    riseSpeed: number
    /** Horizontal spread velocity range */
    spreadSpeed: number
    /** Particle lifetime in seconds */
    lifetime: number
    /** Starting color (hex) */
    startColor: string
    /** Ending color (hex) - lighter as it rises */
    endColor: string
    /** Starting opacity */
    startOpacity: number
    /** Maximum concurrent smoke effects */
    maxConcurrent: number
  }
  
  /** Explosion effect configuration */
  explosion: {
    /** Initial sphere radius */
    initialRadius: number
    /** Maximum sphere radius */
    maxRadius: number
    /** Explosion lifetime in seconds */
    lifetime: number
    /** Starting color (hex) - bright orange/yellow */
    startColor: string
    /** Ending color (hex) - darker red */
    endColor: string
    /** Starting opacity */
    startOpacity: number
    /** Ending opacity */
    endOpacity: number
    /** Emissive intensity */
    emissiveIntensity: number
    /** Maximum concurrent explosions */
    maxConcurrent: number
  }
}

/**
 * Default visual effects configuration
 * All values are mutable and can be changed at runtime
 */
export const visualEffectsConfig: VisualEffectsConfig = {
  emissive: {
    standard: 0.5,
    high: 0.8,
    medium: 0.6,
    low: 0.3
  },
  materials: {
    metalness: 0.8,
    roughness: 0.2,
    roughnessAlternative: 1
  },
  sunGlow: {
    innerRadius: 1.0,
    innerOpacity: 0.4,
    innerColor: '#FFD700',
    outerRadius: 1.3,
    outerOpacity: 0.2,
    outerColor: '#FFE55C'
  },
  smoke: {
    particleCount: 60,
    particleSizeMin: 0.02,
    particleSizeMax: 0.05,
    riseSpeed: 1.5,
    spreadSpeed: 0.3,
    lifetime: 0.8,
    startColor: '#888888',
    endColor: '#ffffff',
    startOpacity: 0.8,
    maxConcurrent: 5
  },
  explosion: {
    initialRadius: 0.1,
    maxRadius: 0.8,
    lifetime: 0.4,
    startColor: '#FF6B00',
    endColor: '#FF0000',
    startOpacity: 1.0,
    endOpacity: 0.0,
    emissiveIntensity: 2.0,
    maxConcurrent: 3
  }
}
