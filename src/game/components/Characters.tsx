import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { modelScalesConfig, animationConfig, playerConfig } from '../config/gameConfig'
import * as THREE from 'three'

function Characters() {
  // Load character models
  const soldier = useGLTF('/models/Soldier.glb')
  const adventurer = useGLTF('/models/Adventurer.glb')

  // Refs for animated soldiers
  const soldierRefs = useRef<(RapierRigidBody | null)[]>([])
  const adventurerRefs = useRef<(THREE.Group | null)[]>([])

  // Animate characters
  useFrame((state) => {
    // Make soldiers patrol
    soldierRefs.current.forEach((soldierRef, i) => {
      if (soldierRef) {
        const patrolX = Math.sin(state.clock.elapsedTime * animationConfig.characters.patrolSpeed + i * Math.PI) * animationConfig.characters.patrolAmplitude
        soldierRef.setTranslation({
          x: (i - 2) * animationConfig.characters.patrolSpacing + patrolX,
          y: soldierRef.translation().y,
          z: -2
        }, true)
      }
    })

    // Adventurers idle animation
    adventurerRefs.current.forEach((adventurerRef, i) => {
      if (adventurerRef) {
        adventurerRef.rotation.y = Math.sin(state.clock.elapsedTime * animationConfig.characters.idleRotationSpeed + i * 2) * animationConfig.characters.idleRotationAmplitude
      }
    })
  })

  return (
    <>
      {/* Patrolling Soldiers */}
      {[...Array(5)].map((_, i) => (
        <RigidBody
          key={`soldier-${i}`}
          ref={(el) => {
            if (el) soldierRefs.current[i] = el
          }}
          type="kinematicPosition"
          position={[(i - 2) * animationConfig.characters.patrolSpacing, 0, -2]}
        >
          <group scale={modelScalesConfig.characters.soldier}>
            <primitive object={soldier.scene.clone()} castShadow receiveShadow />
            {/* Soldier team indicator */}
            <mesh position={playerConfig.teamIndicatorPositions.elevated}>
              <sphereGeometry args={[0.2]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? playerConfig.player1Color : playerConfig.player2Color}
                emissive={i % 2 === 0 ? playerConfig.player1Color : playerConfig.player2Color}
                emissiveIntensity={playerConfig.teamIndicatorEmissiveIntensity}
              />
            </mesh>
          </group>
        </RigidBody>
      ))}

      {/* Static Adventurers at various locations */}
      {[...Array(3)].map((_, i) => (
        <group
          key={`adventurer-${i}`}
          ref={(el) => {
            if (el) adventurerRefs.current[i] = el
          }}
          position={[(i - 1) * 30 + 5, 0, -6]}
        >
          <primitive object={adventurer.scene.clone()} scale={modelScalesConfig.characters.adventurer} castShadow />
        </group>
      ))}

      {/* Group of soldiers near buildings */}
      <RigidBody type="fixed" position={[-40, 0, -5]}>
        <group>
          {[...Array(3)].map((_, i) => (
            <group key={`static-soldier-${i}`} position={[i * 2 - 2, 0, i * 0.5]}>
              <primitive object={soldier.scene.clone()} scale={modelScalesConfig.characters.alternatives.small} castShadow />
            </group>
          ))}
        </group>
      </RigidBody>

      {/* Adventurer near the fort */}
      <RigidBody type="fixed" position={[-35, 0, -8]}>
        <group scale={modelScalesConfig.characters.alternatives.extraLarge}>
          <primitive object={adventurer.scene.clone()} castShadow receiveShadow />
        </group>
      </RigidBody>

      {/* Soldiers defending the fortress */}
      <RigidBody type="fixed" position={[40, 0, -8]}>
        <group>
          {[...Array(2)].map((_, i) => (
            <group key={`fortress-soldier-${i}`} position={[i * 3 - 1.5, 0, 0]}>
              <primitive object={soldier.scene.clone()} scale={modelScalesConfig.characters.alternatives.medium} castShadow />
            </group>
          ))}
        </group>
      </RigidBody>
    </>
  )
}

export default Characters