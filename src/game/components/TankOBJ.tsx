import { useRef, useMemo } from 'react'
import { Group, Mesh, MeshStandardMaterial, Box3, Vector3 } from 'three'
import { useFrame, useLoader } from '@react-three/fiber'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'

interface TankOBJProps {
  position: [number, number, number]
  rotation: number
  color: string
  player: 'player1' | 'player2'
}

function TankOBJ({ position, rotation, color, player }: TankOBJProps) {
  const groupRef = useRef<Group>(null)

  // Load materials and OBJ
  const materials = useLoader(MTLLoader, '/models/tank/TigerII.mtl')
  const obj = useLoader(OBJLoader, '/models/tank/TigerII.obj', (loader) => {
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

    // Scale the model
    const desiredSize = 6 // Good size for visibility
    const maxDimension = Math.max(size.x, size.y, size.z)
    const scale = desiredSize / maxDimension
    cloned.scale.multiplyScalar(scale)

    // Apply materials and shadows to all meshes
    cloned.traverse((child) => {
      if ((child as any).isMesh) {
        const mesh = child as Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true

        // Enhance materials
        if (mesh.material) {
          const mat = mesh.material as MeshStandardMaterial
          if (mat.clone) {
            mesh.material = mat.clone()
            const newMat = mesh.material as MeshStandardMaterial

            // Better material properties
            newMat.metalness = 0.3
            newMat.roughness = 0.7

            // Add team color tint
            if (player === 'player1') {
              newMat.color.setHex(0x4466ff) // Blue team
              newMat.emissive.setHex(0x000044)
              newMat.emissiveIntensity = 0.1
            } else {
              newMat.color.setHex(0xff6644) // Red team
              newMat.emissive.setHex(0x440000)
              newMat.emissiveIntensity = 0.1
            }
          }
        }
      }
    })

    return cloned
  }, [obj, player])

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

      {/* Player indicator */}
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[0.8, 0.15, 0.8]} />
        <meshStandardMaterial
          color={player === 'player1' ? '#00ff00' : '#ffff00'}
          emissive={player === 'player1' ? '#00ff00' : '#ffff00'}
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  )
}

export default TankOBJ