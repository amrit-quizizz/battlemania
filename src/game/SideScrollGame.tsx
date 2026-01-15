import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import { Physics } from '@react-three/rapier'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import CleanBattleScene from './components/CleanBattleScene'

// Component to set scene background color
function SceneBackground() {
  const { scene } = useThree()
  useEffect(() => {
    scene.background = new THREE.Color('#87CEEB')
  }, [scene])
  return null
}

function SideScrollGame() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#87CEEB',
      position: 'relative'
    }}>
      <Canvas shadows gl={{ alpha: false, antialias: true }}>
        {/* Side-view camera for 2.5D perspective - lowered significantly to eliminate brown space */}
        <PerspectiveCamera
          makeDefault
          position={[0, -2.5, 9]}
          fov={60}
          near={0.1}
          far={100}
        />

        {/* Blue fog to fill empty space in the distance */}
        <fog attach="fog" color="#87CEEB" near={50} far={100} />

        {/* Blue background color for empty space */}
        <SceneBackground />
        <color attach="background" args={['#87CEEB']} />

        {/* Physics world with gravity */}
        <Physics gravity={[0, -9.81, 0]} debug={false}>
          <Suspense fallback={null}>
            <CleanBattleScene />
          </Suspense>
        </Physics>
      </Canvas>

      {/* HUD Overlay */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: 'white',
        fontSize: '18px',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
      }}>
        <div>Battle Mania - Tank Battle</div>
        <div style={{ fontSize: '14px', marginTop: '10px' }}>
          Player 1: A/D to move, W to jump, Space to fire
        </div>
        <div style={{ fontSize: '14px' }}>
          Player 2: Arrow keys to move, Up to jump, Enter to fire
        </div>
      </div>

      {/* Score Display */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        color: 'white',
        fontSize: '24px',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
      }}>
        <div>Score: 0</div>
      </div>
    </div>
  )
}

export default SideScrollGame