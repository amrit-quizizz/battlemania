import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface PlayerTankProps {
  player: 'player1' | 'player2'
  initialPosition: [number, number, number]
  onPositionChange?: (position: [number, number, number]) => void
}

function PlayerTank({ player, initialPosition, onPositionChange }: PlayerTankProps) {
  const tankRef = useRef<RapierRigidBody>(null)
  const { scene } = useGLTF('/models/Tank.glb')
  const keysPressed = useRef<Set<string>>(new Set())
  const velocity = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase())

      // Jump
      if (player === 'player1' && e.key === 'w' && tankRef.current) {
        tankRef.current.applyImpulse({ x: 0, y: 10, z: 0 }, true)
      }
      if (player === 'player2' && e.key === 'ArrowUp' && tankRef.current) {
        tankRef.current.applyImpulse({ x: 0, y: 10, z: 0 }, true)
      }

      // Fire
      if (
        (player === 'player1' && e.key === ' ') ||
        (player === 'player2' && e.key === 'Enter')
      ) {
        fireBullet()
      }
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
  }, [player])

  useFrame(() => {
    if (!tankRef.current) return

    // Horizontal movement
    let moveX = 0
    if (player === 'player1') {
      if (keysPressed.current.has('a')) moveX = -5
      if (keysPressed.current.has('d')) moveX = 5
    } else {
      if (keysPressed.current.has('arrowleft')) moveX = -5
      if (keysPressed.current.has('arrowright')) moveX = 5
    }

    if (moveX !== 0) {
      tankRef.current.setLinvel({ x: moveX, y: tankRef.current.linvel().y, z: 0 }, true)
    }

    // Update position callback
    const position = tankRef.current.translation()
    onPositionChange?.([position.x, position.y, position.z])
  })

  const fireBullet = () => {
    console.log(`${player} fires!`)
    // TODO: Implement bullet firing with physics
  }

  return (
    <RigidBody
      ref={tankRef}
      position={initialPosition}
      colliders="hull"
      mass={5}
      friction={0.7}
      restitution={0.2}
    >
      <group scale={1.5}>
        <primitive object={scene.clone()} />

        {/* Team indicator */}
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[2, 0.3, 0.3]} />
          <meshStandardMaterial
            color={player === 'player1' ? '#0066ff' : '#ff0066'}
            emissive={player === 'player1' ? '#0066ff' : '#ff0066'}
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>
    </RigidBody>
  )
}

export default PlayerTank