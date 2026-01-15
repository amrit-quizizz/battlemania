import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'

function Vehicles() {
  // Load vehicle models
  const truck = useGLTF('/models/M939 Truck.glb')
  const catapult = useGLTF('/models/Catapult.glb')
  const tank = useGLTF('/models/Tank.glb')
  const turret = useGLTF('/models/Turret.glb')

  // Refs for moving vehicles
  const truckRef = useRef<THREE.Group>(null)
  const tankRef = useRef<THREE.Group>(null)

  // Animate moving vehicles
  useFrame((state) => {
    // Truck moving slowly
    if (truckRef.current) {
      truckRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 30
    }

    // Tank patrolling
    if (tankRef.current) {
      tankRef.current.position.x = Math.cos(state.clock.elapsedTime * 0.08) * 25 + 10
    }
  })

  return (
    <>
      {/* Static Tank - left side */}
      <RigidBody type="fixed" position={[-45, 0, -2]}>
        <group scale={2}>
          <primitive object={tank.scene.clone()} castShadow receiveShadow />
        </group>
      </RigidBody>

      {/* Turret - right side */}
      <RigidBody type="fixed" position={[45, 0, -1]}>
        <group scale={2}>
          <primitive object={turret.scene.clone()} castShadow receiveShadow />
        </group>
      </RigidBody>

      {/* Catapult */}
      <RigidBody type="fixed" position={[-25, 0, -3]}>
        <group scale={1.5} rotation={[0, Math.PI / 4, 0]}>
          <primitive object={catapult.scene.clone()} castShadow receiveShadow />
        </group>
      </RigidBody>

      {/* Moving Truck */}
      <group ref={truckRef} position={[0, 0, -5]}>
        <primitive object={truck.scene.clone()} scale={1.5} castShadow />
      </group>

      {/* Moving Tank patrol */}
      <group ref={tankRef} position={[10, 0, -4]}>
        <primitive object={tank.scene.clone()} scale={1.2} castShadow />
      </group>

      {/* Additional static tank */}
      <RigidBody type="fixed" position={[25, 0, -3]}>
        <group scale={1.5}>
          <primitive object={tank.scene.clone()} castShadow receiveShadow />
        </group>
      </RigidBody>
    </>
  )
}

export default Vehicles