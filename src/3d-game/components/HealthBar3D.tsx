import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh } from 'three'
import * as THREE from 'three'
import { RapierRigidBody } from '@react-three/rapier'
import useGameStore from '../store/gameStore'
import { damageConfig } from '../config/damageConfig'
import { visualEffectsConfig } from '../config/gameConfig'

interface HealthBar3DProps {
  player: 'player1' | 'player2'
  tankRef: React.RefObject<RapierRigidBody | null>
}

/**
 * 3D Health Bar Component
 * 
 * Displays a low-key 3D health bar above the tank with:
 * - Smooth color transition based on health percentage
 * - Animated width based on health
 * - Subtle emissive glow
 * - Pinned to tank position (moves with tank)
 */
export function HealthBar3D({ player, tankRef }: HealthBar3DProps) {
  const healthBarRef = useRef<Mesh>(null)
  const backgroundRef = useRef<Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  
  // Get health from store (reactive)
  const health = useGameStore((state) => state[player].health)
  const initialHealth = 100 // From playerConfig.initialHealth
  const healthPercentage = Math.max(0, Math.min(100, (health / initialHealth) * 100))
  
  // Calculate color based on health percentage
  const getHealthColor = (percentage: number): string => {
    if (percentage > 50) {
      // Green to yellow transition (100% to 50%)
      const ratio = (percentage - 50) / 50
      const r = Math.floor(255 * (1 - ratio))
      const g = 255
      const b = 0
      return `rgb(${r}, ${g}, ${b})`
    } else {
      // Yellow to red transition (50% to 0%)
      const ratio = percentage / 50
      const r = 255
      const g = Math.floor(255 * ratio)
      const b = 0
      return `rgb(${r}, ${g}, ${b})`
    }
  }
  
  // Update position to follow tank and animate width
  useFrame(() => {
    if (!tankRef.current || !groupRef.current) return
    
    // Get tank's current position from physics body
    const tankPosition = tankRef.current.translation()
    const [offsetX, offsetY, offsetZ] = damageConfig.healthBar.positionOffset3D
    
    // Update health bar group position to follow tank
    groupRef.current.position.set(
      tankPosition.x + offsetX,
      tankPosition.y + offsetY,
      tankPosition.z + offsetZ
    )
    
    // Smooth width animation
    if (healthBarRef.current && backgroundRef.current) {
      const [fullWidth] = damageConfig.healthBar.dimensions3D
      const currentWidth = (healthPercentage / 100) * fullWidth
      
      // Smoothly animate width changes
      const currentScale = healthBarRef.current.scale.x
      const targetScale = Math.max(0.01, currentWidth / fullWidth) // Prevent zero scale
      
      // Lerp for smooth animation
      healthBarRef.current.scale.x = THREE.MathUtils.lerp(currentScale, targetScale, 0.1)
      
      // Update color smoothly
      const color = getHealthColor(healthPercentage)
      if (healthBarRef.current.material instanceof THREE.MeshStandardMaterial) {
        healthBarRef.current.material.color.setStyle(color)
        healthBarRef.current.material.emissive.setStyle(color)
      }
    }
  })
  
  const [fullWidth, height, depth] = damageConfig.healthBar.dimensions3D
  const healthColor = getHealthColor(healthPercentage)
  
  return (
    <group ref={groupRef}>
      {/* Shadow effect - darker mesh below and behind the health bar */}
      <mesh 
        position={[
          -(fullWidth / 2) * (1 - healthPercentage / 100), 
          -height / 2 - 0.02, 
          -depth / 2 - 0.01
        ]}
      >
        <boxGeometry args={[fullWidth * (healthPercentage / 100), height * 0.3, depth * 0.5]} />
        <meshStandardMaterial
          color="#000000"
          opacity={0.4}
          transparent
          metalness={0}
          roughness={1}
        />
      </mesh>
      
      {/* Background bar (full width, darker) - More 3D depth */}
      <mesh ref={backgroundRef} position={[0, 0, -depth / 2 - 0.02]}>
        <boxGeometry args={[fullWidth, height, depth * 0.4]} />
        <meshStandardMaterial
          color={damageConfig.healthBar.colors.background}
          emissive={damageConfig.healthBar.colors.background}
          emissiveIntensity={0.2}
          metalness={visualEffectsConfig.materials.metalness}
          roughness={visualEffectsConfig.materials.roughness}
        />
      </mesh>
      
      {/* Health bar (scaled width, colored) - Enhanced 3D effect */}
      <mesh 
        ref={healthBarRef} 
        position={[-(fullWidth / 2) * (1 - healthPercentage / 100), 0, 0]}
      >
        <boxGeometry args={[fullWidth, height, depth]} />
        <meshStandardMaterial
          color={healthColor}
          emissive={healthColor}
          emissiveIntensity={damageConfig.healthBar.emissiveIntensity}
          metalness={visualEffectsConfig.materials.metalness}
          roughness={visualEffectsConfig.materials.roughness}
        />
      </mesh>
      
      {/* Bottom edge shadow - darker border effect */}
      <mesh 
        position={[
          -(fullWidth / 2) * (1 - healthPercentage / 100), 
          -height / 2, 
          0
        ]}
      >
        <boxGeometry args={[fullWidth * (healthPercentage / 100), height * 0.15, depth]} />
        <meshStandardMaterial
          color="#000000"
          opacity={0.6}
          transparent
          metalness={0}
          roughness={1}
        />
      </mesh>
    </group>
  )
}
