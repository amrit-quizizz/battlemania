import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

function SkyEnvironment() {
  const cloudModel = useGLTF('/models/Cloud.glb')
  const cloudsModel = useGLTF('/models/Clouds.glb')
  const sunModel = useGLTF('/models/Sun.glb')
  const airplaneModel = useGLTF('/models/Airplane.glb')
  const helicopterModel = useGLTF('/models/Helicopter.glb')

  const airplaneRef = useRef<THREE.Group>(null)
  const helicopterRef = useRef<THREE.Group>(null)
  const cloudsRef = useRef<THREE.Group[]>([])

  // Animate flying objects
  useFrame((state) => {
    // Animate airplane
    if (airplaneRef.current) {
      airplaneRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.2) * 50
      airplaneRef.current.position.y = 25 + Math.sin(state.clock.elapsedTime * 0.3) * 2
    }

    // Animate helicopter
    if (helicopterRef.current) {
      helicopterRef.current.position.x = Math.cos(state.clock.elapsedTime * 0.15) * 40
      helicopterRef.current.position.y = 20 + Math.sin(state.clock.elapsedTime * 0.4) * 3
    }

    // Animate clouds
    cloudsRef.current.forEach((cloud, i) => {
      if (cloud) {
        cloud.position.x += 0.02 * (i + 1)
        if (cloud.position.x > 60) {
          cloud.position.x = -60
        }
      }
    })
  })

  return (
    <>
      {/* Sun */}
      <group position={[30, 35, -50]}>
        <primitive object={sunModel.scene.clone()} scale={5} />
        <pointLight intensity={2} color="#ffaa00" />
      </group>

      {/* Multiple clouds at different heights */}
      {[...Array(8)].map((_, i) => (
        <group
          key={`cloud-${i}`}
          ref={(el) => {
            if (el) cloudsRef.current[i] = el
          }}
          position={[
            (i - 4) * 15,
            15 + Math.random() * 10,
            -30 - Math.random() * 10
          ]}
        >
          <primitive
            object={i % 2 === 0 ? cloudModel.scene.clone() : cloudsModel.scene.clone()}
            scale={1 + Math.random()}
          />
        </group>
      ))}

      {/* Airplane */}
      <group ref={airplaneRef} position={[0, 25, -20]}>
        <primitive object={airplaneModel.scene.clone()} scale={2} />
      </group>

      {/* Helicopter */}
      <group ref={helicopterRef} position={[20, 20, -15]}>
        <primitive object={helicopterModel.scene.clone()} scale={1.5} />
      </group>
    </>
  )
}

export default SkyEnvironment