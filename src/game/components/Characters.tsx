import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
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
        const patrolX = Math.sin(state.clock.elapsedTime * 0.3 + i * Math.PI) * 5
        soldierRef.setTranslation({
          x: (i - 2) * 20 + patrolX,
          y: soldierRef.translation().y,
          z: -2
        }, true)
      }
    })

    // Adventurers idle animation
    adventurerRefs.current.forEach((adventurerRef, i) => {
      if (adventurerRef) {
        adventurerRef.rotation.y = Math.sin(state.clock.elapsedTime + i * 2) * 0.2
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
          position={[(i - 2) * 20, 0, -2]}
        >
          <group scale={1.5}>
            <primitive object={soldier.scene.clone()} castShadow receiveShadow />
            {/* Soldier team indicator */}
            <mesh position={[0, 2.5, 0]}>
              <sphereGeometry args={[0.2]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? '#0066ff' : '#ff0066'}
                emissive={i % 2 === 0 ? '#0066ff' : '#ff0066'}
                emissiveIntensity={0.5}
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
          <primitive object={adventurer.scene.clone()} scale={1.5} castShadow />
        </group>
      ))}

      {/* Group of soldiers near buildings */}
      <RigidBody type="fixed" position={[-40, 0, -5]}>
        <group>
          {[...Array(3)].map((_, i) => (
            <group key={`static-soldier-${i}`} position={[i * 2 - 2, 0, i * 0.5]}>
              <primitive object={soldier.scene.clone()} scale={1.3} castShadow />
            </group>
          ))}
        </group>
      </RigidBody>

      {/* Adventurer near the fort */}
      <RigidBody type="fixed" position={[-35, 0, -8]}>
        <group scale={1.8}>
          <primitive object={adventurer.scene.clone()} castShadow receiveShadow />
        </group>
      </RigidBody>

      {/* Soldiers defending the fortress */}
      <RigidBody type="fixed" position={[40, 0, -8]}>
        <group>
          {[...Array(2)].map((_, i) => (
            <group key={`fortress-soldier-${i}`} position={[i * 3 - 1.5, 0, 0]}>
              <primitive object={soldier.scene.clone()} scale={1.4} castShadow />
            </group>
          ))}
        </group>
      </RigidBody>
    </>
  )
}

export default Characters