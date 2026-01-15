/**
 * Model Scales Configuration
 * 
 * Contains scale factors for all 3D models used in the game.
 * Scales are relative multipliers applied to model geometry.
 */

export interface ModelScalesConfig {
  /** Tank model scales */
  tank: {
    /** Standard tank scale */
    standard: number
    /** Small tank scale */
    small: number
    /** Medium tank scale */
    medium: number
    /** Large tank scale */
    large: number
    /** Extra large tank scale */
    extraLarge: number
  }
  
  /** Cloud model scales */
  cloud: {
    /** Large cloud scale */
    large: number
    /** Medium cloud scale */
    medium: number
    /** Small cloud scale */
    small: number
  }
  
  /** Sun model scale */
  sun: {
    /** Standard sun scale */
    standard: number
    /** Large sun scale */
    large: number
    /** Small sun scale */
    small: number
  }
  
  /** Ground model scale */
  ground: number
  
  /** Road model scales */
  road: {
    /** Road bits scale */
    bits: number
    /** Path straight scale [x, y, z] */
    pathStraight: [number, number, number]
  }
  
  /** Building model scales */
  buildings: {
    /** Skyscraper scale */
    skyscraper: number
    /** Large building scale */
    largeBuilding: number
    /** Castle scale */
    castle: number
    /** Barracks scale */
    barracks: number
    /** Fortress scale */
    fortress: number
    /** Turret gun scale */
    turretGun: number
    /** Stadium seats scale */
    stadiumSeats: number
    /** Alternative building scales */
    alternatives: {
      small: number
      medium: number
      large: number
    }
  }
  
  /** Character model scales */
  characters: {
    /** Soldier scale */
    soldier: number
    /** Adventurer scale */
    adventurer: number
    /** Alternative character scales */
    alternatives: {
      standard: number
      small: number
      medium: number
      large: number
      extraLarge: number
    }
  }
  
  /** Bullet model scale */
  bullet: {
    /** Standard bullet scale */
    standard: number
    /** Small bullet scale */
    small: number
  }
  
  /** Vehicle model scales */
  vehicles: {
    /** Truck scale */
    truck: number
    /** Vehicle base scale */
    base: number
  }
  
  /** Tree model scales */
  tree: {
    /** Standard tree scale */
    standard: number
    /** Large tree scale */
    large: number
  }
  
  /** Billboard model scale */
  billboard: number
  
  /** Tank model multiplier for battle scene */
  tankBattleMultiplier: number
}

/**
 * Default model scales configuration
 * All values are mutable and can be changed at runtime
 */
export const modelScalesConfig: ModelScalesConfig = {
  tank: {
    standard: 0.2,
    small: 0.2,
    medium: 0.4,
    large: 0.5,
    extraLarge: 1.5
  },
  cloud: {
    large: 18,
    medium: 0.8,
    small: 0.6
  },
  sun: {
    standard: 1,
    large: 1.5,
    small: 0.6
  },
  ground: 0.5,
  road: {
    bits: 2.0,
    pathStraight: [40, 8, 5]
  },
  buildings: {
    skyscraper: 2.5,
    largeBuilding: 2.5,
    castle: 1.8,
    barracks: 1.2,
    fortress: 1.5,
    turretGun: 2.2,
    stadiumSeats: 0.27,
    alternatives: {
      small: 0.5,
      medium: 0.7,
      large: 0.9
    }
  },
  characters: {
    soldier: 1.5,
    adventurer: 1.5,
    alternatives: {
      standard: 1.5,
      small: 1.3,
      medium: 1.4,
      large: 1.5,
      extraLarge: 1.8
    }
  },
  bullet: {
    standard: 0.08,
    small: 0.1
  },
  vehicles: {
    truck: 0.4,
    base: 0.45
  },
  tree: {
    standard: 0.4,
    large: 1.5
  },
  billboard: 0.5,
  tankBattleMultiplier: 2.5
}
