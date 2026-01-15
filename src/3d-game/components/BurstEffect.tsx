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

interface BurstEffectProps {
  position: [number, number, number]
  onComplete?: () => void
}

function BurstEffect({ position, onComplete }: BurstEffectProps) {
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/afe67715-8fe3-4e25-ba74-9e370898c825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BurstEffect.tsx:19',message:'BurstEffect component created',data:{position},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const groupRef = useRef<THREE.Group>(null)
  const debrisParticlesRef = useRef<Particle[]>([])
  const fireParticlesRef = useRef<Particle[]>([])
  const smokeParticlesRef = useRef<Particle[]>([])
  const [debrisParticles, setDebrisParticles] = useState<Particle[]>([])
  const [fireParticles, setFireParticles] = useState<Particle[]>([])
  const [smokeParticles, setSmokeParticles] = useState<Particle[]>([])
  const onCompleteRef = useRef(onComplete)
  const burstConfig = visualEffectsConfig.burst
  const firstFrameRef = useRef(true)

  // Update onComplete ref when it changes
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])
  
  // Reset first frame flag when position changes (new effect)
  useEffect(() => {
    firstFrameRef.current = true
  }, [position])

  // Initialize particles
  useEffect(() => {
    const debris: Particle[] = []
    const fire: Particle[] = []
    const smoke: Particle[] = []

    // Create debris particles
    for (let i = 0; i < burstConfig.debris.particleCount; i++) {
      const size = THREE.MathUtils.lerp(
        burstConfig.debris.sizeMin,
        burstConfig.debris.sizeMax,
        Math.random()
      )
      
      const geometry = new THREE.SphereGeometry(size, 8, 8)
      const material = new THREE.MeshStandardMaterial({
        color: burstConfig.debris.startColor,
        transparent: true,
        opacity: burstConfig.debris.startOpacity,
        metalness: 0.7,
        roughness: 0.3
      })
      const mesh = new THREE.Mesh(geometry, material)
      
      // Random initial position around origin (group will be positioned at hit point)
      const spread = 0.15
      mesh.position.set(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread * 0.5,
        (Math.random() - 0.5) * spread
      )
      
      // Random velocity in all directions with gravity
      const speed = THREE.MathUtils.lerp(
        burstConfig.debris.velocityMin,
        burstConfig.debris.velocityMax,
        Math.random()
      )
      const angle = Math.random() * Math.PI * 2
      const elevation = Math.random() * Math.PI * 0.5 // Mostly horizontal
      const velocity = new THREE.Vector3(
        Math.cos(angle) * Math.sin(elevation) * speed,
        Math.sin(elevation) * speed * 0.5 + Math.random() * 0.5, // Slight upward bias
        Math.sin(angle) * Math.sin(elevation) * speed
      )
      
      const lifetime = burstConfig.debris.lifetime * (0.8 + Math.random() * 0.4)
      
      debris.push({
        mesh,
        velocity,
        age: 0,
        lifetime,
        initialSize: size
      })
    }

    // Create fire particles
    for (let i = 0; i < burstConfig.fire.particleCount; i++) {
      const size = THREE.MathUtils.lerp(
        burstConfig.fire.sizeMin,
        burstConfig.fire.sizeMax,
        Math.random()
      )
      
      const geometry = new THREE.SphereGeometry(size, 8, 8)
      const material = new THREE.MeshBasicMaterial({
        color: burstConfig.fire.startColor,
        transparent: true,
        opacity: burstConfig.fire.startOpacity,
        emissive: burstConfig.fire.startColor,
        emissiveIntensity: 2.0
      })
      const mesh = new THREE.Mesh(geometry, material)
      
      // Random initial position around origin (group will be positioned at hit point)
      const spread = 0.1
      mesh.position.set(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread * 0.3,
        (Math.random() - 0.5) * spread
      )
      
      // Upward expanding velocity
      const speed = THREE.MathUtils.lerp(
        burstConfig.fire.velocityMin,
        burstConfig.fire.velocityMax,
        Math.random()
      )
      const angle = Math.random() * Math.PI * 2
      const elevation = Math.random() * Math.PI * 0.3 // Upward cone
      const velocity = new THREE.Vector3(
        Math.cos(angle) * Math.sin(elevation) * speed * (1 - burstConfig.fire.upwardBias),
        Math.cos(elevation) * speed * burstConfig.fire.upwardBias + Math.random() * 0.5,
        Math.sin(angle) * Math.sin(elevation) * speed * (1 - burstConfig.fire.upwardBias)
      )
      
      const lifetime = burstConfig.fire.lifetime * (0.7 + Math.random() * 0.3)
      
      fire.push({
        mesh,
        velocity,
        age: 0,
        lifetime,
        initialSize: size
      })
    }

    // Create smoke particles
    for (let i = 0; i < burstConfig.smoke.particleCount; i++) {
      const size = THREE.MathUtils.lerp(
        burstConfig.smoke.sizeMin,
        burstConfig.smoke.sizeMax,
        Math.random()
      )
      
      const geometry = new THREE.SphereGeometry(size, 8, 8)
      const material = new THREE.MeshBasicMaterial({
        color: burstConfig.smoke.startColor,
        transparent: true,
        opacity: burstConfig.smoke.startOpacity,
        depthWrite: false
      })
      const mesh = new THREE.Mesh(geometry, material)
      
      // Random initial position around origin (group will be positioned at hit point)
      const spread = 0.12
      mesh.position.set(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread * 0.4,
        (Math.random() - 0.5) * spread
      )
      
      // Slow upward rising velocity
      const speed = THREE.MathUtils.lerp(
        burstConfig.smoke.velocityMin,
        burstConfig.smoke.velocityMax,
        Math.random()
      )
      const angle = Math.random() * Math.PI * 2
      const elevation = Math.random() * Math.PI * 0.2 // Mostly upward
      const velocity = new THREE.Vector3(
        Math.cos(angle) * Math.sin(elevation) * speed * (1 - burstConfig.smoke.upwardBias),
        Math.cos(elevation) * speed * burstConfig.smoke.upwardBias,
        Math.sin(angle) * Math.sin(elevation) * speed * (1 - burstConfig.smoke.upwardBias)
      )
      
      const lifetime = burstConfig.smoke.lifetime * (0.8 + Math.random() * 0.4)
      
      smoke.push({
        mesh,
        velocity,
        age: 0,
        lifetime,
        initialSize: size
      })
    }
    
    debrisParticlesRef.current = debris
    fireParticlesRef.current = fire
    smokeParticlesRef.current = smoke
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/afe67715-8fe3-4e25-ba74-9e370898c825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BurstEffect.tsx:94',message:'Particles initialized',data:{debrisCount:debris.length,fireCount:fire.length,smokeCount:smoke.length,position},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    setDebrisParticles(debris)
    setFireParticles(fire)
    setSmokeParticles(smoke)
    
    // Cleanup function
    return () => {
      [...debris, ...fire, ...smoke].forEach(particle => {
        particle.mesh.geometry.dispose()
        if (particle.mesh.material instanceof THREE.Material) {
          particle.mesh.material.dispose()
        }
      })
    }
  }, [position, burstConfig])

  // Animate particles
  useFrame((_state, delta) => {
    if (!groupRef.current) return
    
    // Clamp delta on first frame to prevent huge time gaps from causing immediate particle death
    let clampedDelta = delta
    if (firstFrameRef.current) {
      clampedDelta = Math.min(delta, 0.1) // Cap first frame delta at 100ms
      firstFrameRef.current = false
    }
    
    // #region agent log
    if (debrisParticlesRef.current.length === 0 && fireParticlesRef.current.length === 0 && smokeParticlesRef.current.length === 0) {
      fetch('http://127.0.0.1:7245/ingest/afe67715-8fe3-4e25-ba74-9e370898c825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BurstEffect.tsx:225',message:'useFrame: No particles in refs',data:{debrisCount:debrisParticlesRef.current.length,fireCount:fireParticlesRef.current.length,smokeCount:smokeParticlesRef.current.length,delta,clampedDelta},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    }
    // #endregion
    
    let allDead = true
    let aliveCount = 0
    
    // Animate debris particles
    debrisParticlesRef.current.forEach((particle, index) => {
      const newAge = particle.age + clampedDelta
      
      // #region agent log
      if (index === 0 && particle.age === 0) {
        fetch('http://127.0.0.1:7245/ingest/afe67715-8fe3-4e25-ba74-9e370898c825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BurstEffect.tsx:238',message:'Debris particle first frame',data:{age:particle.age,newAge,lifetime:particle.lifetime,delta,clampedDelta,willDie:newAge >= particle.lifetime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      }
      // #endregion
      
      if (newAge >= particle.lifetime) {
        particle.mesh.visible = false
        return
      }
      
      allDead = false
      aliveCount++
      
      // Update position with gravity
      particle.velocity.y -= burstConfig.debris.gravity * clampedDelta
      particle.mesh.position.add(
        particle.velocity.clone().multiplyScalar(clampedDelta)
      )
      
      particle.age = newAge
      const normalizedAge = particle.age / particle.lifetime
      
      // Update opacity and color
      const opacity = THREE.MathUtils.lerp(
        burstConfig.debris.startOpacity,
        0,
        normalizedAge
      )
      
      if (particle.mesh.material instanceof THREE.MeshStandardMaterial) {
        particle.mesh.material.opacity = opacity
        
        const startColor = new THREE.Color(burstConfig.debris.startColor)
        const endColor = new THREE.Color(burstConfig.debris.endColor)
        particle.mesh.material.color.lerpColors(startColor, endColor, normalizedAge)
      }
    })
    
    // Animate fire particles
    fireParticlesRef.current.forEach(particle => {
      const newAge = particle.age + clampedDelta
      
      if (newAge >= particle.lifetime) {
        particle.mesh.visible = false
        return
      }
      
      allDead = false
      
      // Update position
      particle.mesh.position.add(
        particle.velocity.clone().multiplyScalar(clampedDelta)
      )
      
      particle.age = newAge
      const normalizedAge = particle.age / particle.lifetime
      
      // Update opacity and color (three-color gradient)
      const opacity = THREE.MathUtils.lerp(
        burstConfig.fire.startOpacity,
        0,
        normalizedAge
      )
      
      if (particle.mesh.material instanceof THREE.MeshBasicMaterial) {
        particle.mesh.material.opacity = opacity
        
        // Three-color gradient: orange -> red -> black
        let color: THREE.Color
        if (normalizedAge < 0.5) {
          const startColor = new THREE.Color(burstConfig.fire.startColor)
          const middleColor = new THREE.Color(burstConfig.fire.middleColor)
          color = startColor.clone().lerp(middleColor, normalizedAge * 2)
        } else {
          const middleColor = new THREE.Color(burstConfig.fire.middleColor)
          const endColor = new THREE.Color(burstConfig.fire.endColor)
          color = middleColor.clone().lerp(endColor, (normalizedAge - 0.5) * 2)
        }
        particle.mesh.material.color.copy(color)
        particle.mesh.material.emissive.copy(color)
        
        // Expand particle
        const scale = 1 + normalizedAge * 1.5
        particle.mesh.scale.set(scale, scale, scale)
      }
    })
    
    // Animate smoke particles
    smokeParticlesRef.current.forEach(particle => {
      const newAge = particle.age + clampedDelta
      
      if (newAge >= particle.lifetime) {
        particle.mesh.visible = false
        return
      }
      
      allDead = false
      
      // Update position
      particle.mesh.position.add(
        particle.velocity.clone().multiplyScalar(clampedDelta)
      )
      
      particle.age = newAge
      const normalizedAge = particle.age / particle.lifetime
      
      // Update opacity and color
      const opacity = THREE.MathUtils.lerp(
        burstConfig.smoke.startOpacity,
        0,
        normalizedAge
      )
      
      if (particle.mesh.material instanceof THREE.MeshBasicMaterial) {
        particle.mesh.material.opacity = opacity
        
        const startColor = new THREE.Color(burstConfig.smoke.startColor)
        const endColor = new THREE.Color(burstConfig.smoke.endColor)
        particle.mesh.material.color.lerpColors(startColor, endColor, normalizedAge)
        
        // Expand particle as it rises
        const scale = 1 + normalizedAge * burstConfig.smoke.expansionRate
        particle.mesh.scale.set(scale, scale, scale)
      }
    })
    
    // #region agent log
    if (aliveCount === 0 && allDead) {
      fetch('http://127.0.0.1:7245/ingest/afe67715-8fe3-4e25-ba74-9e370898c825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BurstEffect.tsx:355',message:'All particles dead',data:{debrisCount:debrisParticlesRef.current.length,fireCount:fireParticlesRef.current.length,smokeCount:smokeParticlesRef.current.length,position},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D,E'})}).catch(()=>{});
    }
    // #endregion
    
    // Call onComplete when all particles are dead
    if (allDead && onCompleteRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/afe67715-8fe3-4e25-ba74-9e370898c825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BurstEffect.tsx:361',message:'Calling onComplete',data:{aliveCount,allDead,position},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      onCompleteRef.current()
    }
  })

  // Render particles
  return (
    <group ref={groupRef} position={position}>
      {debrisParticles.map((particle, index) => (
        <primitive key={`debris-${index}`} object={particle.mesh} />
      ))}
      {fireParticles.map((particle, index) => (
        <primitive key={`fire-${index}`} object={particle.mesh} />
      ))}
      {smokeParticles.map((particle, index) => (
        <primitive key={`smoke-${index}`} object={particle.mesh} />
      ))}
    </group>
  )
}

export default BurstEffect
