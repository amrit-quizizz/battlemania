import { Canvas } from '@react-three/fiber'
import { OrthographicCamera, Grid } from '@react-three/drei'
import { Suspense } from 'react'
import GameScene from './components/GameScene'

function Game() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#2a2a2a',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Game container - 75% of viewport */}
      <div style={{
        width: '85%',
        height: '85%',
        backgroundColor: '#87CEEB',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        position: 'relative'
      }}>
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: false }}
          style={{ imageRendering: 'pixelated' }}
        >
          {/* Orthographic camera for 2.5D view */}
          <OrthographicCamera
            makeDefault
            position={[0, 25, 20]}
            zoom={20}
            near={0.1}
            far={1000}
            rotation={[-0.8, 0, 0]}
          />

          {/* Ambient lighting - brighter */}
          <ambientLight intensity={0.8} />

          {/* Directional light for shadows and depth */}
          <directionalLight
            position={[10, 20, 10]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />

          {/* Additional light from front */}
          <directionalLight
            position={[-10, 15, 15]}
            intensity={0.5}
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
          top: '20px',
          left: '20px',
          color: 'white',
          fontSize: '16px',
          fontFamily: 'monospace',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          <div>Player 1: WASD to move, Space to fire</div>
          <div>Player 2: Arrow keys to move, Enter to fire</div>
        </div>

        {/* Game Title */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          Battle Mania
        </div>
      </div>
    </div>
  )
}

export default Game