import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { modelScalesConfig } from '../config/gameConfig'

function Buildings() {
  // Load all building models
  const castle = useGLTF('/models/buildings/Castle.glb')
  const fortress = useGLTF('/models/buildings/Fortress.glb')
  const barracks = useGLTF('/models/buildings/Barracks.glb')
  const skyscraper = useGLTF('/models/buildings/Skyscraper.glb')
  const largeBuilding = useGLTF('/models/buildings/Large Building.glb')
  const archeryTowers = useGLTF('/models/buildings/Archery Towers.glb')

  return (
    <>
      {/* Castle - far left */}
      <RigidBody type="fixed" position={[-60, 0, -15]}>
        <group scale={modelScalesConfig.buildings.castle * 1.67}>
          <primitive object={castle.scene.clone()} castShadow receiveShadow />
        </group>
      </RigidBody>

      {/* Archery Towers */}
      <RigidBody type="fixed" position={[-35, 0, -20]}>
        <group scale={modelScalesConfig.buildings.turretGun}>
          <primitive object={archeryTowers.scene.clone()} castShadow receiveShadow />
        </group>
      </RigidBody>

      {/* Barracks */}
      <RigidBody type="fixed" position={[-10, 0, -18]}>
        <group scale={modelScalesConfig.buildings.barracks * 1.67}>
          <primitive object={barracks.scene.clone()} castShadow receiveShadow />
        </group>
      </RigidBody>

      {/* Large Building */}
      <RigidBody type="fixed" position={[15, 0, -20]}>
        <group scale={modelScalesConfig.buildings.largeBuilding * 1.33}>
          <primitive object={largeBuilding.scene.clone()} castShadow receiveShadow />
        </group>
      </RigidBody>

      {/* Fortress */}
      <RigidBody type="fixed" position={[40, 0, -18]}>
        <group scale={modelScalesConfig.buildings.fortress * 1.67}>
          <primitive object={fortress.scene.clone()} castShadow receiveShadow />
        </group>
      </RigidBody>

      {/* Skyscraper - far right */}
      <RigidBody type="fixed" position={[65, 0, -25]}>
        <group scale={modelScalesConfig.buildings.skyscraper * 2}>
          <primitive object={skyscraper.scene.clone()} castShadow receiveShadow />
        </group>
      </RigidBody>
    </>
  )
}

export default Buildings