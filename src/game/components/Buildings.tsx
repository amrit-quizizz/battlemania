import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'

function Buildings() {
  // Load all building models
  const castle = useGLTF('/models/Castle.glb')
  const fortress = useGLTF('/models/Fortress.glb')
  const barracks = useGLTF('/models/Barracks.glb')
  const skyscraper = useGLTF('/models/Skyscraper.glb')
  const largeBuilding = useGLTF('/models/Large Building.glb')
  const archeryTowers = useGLTF('/models/Archery Towers.glb')

  return (
    <>
      {/* Castle - far left */}
      <RigidBody type="fixed" position={[-60, 0, -15]}>
        <group scale={3}>
          <primitive object={castle.scene.clone()} castShadow receiveShadow />
        </group>
      </RigidBody>

      {/* Archery Towers */}
      <RigidBody type="fixed" position={[-35, 0, -20]}>
        <group scale={2.5}>
          <primitive object={archeryTowers.scene.clone()} castShadow receiveShadow />
        </group>
      </RigidBody>

      {/* Barracks */}
      <RigidBody type="fixed" position={[-10, 0, -18]}>
        <group scale={2}>
          <primitive object={barracks.scene.clone()} castShadow receiveShadow />
        </group>
      </RigidBody>

      {/* Large Building */}
      <RigidBody type="fixed" position={[15, 0, -20]}>
        <group scale={2}>
          <primitive object={largeBuilding.scene.clone()} castShadow receiveShadow />
        </group>
      </RigidBody>

      {/* Fortress */}
      <RigidBody type="fixed" position={[40, 0, -18]}>
        <group scale={2.5}>
          <primitive object={fortress.scene.clone()} castShadow receiveShadow />
        </group>
      </RigidBody>

      {/* Skyscraper - far right */}
      <RigidBody type="fixed" position={[65, 0, -25]}>
        <group scale={4}>
          <primitive object={skyscraper.scene.clone()} castShadow receiveShadow />
        </group>
      </RigidBody>
    </>
  )
}

export default Buildings