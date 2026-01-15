import { useRef, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import useGameStore from '../store/gameStore'
import { uiConfig, playerConfig } from '../config/gameConfig'

// Get scorecard config
const scoreCardConfig = uiConfig.scoreCard3D

// Preload the cutting board model
useGLTF.preload(scoreCardConfig.modelPath)

interface ScoreCard3DProps {
  position: [number, number, number]
  player: 'player1' | 'player2'
  playerName: string
  teamColor: string
  rotation?: [number, number, number]
  scale?: number
}

/**
 * Low-poly Cutting Board Background Component
 */
function CuttingBoardBackground() {
  const boardRef = useRef<THREE.Group>(null)
  const { board, fallback, modelPath } = scoreCardConfig
  
  // Load the 3D model
  let scene: THREE.Object3D | null = null
  try {
    const gltf = useGLTF(modelPath)
    scene = gltf.scene.clone()
    
    // Enable shadows on the model
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  } catch (error) {
    console.warn('Failed to load Cutting Board model:', error)
  }
  
  if (!scene) {
    // Fallback low-poly board shape
    return (
      <mesh castShadow receiveShadow>
        <boxGeometry args={fallback.geometry} />
        <meshStandardMaterial
          color={fallback.color}
          roughness={fallback.roughness}
          metalness={fallback.metalness}
        />
      </mesh>
    )
  }
  
  return (
    <group ref={boardRef}>
      <primitive 
        object={scene} 
        scale={board.scale} 
        rotation={board.rotation}
        position={board.position}
      />
    </group>
  )
}

/**
 * Low-poly 3D Health Bar Component
 * Full width with padding, boxy design
 */
function LowPolyHealthBar({ 
  health, 
  maxHealth,
  config,
  textZOffset
}: { 
  health: number
  maxHealth: number
  config: typeof scoreCardConfig.healthBar
  textZOffset: number
}) {
  const healthPercentage = Math.max(0, Math.min(100, (health / maxHealth) * 100))
  const innerWidth = config.width - (config.padding * 2)
  const healthWidth = Math.max(0.01, (healthPercentage / 100) * innerWidth)
  
  // Determine health bar color based on percentage
  const getHealthColor = () => {
    if (healthPercentage > 60) return config.colors.high
    if (healthPercentage > 30) return config.colors.medium
    return config.colors.low
  }
  
  return (
    <group position={[config.xOffset, config.yOffset, textZOffset]}>
      {/* Border frame - boxy low-poly style */}
      <mesh position={[0, 0, -config.depth / 2 - config.borderWidth / 2]}>
        <boxGeometry args={[
          config.width + config.borderWidth * 2, 
          config.height + config.borderWidth * 2, 
          config.depth + config.borderWidth
        ]} />
        <meshStandardMaterial 
          color={config.borderColor} 
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Background bar */}
      <mesh position={[0, 0, -config.depth / 2]}>
        <boxGeometry args={[config.width, config.height, config.depth]} />
        <meshStandardMaterial 
          color={config.backgroundColor} 
          roughness={0.8}
        />
      </mesh>
      
      {/* Health bar fill - boxy solid color */}
      <mesh position={[-(innerWidth - healthWidth) / 2, 0, 0]}>
        <boxGeometry args={[healthWidth, config.height - config.padding, config.depth * 1.1]} />
        <meshStandardMaterial 
          color={getHealthColor()} 
          emissive={getHealthColor()}
          emissiveIntensity={0.2}
          roughness={0.6}
        />
      </mesh>
      
      {/* HP Label */}
      {config.label.show && (
        <Text
          position={[0, 0, config.depth / 2 + 0.02]}
          fontSize={config.label.fontSize}
          color={config.label.color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={config.label.outlineWidth}
          outlineColor={config.label.outlineColor}
        >
          {health}
        </Text>
      )}
    </group>
  )
}

/**
 * 3D Score Card Component
 * 
 * Low-poly boxy scorecard with:
 * - Player name at top
 * - Full-width health bar
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
  const { 
    animation, 
    textZOffset, 
    playerName: nameConfig, 
    score: scoreConfig, 
    healthBar: healthBarConfig,
    trophy, 
    fallback 
  } = scoreCardConfig
  
  // Get player's data
  const score = useGameStore((state) => state[player].score)
  const health = useGameStore((state) => state[player].health)
  
  // Subtle floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * animation.speed) * animation.amplitude
    }
  })
  
  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Low-poly Cutting Board Background */}
      <Suspense fallback={
        <mesh>
          <boxGeometry args={fallback.geometry} />
          <meshStandardMaterial color={fallback.color} />
        </mesh>
      }>
        <CuttingBoardBackground />
      </Suspense>
      
      {/* Player Name - Top center */}
      <Text
        position={[0, nameConfig.yOffset, textZOffset]}
        fontSize={nameConfig.fontSize}
        color={teamColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={nameConfig.outlineWidth}
        outlineColor={nameConfig.outlineColor}
      >
        {playerName.toUpperCase()}
      </Text>
      
      {/* Score Value - Only if show is true */}
      {scoreConfig.show && (
        <group position={[scoreConfig.xOffset, scoreConfig.yOffset, textZOffset]}>
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[0.7, 0.6, 0.1]} />
            <meshStandardMaterial 
              color="#1a1a1a" 
              roughness={0.9}
              transparent
              opacity={0.7}
            />
          </mesh>
          <Text
            position={[0, 0, 0]}
            fontSize={scoreConfig.fontSize}
            color={scoreConfig.color}
            anchorX="center"
            anchorY="middle"
            outlineWidth={scoreConfig.outlineWidth}
            outlineColor={scoreConfig.outlineColor}
          >
            {score.toString()}
          </Text>
        </group>
      )}
      
      {/* Health Bar - Full width */}
      <LowPolyHealthBar
        health={health}
        maxHealth={playerConfig.initialHealth}
        config={healthBarConfig}
        textZOffset={textZOffset}
      />
      
      {/* Trophy/Star indicator - Only if show is true */}
      {trophy.show && (
        <group position={[trophy.xOffset, trophy.yOffset, textZOffset]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.2, 0.2, 0.08]} />
            <meshStandardMaterial 
              color={trophy.color}
              emissive={trophy.color}
              emissiveIntensity={0.5}
              roughness={0.3}
            />
          </mesh>
          <mesh>
            <boxGeometry args={[0.25, 0.25, 0.06]} />
            <meshStandardMaterial 
              color={trophy.color}
              emissive={trophy.color}
              emissiveIntensity={0.5}
              roughness={0.3}
            />
          </mesh>
        </group>
      )}
    </group>
  )
}
