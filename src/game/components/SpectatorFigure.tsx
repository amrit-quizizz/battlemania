import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody, CuboidCollider } from '@react-three/rapier'
import { RoundedBox } from '@react-three/drei'
import { spectatorConfig } from '../config/gameConfig'
import * as THREE from 'three'

interface SpectatorFigureProps {
  /** World position [x, y, z] */
  position: [number, number, number]
  /** Optional rotation [x, y, z] in radians */
  rotation?: [number, number, number]
  /** Optional scale multiplier */
  scale?: number
  /** Random offset for animation timing (0-1) */
  cheerOffset?: number
}

/**
 * Reusable spectator figure component (gudda-like white figure)
 * Built from Three.js primitives with cheering animation
 */
export function SpectatorFigure({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  cheerOffset = 0
}: SpectatorFigureProps) {
  const config = spectatorConfig
  const leftArmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const positionLogCounter = useRef(0)
  const collisionCount = useRef(0)

  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/afe67715-8fe3-4e25-ba74-9e370898c825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpectatorFigure.tsx:27',message:'SpectatorFigure created',data:{position,rotation,scale,physics:{mass:config.physics.mass,friction:config.physics.friction,restitution:config.physics.restitution,linearDamping:config.physics.linearDamping,angularDamping:config.physics.angularDamping},colliderType:'CuboidCollider',lockRotations:[true,false,true]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  // Animation state
  const animationState = useRef({
    isCheering: false,
    cheerStartTime: 0,
    cheerProgress: 0,
    idleVariation: cheerOffset * Math.PI * 2 // Use offset for variation
  })

  // Log position updates and enforce rotation/translation locks
  useFrame(() => {
    if (rigidBodyRef.current) {
      // Manually lock all rotations to keep facing +z direction
      const currentRot = rigidBodyRef.current.rotation()
      const rotationChanged = Math.abs(currentRot.x) > 0.01 || Math.abs(currentRot.y) > 0.01 || Math.abs(currentRot.z) > 0.01
      if (rotationChanged) {
        // Force rotation to [0, 0, 0] to always face +z direction
        const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0))
        rigidBodyRef.current.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }, true)
      }
      
      // Manually lock X and Z translations to prevent sliding/toppling
      const pos = rigidBodyRef.current.translation()
      const linvel = rigidBodyRef.current.linvel()
      const translationChanged = Math.abs(pos.x - position[0]) > 0.01 || Math.abs(pos.z - position[2]) > 0.01
      if (translationChanged) {
        rigidBodyRef.current.setTranslation({ x: position[0], y: pos.y, z: position[2] }, true)
      }
      // Also lock X and Z linear velocities
      if (Math.abs(linvel.x) > 0.01 || Math.abs(linvel.z) > 0.01) {
        rigidBodyRef.current.setLinvel({ x: 0, y: linvel.y, z: 0 }, true)
      }
      
      // Check if falling (negative Y velocity and Y position decreasing)
      const isFalling = linvel.y < -0.1 && pos.y < position[1] - 0.2
      
      if (positionLogCounter.current < 20) {
        const rot = rigidBodyRef.current.rotation()
        
        // #region agent log
        if (positionLogCounter.current % 5 === 0) {
          fetch('http://127.0.0.1:7245/ingest/afe67715-8fe3-4e25-ba74-9e370898c825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SpectatorFigure.tsx:useFrame',message:'Spectator position update v2',data:{position:[pos.x,pos.y,pos.z],rotation:[rot.x,rot.y,rot.z],velocity:[linvel.x,linvel.y,linvel.z],frame:positionLogCounter.current,rotationLocked:rotationChanged,isFalling,initialY:position[1]},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
        }
        // #endregion
        
        positionLogCounter.current++
      }
    }
  })

  // Memoize materials to avoid recreating on each render
  const bodyMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({ 
      color: config.appearance.color,
      roughness: 0.8,
      metalness: 0.1
    }), []
  )

  const eyeMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({ 
      color: config.appearance.eyeColor 
    }), []
  )

  // Animation loop
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime + cheerOffset * 10 // Offset timing
    
    // Check if we should start cheering (occasional bursts)
    if (!animationState.current.isCheering) {
      const random = Math.random()
      if (random < config.animation.cheeringFrequency * 60 * delta) {
        animationState.current.isCheering = true
        animationState.current.cheerStartTime = time
        animationState.current.cheerProgress = 0
      }
    }

    // Update cheering progress
    if (animationState.current.isCheering) {
      const elapsed = time - animationState.current.cheerStartTime
      animationState.current.cheerProgress = elapsed / config.animation.cheeringDuration
      
      // End cheering after duration
      if (elapsed >= config.animation.cheeringDuration) {
        animationState.current.isCheering = false
        animationState.current.cheerProgress = 0
      }
    }

    // Animate arms
    if (leftArmRef.current && rightArmRef.current) {
      if (animationState.current.isCheering) {
        // Cheering: raise arms up
        const progress = animationState.current.cheerProgress
        // Smooth easing function (ease-in-out)
        const eased = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2
        
        const rotation = THREE.MathUtils.lerp(
          config.animation.idleArmRotation,
          config.animation.cheeringAmplitude[1],
          eased
        )
        leftArmRef.current.rotation.x = rotation
        rightArmRef.current.rotation.x = rotation
      } else {
        // Idle: arms hang down with slight variation
        const variation = Math.sin(time * 0.5 + animationState.current.idleVariation) * config.animation.idleVariation
        leftArmRef.current.rotation.x = config.animation.idleArmRotation + variation
        rightArmRef.current.rotation.x = config.animation.idleArmRotation + variation * 0.8
      }
    }
  })

  const scaledHeadSize = config.appearance.headSize * scale
  const scaledBodySize = config.appearance.bodySize.map(s => s * scale) as [number, number, number]
  const scaledArmLength = config.appearance.armLength * scale
  const scaledArmThickness = config.appearance.armThickness * scale
  const scaledLegLength = config.appearance.legLength * scale
  const scaledLegThickness = config.appearance.legThickness * scale
  const scaledEyeSize = config.appearance.eyeSize * scale
  const scaledEyeOffset = config.appearance.eyeOffset.map(o => o * scale) as [number, number, number]

  // Calculate positions relative to body
  const headY = scaledBodySize[1] / 2 + scaledHeadSize
  const armY = scaledBodySize[1] * 0.3
  const legY = -scaledBodySize[1] / 2
  const armX = scaledBodySize[0] / 2 + scaledArmThickness

  // Calculate collider half-extents based on body size (centered at body center)
  const colliderHalfExtents: [number, number, number] = [
    scaledBodySize[0] / 2,
    scaledBodySize[1] / 2,
    scaledBodySize[2] / 2
  ]

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={position}
      rotation={rotation}
      mass={config.physics.mass}
      friction={config.physics.friction}
      restitution={config.physics.restitution}
      linearDamping={config.physics.linearDamping}
      angularDamping={config.physics.angularDamping}
      colliders={false}
    >
      {/* Explicit cuboid collider matching body dimensions */}
      <CuboidCollider args={colliderHalfExtents} />
      <group scale={scale}>
      {/* Body mesh */}
      <RoundedBox
        position={[0, 0, 0]}
        args={scaledBodySize}
        radius={0.02}
        smoothness={4}
        castShadow
        receiveShadow
        material={bodyMaterial}
      />
      {/* Head */}
      <mesh 
        position={[0, headY, 0]} 
        castShadow 
        receiveShadow
        material={bodyMaterial}
      >
        <sphereGeometry args={[scaledHeadSize, 16, 16]} />
      </mesh>

      {/* Eyes */}
      <mesh 
        position={[
          -scaledEyeOffset[0], 
          headY + scaledEyeOffset[1], 
          scaledHeadSize + scaledEyeOffset[2]
        ]} 
        castShadow
        material={eyeMaterial}
      >
        <sphereGeometry args={[scaledEyeSize, 8, 8]} />
      </mesh>
      <mesh 
        position={[
          scaledEyeOffset[0], 
          headY + scaledEyeOffset[1], 
          scaledHeadSize + scaledEyeOffset[2]
        ]} 
        castShadow
        material={eyeMaterial}
      >
        <sphereGeometry args={[scaledEyeSize, 8, 8]} />
      </mesh>


      {/* Left Arm */}
      <group 
        ref={leftArmRef}
        position={[-armX, armY, 0]}
        rotation={[config.animation.idleArmRotation, 0, 0]}
      >
        <mesh 
          position={[0, -scaledArmLength / 2, 0]} 
          castShadow 
          receiveShadow
          material={bodyMaterial}
        >
          <cylinderGeometry args={[scaledArmThickness, scaledArmThickness, scaledArmLength, 8]} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group 
        ref={rightArmRef}
        position={[armX, armY, 0]}
        rotation={[config.animation.idleArmRotation, 0, 0]}
      >
        <mesh 
          position={[0, -scaledArmLength / 2, 0]} 
          castShadow 
          receiveShadow
          material={bodyMaterial}
        >
          <cylinderGeometry args={[scaledArmThickness, scaledArmThickness, scaledArmLength, 8]} />
        </mesh>
      </group>

      {/* Left Leg */}
      <mesh 
        position={[-scaledBodySize[0] * 0.25, legY - scaledLegLength / 2, 0]} 
        castShadow 
        receiveShadow
        material={bodyMaterial}
      >
        <cylinderGeometry args={[scaledLegThickness, scaledLegThickness, scaledLegLength, 8]} />
      </mesh>

      {/* Right Leg */}
      <mesh 
        position={[scaledBodySize[0] * 0.25, legY - scaledLegLength / 2, 0]} 
        castShadow 
        receiveShadow
        material={bodyMaterial}
      >
        <cylinderGeometry args={[scaledLegThickness, scaledLegThickness, scaledLegLength, 8]} />
      </mesh>
      </group>
    </RigidBody>
  )
}
