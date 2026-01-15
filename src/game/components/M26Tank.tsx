import { useRef, useMemo } from 'react'
import { Group, Mesh, Box3, Vector3 } from 'three'
import { useFrame, useLoader } from '@react-three/fiber'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'

interface M26TankProps {
  position: [number, number, number]
  rotation: number
  color: string
  player: 'player1' | 'player2'
}

function M26Tank({ position, rotation, color, player }: M26TankProps) {
  const groupRef = useRef<Group>(null)

  // Load materials and OBJ
  const materials = useLoader(MTLLoader, '/models/m26.mtl')
  const obj = useLoader(OBJLoader, '/models/m26.obj', (loader) => {
    materials.preload()
    loader.setMaterials(materials)
  })

  // Clone and setup the object
  const scene = useMemo(() => {
    const cloned = obj.clone()

    // Calculate bounds and center the model
    const box = new Box3().setFromObject(cloned)
    const center = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3())

    // Center the model
    cloned.position.sub(center)
    cloned.position.y = 0 // Ensure it sits on ground

    // Scale the model appropriately - BIGGER for better visibility
    const desiredSize = 10 // Large size for visibility
    const maxDimension = Math.max(size.x, size.y, size.z)
    const scale = desiredSize / maxDimension
    cloned.scale.multiplyScalar(scale)

    // Apply shadows but KEEP ORIGINAL MATERIALS AND TEXTURES
    cloned.traverse((child) => {
      if ((child as any).isMesh) {
        const mesh = child as Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        // DO NOT modify materials - keep original textures!
      }
    })

    return cloned
  }, [obj])

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...position)
      groupRef.current.rotation.y = rotation
    }
  })

  return (
    <group ref={groupRef}>
      <group position={[0, 0.5, 0]}>
        <primitive object={scene} />
      </group>

      {/* Team identification bar above tank */}
      <mesh position={[0, 6, 0]}>
        <boxGeometry args={[3, 0.5, 0.5]} />
        <meshStandardMaterial
          color={player === 'player1' ? '#0066ff' : '#ff0066'}
          emissive={player === 'player1' ? '#0066ff' : '#ff0066'}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Player name label */}
      <mesh position={[0, 6.8, 0]}>
        <boxGeometry args={[2, 0.3, 0.1]} />
        <meshStandardMaterial
          color={player === 'player1' ? '#004499' : '#990044'}
          emissive={player === 'player1' ? '#0044aa' : '#aa0044'}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  )
}

export default M26Tank