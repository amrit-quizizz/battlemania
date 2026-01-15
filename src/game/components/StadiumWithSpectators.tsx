import { Suspense } from 'react'
import { RigidBody } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import { modelScalesConfig } from '../config/gameConfig'
import { Spectators } from './Spectators'
import * as THREE from 'three'

const MODELS = {
  stadiumSeats: '/src/game/assets/3d models/environment/Stadium Seats.glb'
}

// Safe model loader
function SafeModel({ modelPath, scale = 1 }: { modelPath: string, scale?: number | number[] }) {
  let scene: THREE.Object3D | null = null
  try {
    const gltf = useGLTF(modelPath)
    scene = gltf.scene.clone()
    
    // Enable shadows for all meshes
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  } catch (error) {
    console.warn(`Failed to load model ${modelPath}, using fallback:`, error)
  }
  
  if (scene) {
    return <primitive object={scene} scale={scale} />
  }
  
  // Fallback mesh
  const size = typeof scale === 'number' ? scale : 1
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[size * 2, size, size * 3]} />
      <meshStandardMaterial color="#4a5568" />
    </mesh>
  )
}

interface StadiumWithSpectatorsProps {
  /** Stadium position [x, y, z] */
  position: [number, number, number]
  /** Stadium rotation [x, y, z] in radians */
  rotation?: [number, number, number]
  /** Stadium scale */
  scale?: number
  /** Rendering dimensions [width, height, depth] */
  dimensions: [number, number, number]
  /** Road Y position for relative positioning */
  roadY?: number
}

/**
 * Combined component that renders stadium seats with spectators
 * Receives rendering dimensions as props for proper scaling and positioning
 */
export function StadiumWithSpectators({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  dimensions,
  roadY = 0
}: StadiumWithSpectatorsProps) {
  const stadiumScale = scale || modelScalesConfig.buildings.stadiumSeats

  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/afe67715-8fe3-4e25-ba74-9e370898c825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StadiumWithSpectators.tsx:68',message:'Stadium setup',data:{position,rotation,scale:stadiumScale,dimensions,colliderType:'trimesh'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // Calculate platform position above stadium
  // Platform should be high enough above the top stair level
  const platformHeight = dimensions[1] + 0.5 // Above the stadium height
  const platformY = position[1] + platformHeight
  const platformWidth = dimensions[0] * 1.2 // Slightly wider than stadium
  const platformDepth = dimensions[2] * 1.2 // Slightly deeper than stadium

  return (
    <>
      {/* Stadium Seats with RigidBody */}
      <RigidBody 
        type="fixed" 
        position={position} 
        rotation={rotation} 
        colliders="trimesh"
      >
        <Suspense fallback={null}>
          <SafeModel 
            modelPath={MODELS.stadiumSeats} 
            scale={stadiumScale} 
          />
        </Suspense>
      </RigidBody>

      {/* Platform mesh above stadium for spectators to fall from - sensor so they pass through */}
      <RigidBody 
        type="fixed" 
        position={[position[0], platformY, position[2]]} 
        rotation={rotation}
        colliders="cuboid"
        sensor // Non-solid, spectators can pass through
      >
        <mesh 
          visible={false} // Invisible platform
          receiveShadow
        >
          <boxGeometry args={[platformWidth, 0.1, platformDepth]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>

      {/* Spectators - positioned on platform, will fall onto seats */}
      <Spectators
        stadiumPosition={position}
        stadiumRotation={rotation}
        stadiumScale={stadiumScale}
        dimensions={dimensions}
        platformY={platformY}
      />
    </>
  )
}
