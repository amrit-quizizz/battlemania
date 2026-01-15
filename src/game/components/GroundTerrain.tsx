import { RigidBody } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'

function GroundTerrain() {
  const road = useGLTF('/models/Road Bits.glb')
  const path = useGLTF('/models/Path Straight.glb')

  return (
    <>
      {/* Main ground plane with physics */}
      <RigidBody type="fixed" position={[0, -2, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[200, 4, 20]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
      </RigidBody>

      {/* Road sections */}
      {[...Array(10)].map((_, i) => (
        <group key={`road-${i}`} position={[i * 10 - 50, 0, 0]}>
          <primitive object={road.scene.clone()} scale={2} />
        </group>
      ))}

      {/* Path decorations */}
      <group position={[0, 0, -5]}>
        <primitive object={path.scene.clone()} scale={[10, 1, 1]} />
      </group>

      {/* Hills and terrain variation */}
      <RigidBody type="fixed" position={[-20, -1, -10]}>
        <mesh receiveShadow castShadow>
          <sphereGeometry args={[8, 16, 16]} />
          <meshStandardMaterial color="#8B7355" />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" position={[30, -1, -12]}>
        <mesh receiveShadow castShadow>
          <sphereGeometry args={[10, 16, 16]} />
          <meshStandardMaterial color="#8B7355" />
        </mesh>
      </RigidBody>
    </>
  )
}

export default GroundTerrain