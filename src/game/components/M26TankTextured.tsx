import { useRef, useMemo } from 'react'
import { Group, Mesh, MeshStandardMaterial, Box3, Vector3, TextureLoader } from 'three'
import { useFrame, useLoader } from '@react-three/fiber'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'

interface M26TankTexturedProps {
  position: [number, number, number]
  rotation: number
  color: string
  player: 'player1' | 'player2'
}

function M26TankTextured({ position, rotation, color, player }: M26TankTexturedProps) {
  const groupRef = useRef<Group>(null)

  // Load textures
  const mainTexture = useLoader(TextureLoader, '/models/m26.png')

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

    // Scale the model appropriately
    const desiredSize = 8 // Large size for visibility
    const maxDimension = Math.max(size.x, size.y, size.z)
    const scale = desiredSize / maxDimension
    cloned.scale.multiplyScalar(scale)

    // Apply materials, textures and team colors to all meshes
    cloned.traverse((child) => {
      if ((child as any).isMesh) {
        const mesh = child as Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true

        // Create new material with texture
        const newMat = new MeshStandardMaterial({
          map: mainTexture,
          metalness: 0.3,
          roughness: 0.6,
        })

        // Apply team colors
        if (player === 'player1') {
          // Blue team tint
          newMat.color.setRGB(0.7, 0.8, 1.0)
          newMat.emissive.setHex(0x0033aa)
          newMat.emissiveIntensity = 0.1
        } else {
          // Red team tint
          newMat.color.setRGB(1.0, 0.7, 0.7)
          newMat.emissive.setHex(0xaa3300)
          newMat.emissiveIntensity = 0.1
        }

        mesh.material = newMat
      }
    })

    return cloned
  }, [obj, player, mainTexture])

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

      {/* Player indicator above tank */}
      <mesh position={[0, 5, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 8]} />
        <meshStandardMaterial
          color={player === 'player1' ? '#0066ff' : '#ff6600'}
          emissive={player === 'player1' ? '#0066ff' : '#ff6600'}
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  )
}

export default M26TankTextured