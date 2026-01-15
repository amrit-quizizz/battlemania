import { useMemo } from 'react'
import { SpectatorFigure } from './SpectatorFigure'
import { spectatorConfig } from '../config/gameConfig'

interface SpectatorsProps {
  /** Stadium position [x, y, z] */
  stadiumPosition: [number, number, number]
  /** Stadium rotation [x, y, z] in radians */
  stadiumRotation: [number, number, number]
  /** Stadium scale */
  stadiumScale: number
  /** Rendering dimensions [width, height, depth] */
  dimensions: [number, number, number]
  /** Platform Y position above stadium */
  platformY: number
}

/**
 * Component that manages multiple spectator figures positioned on stadium seats
 */
export function Spectators({
  stadiumPosition,
  stadiumRotation,
  stadiumScale,
  dimensions,
  platformY
}: SpectatorsProps) {
  const config = spectatorConfig
  const [width, height, depth] = dimensions

  // Generate spectator positions
  const spectatorPositions = useMemo(() => {
    const positions: Array<{
      position: [number, number, number]
      rotation: [number, number, number]
      scale: number
      cheerOffset: number
      team: 'teamA' | 'teamB'
    }> = []

    const { stairLevels } = config.stairs
    const [spacingX, spacingY, spacingZ] = config.positioning.spacing
    const [offsetX, offsetY, offsetZ] = config.positioning.baseOffset

    // Calculate platform dimensions for positioning
    const platformWidth = width > 0 ? width * 1.2 : spacingX * Math.sqrt(config.positioning.count)
    const platformDepth = depth > 0 ? depth * 1.2 : spacingZ * Math.sqrt(config.positioning.count)

    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/afe67715-8fe3-4e25-ba74-9e370898c825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Spectators.tsx:36',message:'Platform positioning config',data:{dimensions:[width,height,depth],platformY,platformWidth,platformDepth,stadiumPosition,spacing:[spacingX,spacingY,spacingZ],baseOffset:[offsetX,offsetY,offsetZ]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (config.positioning.layout === 'grid' && config.positioning.gridDimensions) {
      const [rows, cols] = config.positioning.gridDimensions

      // Calculate grid spacing using config spacing values
      // Use spacing to determine total grid area
      const gridWidth = (cols - 1) * spacingX
      const gridDepth = (rows - 1) * spacingZ
      
      // Center the grid
      const startX = -gridWidth / 2 + offsetX
      const startZ = -gridDepth / 2 + offsetZ

      // Distribute spectators using spacing values
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols && positions.length < config.positioning.count; col++) {
          const localX = startX + col * spacingX
          const localZ = startZ + row * spacingZ
          // Position on platform (slightly above platform surface to ensure they're on top)
          const localY = 0.15

          // Apply stadium rotation to local position
          const cosY = Math.cos(stadiumRotation[1])
          const sinY = Math.sin(stadiumRotation[1])
          const worldX = stadiumPosition[0] + localX * cosY - localZ * sinY
          const worldZ = stadiumPosition[2] + localX * sinY + localZ * cosY
          const worldY = platformY + localY

          // #region agent log
          fetch('http://127.0.0.1:7245/ingest/afe67715-8fe3-4e25-ba74-9e370898c825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Spectators.tsx:77',message:'Spectator position on platform',data:{spectatorIndex:positions.length,row,col,localPosition:[localX,localY,localZ],worldPosition:[worldX,worldY,worldZ],platformY,stadiumPosition},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion

          positions.push({
            position: [worldX, worldY, worldZ],
            rotation: [0, 0, 0], // Always face +z direction
            scale: 1,
            cheerOffset: Math.random(),
            team: Math.random() < 0.5 ? 'teamA' : 'teamB' // Randomly assign to red or blue team
          })
        }
      }
    } else {
      // Random layout - distribute randomly across platform
      for (let i = 0; i < config.positioning.count; i++) {
        // Random horizontal position on platform
        const localX = (Math.random() - 0.5) * platformWidth * 0.8 + offsetX
        const localZ = (Math.random() - 0.5) * platformDepth * 0.8 + offsetZ
        // Position on platform (slightly above platform surface to ensure they're on top)
        const localY = 0.15

        // Apply stadium rotation
        const cosY = Math.cos(stadiumRotation[1])
        const sinY = Math.sin(stadiumRotation[1])
        const worldX = stadiumPosition[0] + localX * cosY - localZ * sinY
        const worldZ = stadiumPosition[2] + localX * sinY + localZ * cosY
        const worldY = platformY + localY

        positions.push({
          position: [worldX, worldY, worldZ],
          rotation: [0, 0, 0], // Always face +z direction
          scale: 0.8 + Math.random() * 0.4, // Slight size variation
          cheerOffset: Math.random(),
          team: Math.random() < 0.5 ? 'teamA' : 'teamB' // Randomly assign to red or blue team
        })
      }
    }

    return positions
  }, [stadiumPosition, stadiumRotation, stadiumScale, dimensions, platformY, config])

  return (
    <>
      {spectatorPositions.map((spec, index) => (
        <SpectatorFigure
          key={`spectator-${index}`}
          position={spec.position}
          rotation={spec.rotation}
          scale={spec.scale}
          cheerOffset={spec.cheerOffset}
          team={spec.team}
        />
      ))}
    </>
  )
}
