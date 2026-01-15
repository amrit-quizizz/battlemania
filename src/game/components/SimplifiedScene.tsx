import { useRef, useState, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Simplified tank component
function Tank({ position, color }: { position: [number, number, number], color: string }) {
  const tankRef = useRef<RapierRigidBody>(null)

  // Try to load the tank model, fall back to a box if it fails
  let tankModel = null
  try {
    const { scene } = useGLTF('/models/Tank.glb')
    tankModel = scene
  } catch (error) {
    console.log('Tank model not loaded, using fallback')
  }

  return (
    <RigidBody
      ref={tankRef}
      position={position}
      type="kinematicPosition"
    >
      {tankModel ? (
        <primitive object={tankModel.clone()} scale={1.5} />
      ) : (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 1, 3]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
    </RigidBody>
  )
}

function SimplifiedScene() {
  const [playerPos, setPlayerPos] = useState(0)
  const keysPressed = useRef<Set<string>>(new Set())

  // Handle keyboard input
  useFrame(() => {
    let moveX = 0
    if (keysPressed.current.has('a')) moveX = -0.1
    if (keysPressed.current.has('d')) moveX = 0.1

    if (moveX !== 0) {
      setPlayerPos(prev => prev + moveX)
    }
  })

  // Setup keyboard listeners
  useState(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase())
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase())
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  })

  return (
    <>
      {/* Ground */}
      <RigidBody type="fixed" position={[0, -2, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[100, 4, 20]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
      </RigidBody>

      {/* Sky backdrop */}
      <mesh position={[0, 20, -30]}>
        <planeGeometry args={[200, 100]} />
        <meshBasicMaterial color="#87CEEB" />
      </mesh>

      {/* Sun */}
      <mesh position={[30, 30, -20]}>
        <sphereGeometry args={[5]} />
        <meshBasicMaterial color="#FFD700" />
      </mesh>

      {/* Player Tank */}
      <group position={[playerPos, 0, 0]}>
        <Tank position={[0, 0, 0]} color="#0066ff" />
        {/* Player indicator */}
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[2, 0.3, 0.3]} />
          <meshStandardMaterial
            color="#0066ff"
            emissive="#0066ff"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* Enemy Tank */}
      <Tank position={[20, 0, 0]} color="#ff0066" />

      {/* Simple buildings */}
      {[...Array(5)].map((_, i) => (
        <RigidBody key={`building-${i}`} type="fixed" position={[(i - 2) * 15, 2, -10]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[4, 8, 4]} />
            <meshStandardMaterial color="#888888" />
          </mesh>
        </RigidBody>
      ))}

      {/* Trees */}
      {[...Array(8)].map((_, i) => (
        <group key={`tree-${i}`} position={[(i - 4) * 10, 0, -8]}>
          {/* Trunk */}
          <mesh castShadow>
            <cylinderGeometry args={[0.5, 0.7, 4]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          {/* Leaves */}
          <mesh position={[0, 3, 0]} castShadow>
            <sphereGeometry args={[2]} />
            <meshStandardMaterial color="#228B22" />
          </mesh>
        </group>
      ))}

      {/* Lighting */}
      <pointLight position={[30, 30, -20]} intensity={2} color="#ffaa00" />
    </>
  )
}

export default SimplifiedScene