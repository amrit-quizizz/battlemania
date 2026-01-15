/**
 * UI Configuration
 * 
 * Contains all user interface-related parameters including HUD positions,
 * font sizes, colors, shadows, and container dimensions.
 */

export interface UIConfig {
  /** HUD overlay positions */
  hud: {
    /** Top-left HUD position */
    topLeft: {
      top: string
      left: string
    }
    /** Top-right HUD position */
    topRight: {
      top: string
      right: string
    }
  }
  
  /** Font configuration */
  fonts: {
    /** Title font size */
    titleSize: string
    /** Subtitle font size */
    subtitleSize: string
    /** Instruction font size */
    instructionSize: string
    /** Standard font size */
    standardSize: string
    /** Font weight for titles */
    titleWeight: string
    /** Font family */
    family: string
  }
  
  /** Text styling */
  text: {
    /** Text color */
    color: string
    /** Text shadow */
    shadow: string
    /** Alternative text shadow */
    shadowAlternative: string
  }
  
  /** Container dimensions */
  container: {
    /** Main container width percentage */
    width: string
    /** Main container height percentage */
    height: string
    /** Alternative container width */
    widthAlternative: string
    /** Alternative container height */
    heightAlternative: string
    /** Border radius */
    borderRadius: string
    /** Box shadow */
    boxShadow: string
  }
  
  /** Background colors */
  background: {
    /** Main background color */
    main: string
    /** Container background color */
    container: string
  }
  
  /** 3D ScoreCard configuration */
  scoreCard3D: {
    /** Player 1 scorecard position [x, y, z] */
    player1Position: [number, number, number]
    /** Player 2 scorecard position [x, y, z] */
    player2Position: [number, number, number]
    /** Scorecard scale */
    scale: number
    /** Team names */
    teamNames: {
      player1: string
      player2: string
    }
    /** Model path for the cutting board background */
    modelPath: string
    /** Board 3D model settings */
    board: {
      /** Scale for the 3D model [x, y, z] */
      scale: [number, number, number]
      /** Rotation for the 3D model [x, y, z] in radians */
      rotation: [number, number, number]
      /** Position offset [x, y, z] */
      position: [number, number, number]
    }
    /** Fallback board settings when model fails to load */
    fallback: {
      /** Geometry dimensions [width, height, depth] */
      geometry: [number, number, number]
      /** Material color */
      color: string
      /** Material roughness */
      roughness: number
      /** Material metalness */
      metalness: number
    }
    /** Animation settings */
    animation: {
      /** Floating animation speed */
      speed: number
      /** Floating animation amplitude */
      amplitude: number
    }
    /** Text Z offset (distance from board surface) */
    textZOffset: number
    /** Google Font URL for text rendering */
    fontUrl: string
    /** Player name text settings */
    playerName: {
      /** Y position offset */
      yOffset: number
      /** Font size */
      fontSize: number
      /** Stroke width to make text appear bolder */
      strokeWidth: number
      /** Shadow settings */
      shadow: {
        enabled: boolean
        color: string
        offsetX: number
        offsetY: number
        offsetZ: number
      }
    }
    /** Score text settings */
    score: {
      /** Show score */
      show: boolean
      /** X position offset */
      xOffset: number
      /** Y position offset */
      yOffset: number
      /** Font size */
      fontSize: number
      /** Text color */
      color: string
      /** Outline width */
      outlineWidth: number
      /** Outline color */
      outlineColor: string
    }
    /** Health bar settings */
    healthBar: {
      /** X position offset */
      xOffset: number
      /** Y position offset */
      yOffset: number
      /** Bar width */
      width: number
      /** Bar height */
      height: number
      /** Bar depth */
      depth: number
      /** Padding inside border */
      padding: number
      /** Background color */
      backgroundColor: string
      /** Border color */
      borderColor: string
      /** Border width */
      borderWidth: number
      /** Health colors based on percentage thresholds */
      colors: {
        high: string
        medium: string
        low: string
      }
      /** Label settings */
      label: {
        /** Show HP label */
        show: boolean
        /** Font size */
        fontSize: number
        /** Color */
        color: string
        /** Outline width */
        outlineWidth: number
        /** Outline color */
        outlineColor: string
      }
    }
    /** Trophy indicator settings */
    trophy: {
      /** Show trophy */
      show: boolean
      /** X position offset */
      xOffset: number
      /** Y position offset */
      yOffset: number
      /** Font size */
      fontSize: number
      /** Color */
      color: string
      /** Trophy emoji/symbol */
      symbol: string
    }
  }
}

/**
 * Default UI configuration
 * All values are mutable and can be changed at runtime
 */
export const uiConfig: UIConfig = {
  hud: {
    topLeft: {
      top: '20px',
      left: '20px'
    },
    topRight: {
      top: '20px',
      right: '20px'
    }
  },
  fonts: {
    titleSize: '24px',
    subtitleSize: '18px',
    instructionSize: '14px',
    standardSize: '16px',
    titleWeight: 'bold',
    family: 'monospace'
  },
  text: {
    color: 'white',
    shadow: '2px 2px 4px rgba(0,0,0,0.8)',
    shadowAlternative: '2px 2px 4px rgba(0,0,0,0.5)'
  },
  container: {
    width: '85%',
    height: '85%',
    widthAlternative: '75%',
    heightAlternative: '75%',
    borderRadius: '10px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
  },
  background: {
    main: '#2a2a2a',
    container: '#87CEEB'
  },
  scoreCard3D: {
    player1Position: [-5, 0, 2],
    player2Position: [5, 0, 2],
    scale: 0.8,
    teamNames: {
      player1: 'TEAM A',
      player2: 'TEAM B'
    },
    modelPath: '/src/3d-game/assets/3d models/environment/Cutting Board.glb',
    board: {
      scale: [4, 4, 4],
      rotation: [Math.PI/2, Math.PI/2, 0],
      position: [0, 0, 0]
    },
    fallback: {
      geometry: [3.5, 2.2, 0.15],
      color: '#c4956a',
      roughness: 0.8,
      metalness: 0.1
    },
    animation: {
      speed: 0.8,
      amplitude: 0.04
    },
    textZOffset: 0.2,
    /** Orbitron font served locally (TTF format required for drei Text) */
    fontUrl: '/fonts/Orbitron-Bold.ttf',
    playerName: {
      yOffset: 0.35,
      fontSize: 0.46,
      /** Stroke/outline to make text appear bolder */
      strokeWidth: 0.012,
      /** Shadow settings for text */
      shadow: {
        enabled: true,
        color: '#000000',
        offsetX: 0.05,
        offsetY: -0.03,
        offsetZ: -0.02
      }
    },
    /** Score display - hidden */
    score: {
      show: false,
      xOffset: 0,
      yOffset: 1,
      fontSize: 1,
      color: '#ffffff',
      outlineWidth: 0.03,
      outlineColor: '#000000'
    },
    /** Health bar - full width with padding */
    healthBar: {
      xOffset: 0,
      yOffset: -0.25,
      width: 1.8,
      height: 0.3,
      depth: 0.08,
      padding: 0.15,
      backgroundColor: '#2a2a2a',
      borderColor: '#000000',
      borderWidth: 0.04,
      colors: {
        high: '#22c55e',
        medium: '#eab308',
        low: '#dc2626'
      },
      label: {
        show: false,
        fontSize: 0.14,
        color: '#ffffff',
        outlineWidth: 0.015,
        outlineColor: '#000000'
      }
    },
    /** Trophy indicator - hidden */
    trophy: {
      show: false,
      xOffset: -1.0,
      yOffset: 0.35,
      fontSize: 0.28,
      color: '#fbbf24',
      symbol: '★'
    }
  }
}
