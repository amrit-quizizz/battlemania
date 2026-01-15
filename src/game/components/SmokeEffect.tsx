import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { visualEffectsConfig } from '../config/gameConfig'

interface Particle {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  age: number
  lifetime: number
  initialSize: number
}

interface SmokeEffectProps {
  position: [number, number, number]
  firingDirection: { x: number; y: number }
  onComplete?: () => void
}

function SmokeEffect({ position, firingDirection, onComplete }: SmokeEffectProps) {
  const groupRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<Particle[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const onCompleteRef = useRef(onComplete)
  const smokeConfig = visualEffectsConfig.smoke

  // Update onComplete ref when it changes
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Initialize particles
  useEffect(() => {
    const newParticles: Particle[] = []
    
    for (let i = 0; i < smokeConfig.particleCount; i++) {
      // Random size within range
      const size = THREE.MathUtils.lerp(
        smokeConfig.particleSizeMin,
        smokeConfig.particleSizeMax,
        Math.random()
      )
      
      // Create particle mesh
      const geometry = new THREE.SphereGeometry(size, 8, 8)
      const material = new THREE.MeshBasicMaterial({
        color: smokeConfig.startColor,
        transparent: true,
        opacity: smokeConfig.startOpacity,
        depthWrite: false // Allow overlapping particles
      })
      const mesh = new THREE.Mesh(geometry, material)
      
      // Random initial position around spawn point (small spread)
      const spread = 0.1
      mesh.position.set(
        position[0] + (Math.random() - 0.5) * spread,
        position[1] + (Math.random() - 0.5) * spread * 0.5,
        position[2] + (Math.random() - 0.5) * spread
      )
      
      // Velocity in firing direction with dispersion
      // Base velocity follows bullet direction (reduced for shorter travel distance)
      const baseSpeed = 0.8 // Reduced forward speed for shorter travel distance
      const baseVelocityX = firingDirection.x * baseSpeed
      const baseVelocityY = firingDirection.y * baseSpeed
      
      // Random spread in all directions for dispersion effect (reduced for less distance)
      const spreadX = (Math.random() - 0.5) * smokeConfig.spreadSpeed * 1.2
      const spreadY = (Math.random() - 0.5) * smokeConfig.spreadSpeed * 1.0
      const spreadZ = (Math.random() - 0.5) * smokeConfig.spreadSpeed * 0.8
      
      // Combine base direction with random spread
      const velocity = new THREE.Vector3(
        baseVelocityX + spreadX,
        baseVelocityY + spreadY + Math.random() * 0.2, // Reduced upward bias
        spreadZ
      )
      
      // Random lifetime variation (80% to 120% of base lifetime)
      const lifetime = smokeConfig.lifetime * (0.8 + Math.random() * 0.4)
      
      newParticles.push({
        mesh,
        velocity,
        age: 0,
        lifetime,
        initialSize: size
      })
    }
    
    particlesRef.current = newParticles
    setParticles(newParticles)
    
    // Cleanup function
    return () => {
      newParticles.forEach(particle => {
        particle.mesh.geometry.dispose()
        if (particle.mesh.material instanceof THREE.Material) {
          particle.mesh.material.dispose()
        }
      })
    }
  }, [position, firingDirection, smokeConfig])

  // Animate particles
  useFrame((_state, delta) => {
    if (!groupRef.current || particlesRef.current.length === 0) return
    
    let allDead = true
    
    particlesRef.current.forEach(particle => {
      const newAge = particle.age + delta
      
      // Skip if particle is already dead
      if (newAge >= particle.lifetime) {
        particle.mesh.visible = false
        return
      }
      
      allDead = false
      
      // Update position
      particle.mesh.position.add(
        particle.velocity.clone().multiplyScalar(delta)
      )
      
      // Update age
      particle.age = newAge
      
      // Calculate normalized age (0 to 1)
      const normalizedAge = particle.age / particle.lifetime
      
      // Update opacity (fade out)
      const opacity = THREE.MathUtils.lerp(
        smokeConfig.startOpacity,
        0,
        normalizedAge
      )
      
      if (particle.mesh.material instanceof THREE.MeshBasicMaterial) {
        particle.mesh.material.opacity = opacity
        
        // Interpolate color from start to end
        const startColor = new THREE.Color(smokeConfig.startColor)
        const endColor = new THREE.Color(smokeConfig.endColor)
        particle.mesh.material.color.lerpColors(startColor, endColor, normalizedAge)
      }
      
      // Expand particle slightly as it rises
      const scale = 1 + normalizedAge * 0.5
      particle.mesh.scale.set(scale, scale, scale)
    })
    
    // Call onComplete when all particles are dead
    if (allDead && onCompleteRef.current) {
      onCompleteRef.current()
    }
  })

  // Render particles
  return (
    <group ref={groupRef}>
      {particles.map((particle, index) => (
        <primitive key={index} object={particle.mesh} />
      ))}
    </group>
  )
}

export default SmokeEffect
