import { RigidBody } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import { environmentConfig, modelScalesConfig } from '../config/gameConfig'

function GroundTerrain() {
  const road = useGLTF('/models/Road Bits.glb')
  const path = useGLTF('/models/Path Straight.glb')
  const { terrain } = environmentConfig

  return (
    <>
      {/* Main ground plane with physics */}
      <RigidBody type="fixed" position={terrain.mainPosition}>
        <mesh receiveShadow>
          <boxGeometry args={terrain.mainSize} />
          <meshStandardMaterial color={terrain.mainColor} />
        </mesh>
      </RigidBody>

      {/* Road sections */}
      {[...Array(terrain.roadSectionCount)].map((_, i) => (
        <group key={`road-${i}`} position={[i * terrain.roadSectionSpacing - 50, 0, 0]}>
          <primitive object={road.scene.clone()} scale={modelScalesConfig.road.bits} />
        </group>
      ))}

      {/* Path decorations */}
      <group position={[0, 0, -5]}>
        <primitive object={path.scene.clone()} scale={[10, 1, 1]} />
      </group>

      {/* Hills and terrain variation */}
      {terrain.hills.map((hill, i) => (
        <RigidBody key={`hill-${i}`} type="fixed" position={hill.position}>
          <mesh receiveShadow castShadow>
            <sphereGeometry args={[hill.radius, hill.segments, hill.segments]} />
            <meshStandardMaterial color={hill.color} />
          </mesh>
        </RigidBody>
      ))}
    </>
  )
}

export default GroundTerrain