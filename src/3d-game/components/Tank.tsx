import { useRef } from 'react'
import { Group, Mesh } from 'three'
import { useFrame } from '@react-three/fiber'

interface TankProps {
  position: [number, number, number]
  rotation: number
  color: string
  player: 'player1' | 'player2'
}

function Tank({ position, rotation, color, player }: TankProps) {
  const groupRef = useRef<Group>(null)
  const turretRef = useRef<Mesh>(null)

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.set(...position)
      groupRef.current.rotation.y = rotation
    }

    // Add a slight bobbing animation
    if (turretRef.current) {
      turretRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      {/* Tank Body - BIGGER */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[4, 1.5, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Tank Tracks - Left */}
      <mesh castShadow position={[-2.5, -0.5, 0]}>
        <boxGeometry args={[0.8, 1, 6.5]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Tank Tracks - Right */}
      <mesh castShadow position={[2.5, -0.5, 0]}>
        <boxGeometry args={[0.8, 1, 6.5]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Tank Turret Base */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[1.5, 2, 1, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Tank Turret */}
      <group ref={turretRef} position={[0, 1.6, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.2, 0.8, 1.2]} />
          <meshStandardMaterial color={color} />
        </mesh>

        {/* Tank Barrel */}
        <mesh castShadow position={[0, 0, -2.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 4, 8]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
      </group>

      {/* Player indicator */}
      <mesh position={[0, 4, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.2, 8]} />
        <meshStandardMaterial
          color={player === 'player1' ? '#00ff00' : '#ffff00'}
          emissive={player === 'player1' ? '#00ff00' : '#ffff00'}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Health bar background */}
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[3, 0.3, 0.1]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Health bar (full) */}
      <mesh position={[0, 5, 0.1]}>
        <boxGeometry args={[2.8, 0.25, 0.1]} />
        <meshStandardMaterial
          color={player === 'player1' ? '#00ff00' : '#ff0000'}
          emissive={player === 'player1' ? '#00ff00' : '#ff0000'}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  )
}

export default Tank