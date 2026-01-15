import { useRef, useEffect, useState } from 'react'
import { Group, Mesh } from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import Tank from './Tank' // Fallback to box geometry

interface Tank3DProps {
  position: [number, number, number]
  rotation: number
  color: string
  player: 'player1' | 'player2'
  modelPath?: string
}

function Tank3D({ position, rotation, color, player, modelPath }: Tank3DProps) {
  const groupRef = useRef<Group>(null)
  const turretRef = useRef<Group | Mesh>(null)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [model, setModel] = useState<any>(null)

  // Try to load the 3D model if path is provided
  useEffect(() => {
    if (modelPath) {
      try {
        // Check if the model file exists
        fetch(modelPath, { method: 'HEAD' })
          .then(response => {
            if (response.ok) {
              // File exists, load it
              const gltf = useGLTF(modelPath)
              setModel(gltf)
              setModelLoaded(true)
            }
          })
          .catch(() => {
            console.log(`Model not found at ${modelPath}, using fallback`)
            setModelLoaded(false)
          })
      } catch (error) {
        console.log('Error loading model, using fallback:', error)
        setModelLoaded(false)
      }
    }
  }, [modelPath])

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.set(...position)
      groupRef.current.rotation.y = rotation
    }

    // Animate turret slightly
    if (turretRef.current) {
      turretRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })

  // If we have a 3D model, use it
  if (modelLoaded && model) {
    const tankModel = model.scene.clone()

    // Apply colors and materials to the model
    tankModel.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true

        // Optionally tint the model with player color
        if (child.material) {
          child.material = child.material.clone()
          // You can modify material properties here
          // For example, add a color tint based on player
        }
      }
    })

    return (
      <group ref={groupRef}>
        <primitive
          object={tankModel}
          scale={[0.5, 0.5, 0.5]} // Adjust scale as needed
        />

        {/* Player indicator */}
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[0.5, 0.1, 0.5]} />
          <meshStandardMaterial
            color={player === 'player1' ? '#00ff00' : '#ffff00'}
            emissive={player === 'player1' ? '#00ff00' : '#ffff00'}
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>
    )
  }

  // Fallback to box geometry tank
  return <Tank position={position} rotation={rotation} color={color} player={player} />
}

// Preload function for models
export function preloadTankModel(path: string) {
  try {
    useGLTF.preload(path)
  } catch (error) {
    console.log('Could not preload model:', error)
  }
}

export default Tank3D