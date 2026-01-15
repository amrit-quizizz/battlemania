import { Canvas } from '@react-three/fiber'
import { OrthographicCamera, Grid } from '@react-three/drei'
import { Suspense } from 'react'
import { cameraConfig, lightingConfig, uiConfig } from './config/gameConfig'
import GameScene from './components/GameScene'

function Game() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: uiConfig.background.main,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Game container - 75% of viewport */}
      <div style={{
        width: uiConfig.container.width,
        height: uiConfig.container.height,
        backgroundColor: uiConfig.background.container,
        borderRadius: uiConfig.container.borderRadius,
        overflow: 'hidden',
        boxShadow: uiConfig.container.boxShadow,
        position: 'relative'
      }}>
        <Canvas
          dpr={cameraConfig.dpr}
          gl={{ antialias: cameraConfig.canvas.antialias }}
          style={{ imageRendering: cameraConfig.canvas.imageRendering }}
        >
          {/* Orthographic camera for 2.5D view */}
          <OrthographicCamera
            makeDefault
            position={cameraConfig.orthographic.position}
            zoom={cameraConfig.orthographic.zoom}
            near={cameraConfig.orthographic.near}
            far={cameraConfig.orthographic.far}
            rotation={cameraConfig.orthographic.rotation}
          />

          {/* Ambient lighting - brighter */}
          <ambientLight intensity={lightingConfig.ambientIntensityAlternative} />

          {/* Directional light for shadows and depth */}
          <directionalLight
            position={lightingConfig.directionalMain.position}
            intensity={lightingConfig.directionalMain.intensity}
            castShadow={lightingConfig.directionalMain.castShadow}
            shadow-mapSize-width={lightingConfig.directionalMain.shadowMapSize[0]}
            shadow-mapSize-height={lightingConfig.directionalMain.shadowMapSize[1]}
            shadow-camera-far={lightingConfig.directionalMain.shadowCameraFar}
            shadow-camera-left={lightingConfig.directionalMain.shadowCameraLeft}
            shadow-camera-right={lightingConfig.directionalMain.shadowCameraRight}
            shadow-camera-top={lightingConfig.directionalMain.shadowCameraTop}
            shadow-camera-bottom={lightingConfig.directionalMain.shadowCameraBottom}
          />

          {/* Additional light from front */}
          <directionalLight
            position={lightingConfig.directionalFill.position}
            intensity={lightingConfig.directionalFill.intensity}
          />

          {/* Grid helper for development */}
          <Grid
            args={[60, 60]}
            cellSize={2}
            sectionSize={10}
            fadeDistance={60}
            fadeStrength={1}
            cellColor={'#6e6e6e'}
            sectionColor={'#9e9e9e'}
          />

          <Suspense fallback={null}>
            <GameScene />
          </Suspense>
        </Canvas>

        {/* HUD Overlay */}
        <div style={{
          position: 'absolute',
          top: uiConfig.hud.topLeft.top,
          left: uiConfig.hud.topLeft.left,
          color: uiConfig.text.color,
          fontSize: uiConfig.fonts.standardSize,
          fontFamily: uiConfig.fonts.family,
          textShadow: uiConfig.text.shadowAlternative
        }}>
          <div>Player 1: WASD to move, Space to fire</div>
          <div>Player 2: Arrow keys to move, Enter to fire</div>
        </div>

        {/* Game Title */}
        <div style={{
          position: 'absolute',
          top: uiConfig.hud.topRight.top,
          right: uiConfig.hud.topRight.right,
          color: uiConfig.text.color,
          fontSize: uiConfig.fonts.titleSize,
          fontWeight: uiConfig.fonts.titleWeight,
          fontFamily: uiConfig.fonts.family,
          textShadow: uiConfig.text.shadowAlternative
        }}>
          Battle Mania
        </div>
      </div>
    </div>
  )
}

export default Game