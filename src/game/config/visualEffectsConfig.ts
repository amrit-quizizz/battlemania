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
  }
}
