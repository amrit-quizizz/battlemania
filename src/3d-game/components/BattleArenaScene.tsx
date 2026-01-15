import { useRef, useState, Suspense, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Preload models
const MODELS = {
  tank: '/models/vehicles/Tank.glb',
  soldier: '/models/characters/Soldier.glb',
  adventurer: '/models/characters/Adventurer.glb',
  castle: '/models/buildings/Castle.glb',
  fortress: '/models/buildings/Fortress.glb',
  barracks: '/models/buildings/Barracks.glb',
  skyscraper: '/models/buildings/Skyscraper.glb',
  largeBuilding: '/models/buildings/Large Building.glb',
  tree: '/models/environment/Tree.glb',
  deadTrees: '/models/environment/Dead Trees.glb',
  cloud: '/models/environment/Cloud.glb',
  sun: '/models/environment/Sun.glb',
  turret: '/models/vehicles/Turret.glb',
  bullet: '/models/weapons/Bullet.glb'
}

// Preload all models
Object.values(MODELS).forEach(path => {
  useGLTF.preload(path)
})

// Better scale constants
const SCALES = {
  tank: 0.4,           // Main focus
  soldier: 0.15,       // Very small humans
  buildings: {
    small: 0.5,
    medium: 0.7,
    large: 0.9
  },
  trees: 0.4,
  sun: 0.5,
  cloud: 0.6,
  bullet: 0.1
}

// Safe model loader
function SafeModel({ modelPath, scale = 1, fallbackColor = '#888888' }: { modelPath: string, scale?: number | number[], fallbackColor?: string }) {
  try {
    const { scene } = useGLTF(modelPath)
    return <primitive object={scene.clone()} scale={scale} castShadow receiveShadow />
  } catch (error) {
    const size = typeof scale === 'number' ? scale : 1
    return (
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color={fallbackColor} />
      </mesh>
    )
  }
}

// Bullet Component
function Bullet({ position, velocity, onHit }: { position: [number, number, number], velocity: { x: number, y: number }, onHit?: (other: any) => void }) {
  const bulletRef = useRef<RapierRigidBody>(null)
  const [active, setActive] = useState(true)

  useFrame((state, delta) => {
    if (!bulletRef.current || !active) return

    // Move bullet
    const pos = bulletRef.current.translation()
    bulletRef.current.setTranslation({
      x: pos.x + velocity.x * delta * 10,
      y: pos.y + velocity.y * delta * 10,
      z: pos.z
    }, true)

    // Remove bullet if it goes off screen
    if (Math.abs(pos.x) > 25) {
      setActive(false)
    }
  })

  if (!active) return null

  return (
    <RigidBody
      ref={bulletRef}
      position={position}
      type="kinematicPosition"
      sensor
      onIntersectionEnter={({ other }) => {
        onHit?.(other)
        setActive(false)
      }}
    >
      <mesh>
        <sphereGeometry args={[0.1]} />
        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.5} />
      </mesh>
    </RigidBody>
  )
}

// Player Tank Component
function PlayerTank({ player, position, facing = 'right' }: { player: 'player1' | 'player2', position: [number, number, number], facing?: 'left' | 'right' }) {
  const tankRef = useRef<RapierRigidBody>(null)
  const [bullets, setBullets] = useState<Array<{ id: number, position: [number, number, number], velocity: { x: number, y: number } }>>([])
  const keysPressed = useRef<Set<string>>(new Set())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase())

      // Jump
      if (player === 'player1' && e.key === 'w' && tankRef.current) {
        tankRef.current.applyImpulse({ x: 0, y: 2, z: 0 }, true)
      }
      if (player === 'player2' && e.key === 'ArrowUp' && tankRef.current) {
        tankRef.current.applyImpulse({ x: 0, y: 2, z: 0 }, true)
      }

      // Fire
      if ((player === 'player1' && e.key === ' ') ||
          (player === 'player2' && e.key === 'Enter')) {
        fireBullet()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase())
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [player])

  const fireBullet = () => {
    const newBullet = {
      id: Date.now(),
      position: [
        position[0] + (facing === 'right' ? 1 : -1),
        position[1] + 0.3,
        position[2]
      ],
      velocity: { x: facing === 'right' ? 15 : -15, y: 0 }
    }
    setBullets(prev => [...prev, newBullet])
  }

  useFrame(() => {
    if (!tankRef.current) return

    let moveX = 0
    if (player === 'player1') {
      if (keysPressed.current.has('a')) moveX = -2
      if (keysPressed.current.has('d')) moveX = 2
    } else {
      if (keysPressed.current.has('arrowleft')) moveX = -2
      if (keysPressed.current.has('arrowright')) moveX = 2
    }

    if (moveX !== 0) {
      tankRef.current.setLinvel({ x: moveX, y: tankRef.current.linvel().y, z: 0 }, true)
    }
  })

  const rotation = facing === 'right' ? 0 : Math.PI

  return (
    <>
      <RigidBody
        ref={tankRef}
        position={position}
        colliders="hull"
        mass={5}
        friction={0.7}
        restitution={0.2}
      >
        <group scale={SCALES.tank} rotation={[0, rotation, 0]}>
          <Suspense fallback={<mesh><boxGeometry args={[2, 1, 3]} /><meshStandardMaterial color="#666" /></mesh>}>
            <SafeModel modelPath={MODELS.tank} />
          </Suspense>
          {/* Team indicator */}
          <mesh position={[0, 2, 0]}>
            <boxGeometry args={[1.5, 0.2, 0.2]} />
            <meshStandardMaterial
              color={player === 'player1' ? '#0066ff' : '#ff0066'}
              emissive={player === 'player1' ? '#0066ff' : '#ff0066'}
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      </RigidBody>

      {/* Bullets */}
      {bullets.map(bullet => (
        <Bullet
          key={bullet.id}
          position={bullet.position}
          velocity={bullet.velocity}
          onHit={() => {
            setBullets(prev => prev.filter(b => b.id !== bullet.id))
          }}
        />
      ))}
    </>
  )
}

// Background buildings
function BackgroundBuildings() {
  return (
    <>
      {/* Far background buildings */}
      <group position={[-12, -0.5, -6]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.castle} scale={SCALES.buildings.medium} />
        </Suspense>
      </group>

      <group position={[-6, -0.5, -5]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.barracks} scale={SCALES.buildings.small} />
        </Suspense>
      </group>

      <group position={[0, -0.5, -6]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.largeBuilding} scale={SCALES.buildings.medium} />
        </Suspense>
      </group>

      <group position={[6, -0.5, -5]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.fortress} scale={SCALES.buildings.medium} />
        </Suspense>
      </group>

      <group position={[12, -0.5, -7]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.skyscraper} scale={SCALES.buildings.large} />
        </Suspense>
      </group>
    </>
  )
}

// Small humans scattered around
function TinyHumans() {
  return (
    <>
      {/* Small soldiers between tanks */}
      <group position={[-2, 0, 0.5]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.soldier} scale={SCALES.soldier} />
        </Suspense>
      </group>

      <group position={[0, 0, 0.5]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.adventurer} scale={SCALES.soldier} />
        </Suspense>
      </group>

      <group position={[2, 0, 0.5]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.soldier} scale={SCALES.soldier} />
        </Suspense>
      </group>

      {/* Soldiers near buildings */}
      <group position={[-8, 0, -2]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.soldier} scale={SCALES.soldier} />
        </Suspense>
      </group>

      <group position={[8, 0, -2]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.adventurer} scale={SCALES.soldier} />
        </Suspense>
      </group>
    </>
  )
}

// Sky and environment
function SkyEnvironment() {
  const cloudRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (cloudRef.current) {
      cloudRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.05) * 8
    }
  })

  return (
    <>
      {/* Sun - positioned high but visible */}
      <group position={[8, 3.5, -8]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.sun} scale={SCALES.sun} />
        </Suspense>
        <pointLight intensity={1} color="#ffaa00" />
      </group>

      {/* Clouds */}
      <group ref={cloudRef} position={[0, 3, -5]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.cloud} scale={SCALES.cloud} />
        </Suspense>
      </group>

      <group position={[-6, 3.2, -4]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.cloud} scale={SCALES.cloud * 0.8} />
        </Suspense>
      </group>
    </>
  )
}

// Main Battle Arena Scene
function BattleArenaScene() {
  return (
    <>
      {/* Ground - lowered to prevent clipping */}
      <RigidBody type="fixed" position={[0, -0.5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[40, 1, 8]} />
          <meshStandardMaterial color="#8B7355" />
        </mesh>
      </RigidBody>

      {/* Sky backdrop - lowered */}
      <mesh position={[0, 2, -10]}>
        <planeGeometry args={[50, 12]} />
        <meshBasicMaterial color="#87CEEB" />
      </mesh>

      {/* Mountains - smaller and lower */}
      {[...Array(3)].map((_, i) => (
        <mesh key={`mountain-${i}`} position={[(i - 1) * 10, 0, -8]}>
          <coneGeometry args={[3, 3.5, 4]} />
          <meshStandardMaterial color="#4a5568" />
        </mesh>
      ))}

      {/* Sky Environment */}
      <SkyEnvironment />

      {/* Background Buildings */}
      {/* <BackgroundBuildings /> */}

      {/* Trees */}
      <RigidBody type="fixed" position={[-10, 0, -3]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.tree} scale={SCALES.trees} />
        </Suspense>
      </RigidBody>

      <RigidBody type="fixed" position={[10, 0, -3]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.deadTrees} scale={SCALES.trees * 0.8} />
        </Suspense>
      </RigidBody>

      {/* Player 1 Tank - Left side, facing right */}
      <PlayerTank
        player="player1"
        position={[-8, 0.5, 0]}
        facing="right"
      />

      {/* Player 2 Tank - Right side, facing left */}
      <PlayerTank
        player="player2"
        position={[8, 0.5, 0]}
        facing="left"
      />

      {/* Tiny Humans */}
      <TinyHumans />

      {/* Central obstacles */}
      <RigidBody type="fixed" position={[-3, 0, -1]}>
        <mesh castShadow>
          <boxGeometry args={[1, 0.5, 1]} />
          <meshStandardMaterial color="#666" />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" position={[3, 0, -1]}>
        <mesh castShadow>
          <boxGeometry args={[1, 0.5, 1]} />
          <meshStandardMaterial color="#666" />
        </mesh>
      </RigidBody>

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} castShadow />
    </>
  )
}

export default BattleArenaScene