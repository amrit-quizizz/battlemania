import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import { Physics } from '@react-three/rapier'
import { PerspectiveCamera } from '@react-three/drei'
import { cameraConfig, environmentConfig, physicsConfig } from './config/gameConfig'
import { HealthBarOverlay } from './components/HealthBarOverlay'
import { ScoreCard } from './components/ScoreCard'
import { resetHealth, registerHealthChangeListener } from './utils/healthDamageSystem'
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
  // Initialize health system on mount
  useEffect(() => {
    // Reset health when component mounts
    resetHealth()
    
    // Subscribe to health changes (can be used for additional effects)
    const unsubscribe = registerHealthChangeListener((event) => {
      // Health change event received - can be used for additional effects
      // For example: play sound, trigger screen shake, etc.
      console.log(`Health changed for ${event.playerId}: ${event.oldHealth} -> ${event.newHealth}`)
    })
    
    return () => {
      unsubscribe()
    }
  }, [])

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

      {/* Damage Numbers Overlay */}
      <HealthBarOverlay />

      {/* Score Cards - Left and Right */}
      <ScoreCard side="left" player="player1" teamName="TEAM A" teamColor="#0066ff" />
      <ScoreCard side="right" player="player2" teamName="TEAM B" teamColor="#ff0066" />
    </div>
  )
}

export default SideScrollGame