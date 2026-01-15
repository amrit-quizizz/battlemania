/**
 * Environment Configuration
 * 
 * Contains all environment-related parameters including fog, sky,
 * terrain, platforms, roads, and world boundaries.
 */

export interface EnvironmentConfig {
  /** Fog configuration */
  fog: {
    /** Fog color (hex) */
    color: string
    /** Fog near distance */
    near: number
    /** Fog far distance */
    far: number
  }
  
  /** Sky colors */
  sky: {
    /** Primary sky color (hex) */
    primaryColor: string
    /** Secondary sky color for depth layers (hex) */
    secondaryColor: string
  }
  
  /** Sky plane geometry */
  skyPlanes: {
    /** Main sky plane position [x, y, z] */
    mainPosition: [number, number, number]
    /** Main sky plane size [width, height] */
    mainSize: [number, number]
    /** Additional sky layer position [x, y, z] */
    layerPosition: [number, number, number]
    /** Additional sky layer size [width, height] */
    layerSize: [number, number]
    /** Additional sky layer opacity (0-1) */
    layerOpacity: number
  }
  
  /** Road configuration */
  road: {
    /** Road Y position (vertical position) */
    yPosition: number
    /** Number of road segments */
    segmentCount: number
    /** Spacing between road segments */
    segmentSpacing: number
    /** Ground below road dimensions [width, height, depth] */
    groundDimensions: [number, number, number]
    /** Ground material color */
    groundColor: string
  }
  
  /** Main platform dimensions */
  platform: {
    /** Main platform position [x, y, z] */
    mainPosition: [number, number, number]
    /** Main platform size [width, height, depth] */
    mainSize: [number, number, number]
    /** Main platform color */
    mainColor: string
    /** Elevated platform size [width, height, depth] */
    elevatedSize: [number, number, number]
    /** Elevated platform height offset */
    elevatedHeight: number
    /** Central obstacle size [width, height, depth] */
    obstacleSize: [number, number, number]
    /** Central obstacle height offset */
    obstacleHeight: number
    /** Cover object size [width, height, depth] */
    coverSize: [number, number, number]
    /** Cover object height offset */
    coverHeight: number
    /** Platform colors */
    colors: {
      elevated: string
      obstacle: string
      cover: string
    }
  }
  
  /** Ground terrain configuration */
  terrain: {
    /** Main ground position [x, y, z] */
    mainPosition: [number, number, number]
    /** Main ground size [width, height, depth] */
    mainSize: [number, number, number]
    /** Main ground color */
    mainColor: string
    /** Road section count */
    roadSectionCount: number
    /** Road section spacing */
    roadSectionSpacing: number
    /** Hill positions and sizes */
    hills: Array<{
      position: [number, number, number]
      radius: number
      segments: number
      color: string
    }>
  }
  
  /** World boundary walls */
  boundaries: {
    /** Wall thickness */
    thickness: number
    /** Wall height */
    height: number
    /** Left wall X position */
    leftX: number
    /** Right wall X position */
    rightX: number
    /** Front wall Z position */
    frontZ: number
    /** Back wall Z position */
    backZ: number
    /** Wall width (for front/back walls) */
    wallWidth: number
    /** Wall depth (for left/right walls) */
    wallDepth: number
    /** Wall color */
    color: string
  }
  
  /** Scene element positions */
  scenePositions: {
    /** Sun position and fallback */
    sun: {
      position: [number, number, number]
      fallbackRadius: number
    }
    /** Building positions relative to roadY */
    buildings: {
      skyscraperLeft: { offset: [number, number, number] }
      largeBuildingLeft: { offset: [number, number, number] }
      largeBuildingRight: { offset: [number, number, number] }
      skyscraperRight: { offset: [number, number, number] }
    }
    /** Stadium configuration */
    stadium: {
      offset: [number, number, number]
      rotation: [number, number, number]
      dimensions: [number, number, number]
    }
    /** Billboard position relative to roadY */
    billboard: {
      offset: [number, number, number]
      rotation: [number, number, number]
    }
    /** Turret positions relative to roadY */
    turrets: {
      turret1: { offset: [number, number, number]; rotation: [number, number, number] }
      turret2: { offset: [number, number, number]; rotation: [number, number, number] }
    }
    /** Tank spawn positions relative to roadY */
    tanks: {
      player1: { offset: [number, number, number] }
      player2: { offset: [number, number, number] }
    }
  }
  
  /** Fallback geometries for loading states */
  fallbacks: {
    /** Road segment fallback [width, height, depth] */
    roadSegment: [number, number, number]
    /** Cloud fallback */
    cloud: {
      radius: number
      segments: number
      color: string
      opacity: number
    }
    /** Cloud small fallback */
    cloudSmall: {
      radius: number
      segments: number
      color: string
      opacity: number
    }
  }
}

/**
 * Default environment configuration
 * All values are mutable and can be changed at runtime
 */
export const environmentConfig: EnvironmentConfig = {
  fog: {
    color: '#87CEEB',
    near: 50,
    far: 100
  },
  sky: {
    primaryColor: '#87CEEB',
    secondaryColor: '#B0E0E6'
  },
  skyPlanes: {
    mainPosition: [0, 0, -5],
    mainSize: [500, 1000],
    layerPosition: [0, 15, -10],
    layerSize: [300, 280],
    layerOpacity: 0.4
  },
  road: {
    yPosition: -5.8,
    segmentCount: 10,
    segmentSpacing: 3.0,
    groundDimensions: [35, 1, 12],
    groundColor: '#8B7355'
  },
  platform: {
    mainPosition: [0, -1, 0],
    mainSize: [60, 2, 60],
    mainColor: '#8B7355',
    elevatedSize: [12, 5, 12],
    elevatedHeight: 1.5,
    obstacleSize: [8, 6, 8],
    obstacleHeight: 2,
    coverSize: [4, 4, 4],
    coverHeight: 1,
    colors: {
      elevated: '#A0826D',
      obstacle: '#696969',
      cover: '#7A7A7A'
    }
  },
  terrain: {
    mainPosition: [0, -2, 0],
    mainSize: [200, 4, 20],
    mainColor: '#654321',
    roadSectionCount: 10,
    roadSectionSpacing: 10,
    hills: [
      {
        position: [-20, -1, -10],
        radius: 8,
        segments: 16,
        color: '#8B7355'
      },
      {
        position: [30, -1, -12],
        radius: 10,
        segments: 16,
        color: '#8B7355'
      }
    ]
  },
  boundaries: {
    thickness: 2,
    height: 12,
    leftX: -31,
    rightX: 31,
    frontZ: -31,
    backZ: 31,
    wallWidth: 62,
    wallDepth: 62,
    color: '#505050'
  },
  scenePositions: {
    sun: {
      position: [7, 3.5, -8],
      fallbackRadius: 0.8
    },
    buildings: {
      skyscraperLeft: { offset: [-7.5, 1, -1] },
      largeBuildingLeft: { offset: [-4, 0.8, -2] },
      largeBuildingRight: { offset: [3.9, 1, -2] },
      skyscraperRight: { offset: [8, 0.8, -1] }
    },
    stadium: {
      offset: [0, 2, 0],
      rotation: [0, Math.PI, 0],
      dimensions: [2.0, 0.6, 1.5]
    },
    billboard: {
      offset: [-0.2, 0.5, -5],
      rotation: [0, 0, 0]
    },
    turrets: {
      turret1: { offset: [-3.5, 0.5, -3.2], rotation: [0, Math.PI / 2, 0] },
      turret2: { offset: [3.5, 0.5, 5.3], rotation: [0, -Math.PI / 2, 0] }
    },
    tanks: {
      player1: { offset: [-4.5, 2.5, 2.5] },
      player2: { offset: [4.5, 2.5, 2.5] }
    }
  },
  fallbacks: {
    roadSegment: [3.5, 2, 10],
    cloud: {
      radius: 2,
      segments: 16,
      color: '#ffffff',
      opacity: 0.7
    },
    cloudSmall: {
      radius: 1.4,
      segments: 16,
      color: '#ffffff',
      opacity: 1
    }
  }
}
