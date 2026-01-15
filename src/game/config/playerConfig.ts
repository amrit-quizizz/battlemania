/**
 * Player Configuration
 * 
 * Contains all player-related game parameters including starting positions,
 * movement speeds, health, team colors, and visual indicators.
 */

export interface PlayerConfig {
  /** Starting position for player 1 (left side) */
  player1StartPosition: { x: number; y: number; z: number }
  
  /** Starting position for player 2 (right side) */
  player2StartPosition: { x: number; y: number; z: number }
  
  /** Starting rotation for player 1 (radians) */
  player1StartRotation: number
  
  /** Starting rotation for player 2 (radians) */
  player2StartRotation: number
  
  /** Initial health for both players */
  initialHealth: number
  
  /** Movement speed for forward/backward movement (units per frame) */
  moveSpeed: number
  
  /** Rotation speed for tank rotation (radians per frame) */
  rotationSpeed: number
  
  /** Horizontal movement speed for side-scrolling mode (units per frame) */
  horizontalMoveSpeed: number
  
  /** Jump impulse force applied when player jumps (units) */
  jumpImpulse: number
  
  /** Team color for player 1 (blue) */
  player1Color: string
  
  /** Team color for player 2 (red) */
  player2Color: string
  
  /** Position offset for team indicator bar above tank [x, y, z] */
  teamIndicatorPosition: [number, number, number]
  
  /** Geometry dimensions for team indicator bar [width, height, depth] */
  teamIndicatorGeometry: [number, number, number]
  
  /** Emissive intensity for team indicator (0-1) */
  teamIndicatorEmissiveIntensity: number
  
  /** Alternative team indicator positions used in different scenes */
  teamIndicatorPositions: {
    /** Standard position */
    standard: [number, number, number]
    /** Elevated position */
    elevated: [number, number, number]
    /** Lower position */
    lower: [number, number, number]
  }
  
  /** Alternative team indicator geometries */
  teamIndicatorGeometries: {
    /** Standard size */
    standard: [number, number, number]
    /** Smaller size */
    small: [number, number, number]
    /** Label size */
    label: [number, number, number]
  }
}

/**
 * Default player configuration
 * All values are mutable and can be changed at runtime
 */
export const playerConfig: PlayerConfig = {
  player1StartPosition: { x: -15, y: 1, z: 0 },
  player2StartPosition: { x: 15, y: 1, z: 0 },
  player1StartRotation: 0,
  player2StartRotation: Math.PI,
  initialHealth: 100,
  moveSpeed: 0.1,
  rotationSpeed: 0.05,
  horizontalMoveSpeed: 1.5,
  jumpImpulse: 0.8,
  player1Color: '#0066ff',
  player2Color: '#ff0066',
  teamIndicatorPosition: [0, 3, 0],
  teamIndicatorGeometry: [2, 0.3, 0.3],
  teamIndicatorEmissiveIntensity: 0.5,
  teamIndicatorPositions: {
    standard: [0, 3, 0],
    elevated: [0, 2.5, 0],
    lower: [0, 2, 0]
  },
  teamIndicatorGeometries: {
    standard: [2, 0.3, 0.3],
    small: [1.5, 0.2, 0.2],
    label: [1.2, 0.4, 0.1]
  }
}
