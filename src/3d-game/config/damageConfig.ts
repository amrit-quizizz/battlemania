/**
 * Damage Configuration
 * 
 * Contains all damage-related parameters including damage type values,
 * visual feedback settings, and health bar styling.
 */

export enum DamageType {
  HIGH = 30,
  MEDIUM = 15,
  LOW = 5
}

export interface DamageConfig {
  /** Damage type values */
  damageTypes: {
    /** High damage value */
    high: number
    /** Medium damage value */
    medium: number
    /** Low damage value */
    low: number
  }
  
  /** Visual feedback settings */
  visualFeedback: {
    /** Animation duration for damage indicators (ms) */
    damageIndicatorDuration: number
    /** Animation duration for health bar updates (ms) */
    healthBarUpdateDuration: number
    /** Colors for damage types */
    damageColors: {
      high: string
      medium: string
      low: string
    }
  }
  
  /** Health bar styling */
  healthBar: {
    /** 3D health bar dimensions [width, height, depth] */
    dimensions3D: [number, number, number]
    /** 3D health bar position offset above tank [x, y, z] */
    positionOffset3D: [number, number, number]
    /** Health bar colors */
    colors: {
      /** Full health color */
      full: string
      /** Medium health color */
      medium: string
      /** Low health color */
      low: string
      /** Background color */
      background: string
    }
    /** Emissive intensity for 3D health bar */
    emissiveIntensity: number
  }
}

/**
 * Default damage configuration
 * All values are mutable and can be changed at runtime
 */
export const damageConfig: DamageConfig = {
  damageTypes: {
    high: DamageType.HIGH,
    medium: DamageType.MEDIUM,
    low: DamageType.LOW
  },
  visualFeedback: {
    damageIndicatorDuration: 1500,
    healthBarUpdateDuration: 300,
    damageColors: {
      high: '#ff0000',
      medium: '#ffaa00',
      low: '#ff8800'
    }
  },
  healthBar: {
    dimensions3D: [1.2, 0.1, 0.15],
    positionOffset3D: [0, 1.2, 0],
    colors: {
      full: '#00ff00',
      medium: '#ffff00',
      low: '#ff0000',
      background: '#333333'
    },
    emissiveIntensity: 0.6
  }
}
