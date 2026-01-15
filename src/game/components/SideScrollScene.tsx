import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import GroundTerrain from './GroundTerrain'
import SkyEnvironment from './SkyEnvironment'
import Buildings from './Buildings'
import Vehicles from './Vehicles'
import Characters from './Characters'
import PlayerTank from './PlayerTank'

function SideScrollScene() {
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 2 })
  const cameraRef = useRef<THREE.PerspectiveCamera>()

  // Follow player with camera
  useFrame(({ camera }) => {
    if (camera) {
      // Smooth camera follow
      camera.position.x = THREE.MathUtils.lerp(
        camera.position.x,
        playerPosition.x,
        0.1
      )
      camera.lookAt(playerPosition.x, 5, 0)
    }
  })

  return (
    <>
      {/* Sky Environment with clouds, sun, airplanes */}
      <SkyEnvironment />

      {/* Ground with physics */}
      <GroundTerrain />

      {/* Buildings in background */}
      <Buildings />

      {/* Vehicles and decorations */}
      <Vehicles />

      {/* NPCs and characters */}
      <Characters />

      {/* Player Tank */}
      <PlayerTank
        player="player1"
        initialPosition={[-10, 2, 0]}
        onPositionChange={(pos) => setPlayerPosition({ x: pos[0], y: pos[1] })}
      />

      {/* Trees and environment objects */}
      <TreesAndProps />

      {/* Lighting effects */}
      <pointLight position={[0, 10, 0]} intensity={0.5} />
    </>
  )
}

// Trees and props component
function TreesAndProps() {
  const tree = useGLTF('/models/Tree.glb')
  const deadTrees = useGLTF('/models/Dead Trees.glb')

  return (
    <>
      {/* Regular trees */}
      {[...Array(10)].map((_, i) => (
        <RigidBody key={`tree-${i}`} type="fixed" position={[i * 15 - 30, 0, -5]}>
          <primitive object={tree.scene.clone()} scale={2} />
        </RigidBody>
      ))}

      {/* Dead trees for variety */}
      {[...Array(5)].map((_, i) => (
        <RigidBody key={`dead-tree-${i}`} type="fixed" position={[i * 25 - 20, 0, -8]}>
          <primitive object={deadTrees.scene.clone()} scale={1.5} />
        </RigidBody>
      ))}
    </>
  )
}

export default SideScrollScene