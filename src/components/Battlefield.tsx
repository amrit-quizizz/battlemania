import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import { Terrain } from './Terrain';
import { Tank } from './Tank';
import { Artillery } from './Artillery';
import { Missile } from './Missile';
import { GameLoop } from './GameLoop';
import { useGameStore } from '../store/gameStore';

export function Battlefield() {
  const units = useGameStore((state) => state.units);
  const missiles = useGameStore((state) => state.missiles);
  const selectUnit = useGameStore((state) => state.selectUnit);

  return (
    <Canvas
      shadows
      onClick={() => selectUnit(null)}
      style={{ background: 'linear-gradient(to bottom, #1a1a2e 0%, #16213e 100%)' }}
    >
      <Suspense fallback={null}>
        {/* Camera with isometric-like angle */}
        <PerspectiveCamera
          makeDefault
          position={[0, 20, 25]}
          fov={45}
        />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#ff6b6b" />
        <pointLight position={[10, 10, -10]} intensity={0.5} color="#4ecdc4" />

        {/* Sky/atmosphere */}
        <Stars radius={100} depth={50} count={1000} factor={4} fade speed={1} />
        <fog attach="fog" args={['#1a1a2e', 30, 60]} />

        {/* Environment */}
        <Terrain />

        {/* Units */}
        {units.map((unit) =>
          unit.type === 'tank' ? (
            <Tank key={unit.id} unit={unit} />
          ) : (
            <Artillery key={unit.id} unit={unit} />
          )
        )}

        {/* Missiles */}
        {missiles.map((missile) => (
          <Missile key={missile.id} missile={missile} />
        ))}

        {/* Game logic */}
        <GameLoop />

        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
        />
      </Suspense>
    </Canvas>
  );
}
