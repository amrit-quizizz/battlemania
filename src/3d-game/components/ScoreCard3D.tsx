import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import useGameStore from '../store/gameStore'

interface ScoreCard3DProps {
  position: [number, number, number]
  player: 'player1' | 'player2'
  playerName: string
  teamColor: string
  rotation?: [number, number, number]
  scale?: number
}

/**
 * 3D Score Card Component
 * 
 * A fully 3D scorecard that hovers in 3D space showing:
 * - Player name
 * - Player's score (damage contribution to team)
 * - Ranking indicator
 */
export function ScoreCard3D({ 
  position, 
  player, 
  playerName, 
  teamColor,
  rotation = [0, 0, 0],
  scale = 1
}: ScoreCard3DProps) {
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  
  // Get player's score (damage contribution)
  const score = useGameStore((state) => state[player].score)
  const damageDealt = useGameStore((state) => state.damageDealt[player === 'player1' ? 'teamA' : 'teamB'])
  
  // Get opponent data for ranking comparison
  const opponentPlayer = player === 'player1' ? 'player2' : 'player1'
  const opponentScore = useGameStore((state) => state[opponentPlayer].score)
  const opponentDamageDealt = useGameStore((state) => state.damageDealt[opponentPlayer === 'player1' ? 'teamA' : 'teamB'])
  
  // Calculate ranking (1 = winning, 2 = losing)
  const ranking = useMemo(() => {
    // Primary: compare scores
    if (score > opponentScore) return 1
    if (score < opponentScore) return 2
    // Tiebreaker: compare damage dealt
    if (damageDealt > opponentDamageDealt) return 1
    if (damageDealt < opponentDamageDealt) return 2
    return 1
  }, [score, opponentScore, damageDealt, opponentDamageDealt])
  
  const isWinning = ranking === 1
  
  
  // Subtle floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.08
    }
    // Pulsing glow for winner
    if (glowRef.current && isWinning) {
      const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.15
      ;(glowRef.current.material as THREE.MeshStandardMaterial).opacity = pulse
    }
  })
  
  const panelWidth = 3.5
  const panelHeight = 1.8
  const panelDepth = 0.15
  
  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Main Panel Background */}
      <RoundedBox
        args={[panelWidth, panelHeight, panelDepth]}
        radius={0.1}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.3}
          roughness={0.4}
        />
      </RoundedBox>
      
      {/* Border Frame */}
      <RoundedBox
        args={[panelWidth + 0.08, panelHeight + 0.08, panelDepth * 0.5]}
        radius={0.12}
        smoothness={4}
        position={[0, 0, -0.02]}
      >
        <meshStandardMaterial
          color={teamColor}
          emissive={teamColor}
          emissiveIntensity={0.6}
          metalness={0.8}
          roughness={0.2}
        />
      </RoundedBox>
      
      {/* Winning glow effect */}
      {isWinning && (
        <mesh ref={glowRef} position={[0, 0, -0.05]}>
          <planeGeometry args={[panelWidth + 0.3, panelHeight + 0.3]} />
          <meshStandardMaterial
            color="#ffd700"
            emissive="#ffd700"
            emissiveIntensity={0.8}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Trophy icon for winner (3D representation) */}
      {isWinning && (
        <group position={[-panelWidth / 2 + 0.5, panelHeight / 2 - 0.45, panelDepth / 2 + 0.02]}>
          {/* Trophy cup */}
          <mesh>
            <cylinderGeometry args={[0.15, 0.1, 0.25, 8]} />
            <meshStandardMaterial
              color="#ffd700"
              emissive="#ffd700"
              emissiveIntensity={0.5}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          {/* Trophy base */}
          <mesh position={[0, -0.18, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 0.08, 8]} />
            <meshStandardMaterial
              color="#ffd700"
              emissive="#ffd700"
              emissiveIntensity={0.3}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
        </group>
      )}
      
      {/* Player Name - 3D Text */}
      <Text
        position={[isWinning ? 0.2 : 0, panelHeight / 2 - 0.45, panelDepth / 2 + 0.02]}
        fontSize={0.35}
        color={teamColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {playerName.toUpperCase()}
      </Text>
      
      {/* Score Label */}
      <Text
        position={[-panelWidth / 2 + 0.6, -0.1, panelDepth / 2 + 0.02]}
        fontSize={0.2}
        color="#888888"
        anchorX="left"
        anchorY="middle"
      >
        SCORE
      </Text>
      
      {/* Score Value - Large and prominent */}
      <Text
        position={[0, -0.45, panelDepth / 2 + 0.02]}
        fontSize={0.6}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor={teamColor}
      >
        {score.toString()}
      </Text>
      
      {/* Damage contribution indicator */}
      <group position={[panelWidth / 2 - 0.5, -0.1, panelDepth / 2 + 0.02]}>
        {/* Sword icon representation */}
        <mesh rotation={[0, 0, Math.PI / 4]} scale={0.12}>
          <boxGeometry args={[0.3, 2, 0.15]} />
          <meshStandardMaterial
            color="#ff6b6b"
            emissive="#ff6b6b"
            emissiveIntensity={0.4}
          />
        </mesh>
        <Text
          position={[0.3, -0.25, 0]}
          fontSize={0.18}
          color="#ff6b6b"
          anchorX="center"
          anchorY="middle"
        >
          {damageDealt.toString()}
        </Text>
      </group>
      
      {/* Ranking indicator (for non-winner) */}
      {!isWinning && (
        <Text
          position={[panelWidth / 2 - 0.3, panelHeight / 2 - 0.3, panelDepth / 2 + 0.02]}
          fontSize={0.25}
          color="#666666"
          anchorX="center"
          anchorY="middle"
        >
          #{ranking}
        </Text>
      )}
      
      {/* Decorative corner accents */}
      {[
        [-panelWidth / 2 + 0.15, panelHeight / 2 - 0.15],
        [panelWidth / 2 - 0.15, panelHeight / 2 - 0.15],
        [-panelWidth / 2 + 0.15, -panelHeight / 2 + 0.15],
        [panelWidth / 2 - 0.15, -panelHeight / 2 + 0.15]
      ].map((pos, idx) => (
        <mesh key={idx} position={[pos[0], pos[1], panelDepth / 2 + 0.01]}>
          <circleGeometry args={[0.06, 16]} />
          <meshStandardMaterial
            color={teamColor}
            emissive={teamColor}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  )
}
