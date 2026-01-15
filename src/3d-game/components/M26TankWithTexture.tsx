import { useRef, useMemo } from 'react'
import { Group, Mesh, Box3, Vector3, MeshStandardMaterial, TextureLoader } from 'three'
import { useFrame, useLoader } from '@react-three/fiber'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'

interface M26TankWithTextureProps {
  position: [number, number, number]
  rotation: number
  color: string
  player: 'player1' | 'player2'
}

function M26TankWithTexture({ position, rotation, color, player }: M26TankWithTextureProps) {
  const groupRef = useRef<Group>(null)

  // Load textures
  const texture = useLoader(TextureLoader, '/models/m26.png')

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

    // Apply texture and shadows
    cloned.traverse((child) => {
      if ((child as any).isMesh) {
        const mesh = child as Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true

        // Apply texture to the material
        if (mesh.material) {
          const newMat = new MeshStandardMaterial({
            map: texture,
            metalness: 0.3,
            roughness: 0.7,
          })
          mesh.material = newMat
        }
      }
    })

    return cloned
  }, [obj, texture])

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

      {/* Player label - P1 or P2 */}
      <mesh position={[0, 6.8, 0]}>
        <boxGeometry args={[1.5, 0.3, 0.1]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={player === 'player1' ? '#0066ff' : '#ff0066'}
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  )
}

export default M26TankWithTexture