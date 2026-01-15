import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import { Physics } from '@react-three/rapier'
import { PerspectiveCamera } from '@react-three/drei'
import { cameraConfig, environmentConfig, physicsConfig, uiConfig } from './config/gameConfig'
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
      backgroundColor: environmentConfig.sky.primaryColor,
      position: 'relative'
    }}>
      <Canvas shadows gl={{ alpha: cameraConfig.canvas.alpha, antialias: cameraConfig.canvas.antialias }}>
        {/* Side-view camera for 2.5D perspective - lowered significantly to eliminate brown space */}
        <PerspectiveCamera
          makeDefault
          position={cameraConfig.perspective.position}
          fov={cameraConfig.perspective.fov}
          near={cameraConfig.perspective.near}
          far={cameraConfig.perspective.far}
        />

        {/* Blue fog to fill empty space in the distance */}
        <fog attach="fog" color={environmentConfig.fog.color} near={environmentConfig.fog.near} far={environmentConfig.fog.far} />

        {/* Blue background color for empty space */}
        <SceneBackground />
        <color attach="background" args={[environmentConfig.sky.primaryColor]} />

        {/* Physics world with gravity */}
        <Physics gravity={physicsConfig.gravity} debug={false}>
          <Suspense fallback={null}>
            <CleanBattleScene />
          </Suspense>
        </Physics>
      </Canvas>

      {/* HUD Overlay */}
      <div style={{
        position: 'absolute',
        top: uiConfig.hud.topLeft.top,
        left: uiConfig.hud.topLeft.left,
        color: uiConfig.text.color,
        fontSize: uiConfig.fonts.subtitleSize,
        fontWeight: uiConfig.fonts.titleWeight,
        fontFamily: uiConfig.fonts.family,
        textShadow: uiConfig.text.shadow
      }}>
        <div>Battle Mania - Tank Battle</div>
        <div style={{ fontSize: uiConfig.fonts.instructionSize, marginTop: '10px' }}>
          Player 1: A/D to move, W to jump, Space to fire
        </div>
        <div style={{ fontSize: uiConfig.fonts.instructionSize }}>
          Player 2: Arrow keys to move, Up to jump, Enter to fire
        </div>
      </div>

      {/* Score Display */}
      <div style={{
        position: 'absolute',
        top: uiConfig.hud.topRight.top,
        right: uiConfig.hud.topRight.right,
        color: uiConfig.text.color,
        fontSize: uiConfig.fonts.titleSize,
        fontWeight: uiConfig.fonts.titleWeight,
        fontFamily: uiConfig.fonts.family,
        textShadow: uiConfig.text.shadow
      }}>
        <div>Score: 0</div>
      </div>
    </div>
  )
}

export default SideScrollGame