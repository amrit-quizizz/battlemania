import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { visualEffectsConfig } from '../config/gameConfig'

interface ExplosionEffectProps {
  position: [number, number, number]
  onComplete?: () => void
}

function ExplosionEffect({ position, onComplete }: ExplosionEffectProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ageRef = useRef(0)
  const onCompleteRef = useRef(onComplete)
  const explosionConfig = visualEffectsConfig.explosion

  // Update onComplete ref when it changes
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Animate explosion
  useFrame((_state, delta) => {
    if (!meshRef.current) return

    const newAge = ageRef.current + delta
    ageRef.current = newAge

    // Check if explosion is complete
    if (newAge >= explosionConfig.lifetime) {
      if (onCompleteRef.current) {
        onCompleteRef.current()
      }
      return
    }

    // Calculate normalized age (0 to 1)
    const normalizedAge = newAge / explosionConfig.lifetime

    // Update radius (expand from initial to max)
    const radius = THREE.MathUtils.lerp(
      explosionConfig.initialRadius,
      explosionConfig.maxRadius,
      normalizedAge
    )
    meshRef.current.scale.set(radius, radius, radius)

    // Update opacity (fade out)
    const opacity = THREE.MathUtils.lerp(
      explosionConfig.startOpacity,
      explosionConfig.endOpacity,
      normalizedAge
    )

    // Update color (interpolate from start to end)
    if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
      meshRef.current.material.opacity = opacity
      
      const startColor = new THREE.Color(explosionConfig.startColor)
      const endColor = new THREE.Color(explosionConfig.endColor)
      meshRef.current.material.color.lerpColors(startColor, endColor, normalizedAge)
      
      // Update emissive color to match main color for glow effect
      meshRef.current.material.emissive.copy(meshRef.current.material.color)
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color={explosionConfig.startColor}
        transparent
        opacity={explosionConfig.startOpacity}
        emissive={explosionConfig.startColor}
        emissiveIntensity={explosionConfig.emissiveIntensity}
      />
    </mesh>
  )
}

export default ExplosionEffect
