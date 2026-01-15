/**
 * Camera Configuration
 * 
 * Contains all camera-related parameters including positions, FOV,
 * zoom, rotation, and rendering settings.
 */

export interface CameraConfig {
  /** Orthographic camera configuration for top-down view */
  orthographic: {
    /** Camera position [x, y, z] */
    position: [number, number, number]
    /** Camera zoom level */
    zoom: number
    /** Camera rotation [x, y, z] in radians */
    rotation: [number, number, number]
    /** Near clipping plane */
    near: number
    /** Far clipping plane */
    far: number
  }
  
  /** Perspective camera configuration for side-scrolling view */
  perspective: {
    /** Camera position [x, y, z] */
    position: [number, number, number]
    /** Field of view in degrees */
    fov: number
    /** Near clipping plane */
    near: number
    /** Far clipping plane */
    far: number
  }
  
  /** Device pixel ratio for rendering [min, max] */
  dpr: [number, number]
  
  /** Canvas rendering settings */
  canvas: {
    /** Enable antialiasing */
    antialias: boolean
    /** Enable alpha channel */
    alpha: boolean
    /** Image rendering mode */
    imageRendering: 'pixelated' | 'auto'
  }
}

/**
 * Default camera configuration
 * All values are mutable and can be changed at runtime
 */
export const cameraConfig: CameraConfig = {
  orthographic: {
    position: [0, 25, 20],
    zoom: 20,
    rotation: [-0.8, 0, 0],
    near: 0.1,
    far: 1000
  },
  perspective: {
    position: [0, -2.5, 9],
    fov: 60,
    near: 0.1,
    far: 100
  },
  dpr: [1, 2],
  canvas: {
    antialias: false,
    alpha: false,
    imageRendering: 'pixelated'
  }
}
