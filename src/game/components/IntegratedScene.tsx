import { useRef, useState, Suspense, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'

// Preload all models
const MODELS = {
  tank: '/models/Tank.glb',
  soldier: '/models/Soldier.glb',
  adventurer: '/models/Adventurer.glb',
  castle: '/models/Castle.glb',
  fortress: '/models/Fortress.glb',
  barracks: '/models/Barracks.glb',
  skyscraper: '/models/Skyscraper.glb',
  largeBuilding: '/models/Large Building.glb',
  archeryTowers: '/models/Archery Towers.glb',
  truck: '/models/M939 Truck.glb',
  catapult: '/models/Catapult.glb',
  turret: '/models/Turret.glb',
  airplane: '/models/Airplane.glb',
  helicopter: '/models/Helicopter.glb',
  cloud: '/models/Cloud.glb',
  clouds: '/models/Clouds.glb',
  sun: '/models/Sun.glb',
  tree: '/models/Tree.glb',
  deadTrees: '/models/Dead Trees.glb',
  road: '/models/Road Bits.glb',
  path: '/models/Path Straight.glb'
}

// Preload models
Object.values(MODELS).forEach(path => {
  useGLTF.preload(path)
})

// SCALE CONSTANTS - Tank is our reference (0.5 for 15% viewport)
const SCALES = {
  tank: 0.5,           // Base unit - 15% of viewport height
  soldier: 0.3,        // 60% of tank height
  buildings: {
    small: 0.8,        // 1.6x tank height
    medium: 1.2,       // 2.4x tank height
    large: 1.6         // 3.2x tank height
  },
  trees: 0.6,          // 1.2x tank height
  vehicles: 0.45,      // Similar to tank
  clouds: 0.8,         // Background elements
  sun: 0.6
}

// Model wrapper with fallback
function SafeModel({ modelPath, scale = 1, fallbackColor = '#888888' }: { modelPath: string, scale?: number, fallbackColor?: string }) {
  try {
    const { scene } = useGLTF(modelPath)
    return <primitive object={scene.clone()} scale={scale} castShadow receiveShadow />
  } catch (error) {
    console.log(`Failed to load ${modelPath}, using fallback`)
    return (
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1 * scale, 1 * scale, 1 * scale]} />
        <meshStandardMaterial color={fallbackColor} />
      </mesh>
    )
  }
}

// Player Tank Component
function PlayerTank({ player, position }: { player: 'player1' | 'player2', position: [number, number, number] }) {
  const tankRef = useRef<RapierRigidBody>(null)
  const keysPressed = useRef<Set<string>>(new Set())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase())

      // Jump with reduced force
      if (player === 'player1' && e.key === 'w' && tankRef.current) {
        tankRef.current.applyImpulse({ x: 0, y: 3, z: 0 }, true)
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

  useFrame(() => {
    if (!tankRef.current) return

    let moveX = 0
    if (player === 'player1') {
      if (keysPressed.current.has('a')) moveX = -2
      if (keysPressed.current.has('d')) moveX = 2
    }

    if (moveX !== 0) {
      tankRef.current.setLinvel({ x: moveX, y: tankRef.current.linvel().y, z: 0 }, true)
    }
  })

  return (
    <RigidBody
      ref={tankRef}
      position={position}
      colliders="hull"
      mass={5}
      friction={0.7}
      restitution={0.2}
    >
      <group scale={SCALES.tank}>
        <Suspense fallback={<mesh><boxGeometry args={[2, 1, 3]} /><meshStandardMaterial color="#666" /></mesh>}>
          <SafeModel modelPath={MODELS.tank} />
        </Suspense>
        {/* Team indicator - smaller */}
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
  )
}

// Sky Environment - Background elements
function SkyElements() {
  const cloudRef = useRef<THREE.Group>(null)
  const cloudRef2 = useRef<THREE.Group>(null)
  const airplaneRef = useRef<THREE.Group>(null)
  const helicopterRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (cloudRef.current) {
      cloudRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.05) * 10
    }
    if (cloudRef2.current) {
      cloudRef2.current.position.x = Math.cos(state.clock.elapsedTime * 0.03) * 12 - 5
    }
    if (airplaneRef.current) {
      airplaneRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.2) * 15
      airplaneRef.current.position.y = 5 + Math.sin(state.clock.elapsedTime * 0.3) * 0.5
    }
    if (helicopterRef.current) {
      helicopterRef.current.position.x = Math.cos(state.clock.elapsedTime * 0.15) * 12
      helicopterRef.current.position.y = 4.5 + Math.sin(state.clock.elapsedTime * 0.4) * 0.5
    }
  })

  return (
    <>
      {/* Sun - smaller and positioned better */}
      <group position={[10, 6, -15]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.sun} scale={SCALES.sun} />
        </Suspense>
        <pointLight intensity={1} color="#ffaa00" />
      </group>

      {/* Clouds - multiple at different positions */}
      <group ref={cloudRef} position={[0, 5, -10]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.cloud} scale={SCALES.clouds} />
        </Suspense>
      </group>

      <group ref={cloudRef2} position={[-8, 5.5, -8]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.clouds} scale={SCALES.clouds * 0.8} />
        </Suspense>
      </group>

      {/* Airplane - smaller */}
      <group ref={airplaneRef} position={[0, 5, -7]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.airplane} scale={SCALES.vehicles * 0.5} />
        </Suspense>
      </group>

      {/* Helicopter - smaller */}
      <group ref={helicopterRef} position={[8, 4.5, -6]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.helicopter} scale={SCALES.vehicles * 0.4} />
        </Suspense>
      </group>
    </>
  )
}

// Buildings Component - Properly scaled
function Buildings() {
  return (
    <>
      {/* Castle - large building */}
      <RigidBody type="fixed" position={[-15, 0, -5]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.castle} scale={SCALES.buildings.large} />
        </Suspense>
      </RigidBody>

      {/* Archery Towers - medium */}
      <RigidBody type="fixed" position={[-10, 0, -4]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.archeryTowers} scale={SCALES.buildings.medium} />
        </Suspense>
      </RigidBody>

      {/* Barracks - small */}
      <RigidBody type="fixed" position={[-5, 0, -3]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.barracks} scale={SCALES.buildings.small} />
        </Suspense>
      </RigidBody>

      {/* Large Building - medium */}
      <RigidBody type="fixed" position={[4, 0, -4]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.largeBuilding} scale={SCALES.buildings.medium} />
        </Suspense>
      </RigidBody>

      {/* Fortress - large */}
      <RigidBody type="fixed" position={[10, 0, -5]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.fortress} scale={SCALES.buildings.large} />
        </Suspense>
      </RigidBody>

      {/* Skyscraper - extra large */}
      <RigidBody type="fixed" position={[18, 0, -6]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.skyscraper} scale={SCALES.buildings.large * 1.2} />
        </Suspense>
      </RigidBody>
    </>
  )
}

// Vehicles Component - Properly scaled
function Vehicles() {
  const truckRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (truckRef.current) {
      truckRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 8
    }
  })

  return (
    <>
      {/* Static Tank - left side */}
      <RigidBody type="fixed" position={[-12, 0, -1]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.tank} scale={SCALES.tank} />
        </Suspense>
      </RigidBody>

      {/* Turret - right side */}
      <RigidBody type="fixed" position={[12, 0, -1]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.turret} scale={SCALES.vehicles} />
        </Suspense>
      </RigidBody>

      {/* Catapult */}
      <RigidBody type="fixed" position={[-7, 0, -1.5]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.catapult} scale={SCALES.vehicles * 0.8} />
        </Suspense>
      </RigidBody>

      {/* Moving Truck */}
      <group ref={truckRef} position={[0, 0, -2]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.truck} scale={SCALES.vehicles} />
        </Suspense>
      </group>
    </>
  )
}

// Characters Component - Properly scaled to tank
function Characters() {
  return (
    <>
      {/* Soldiers - smaller than tank */}
      {[...Array(3)].map((_, i) => (
        <RigidBody key={`soldier-${i}`} type="fixed" position={[(i - 1) * 4, 0, -0.5]}>
          <Suspense fallback={null}>
            <SafeModel modelPath={MODELS.soldier} scale={SCALES.soldier} />
          </Suspense>
        </RigidBody>
      ))}

      {/* Adventurers */}
      {[...Array(2)].map((_, i) => (
        <group key={`adventurer-${i}`} position={[(i - 0.5) * 8, 0, -1]}>
          <Suspense fallback={null}>
            <SafeModel modelPath={MODELS.adventurer} scale={SCALES.soldier} />
          </Suspense>
        </group>
      ))}
    </>
  )
}

// Environment Component - Properly scaled
function Environment() {
  return (
    <>
      {/* Trees - proportional to tank */}
      {[...Array(5)].map((_, i) => (
        <RigidBody key={`tree-${i}`} type="fixed" position={[i * 5 - 10, 0, -2]}>
          <Suspense fallback={null}>
            <SafeModel modelPath={MODELS.tree} scale={SCALES.trees} />
          </Suspense>
        </RigidBody>
      ))}

      {/* Dead trees - slightly smaller */}
      {[...Array(3)].map((_, i) => (
        <RigidBody key={`dead-tree-${i}`} type="fixed" position={[i * 7 - 7, 0, -2.5]}>
          <Suspense fallback={null}>
            <SafeModel modelPath={MODELS.deadTrees} scale={SCALES.trees * 0.8} />
          </Suspense>
        </RigidBody>
      ))}

      {/* Road sections - flatter and closer */}
      {[...Array(8)].map((_, i) => (
        <group key={`road-${i}`} position={[i * 3 - 12, -0.3, 0]}>
          <Suspense fallback={null}>
            <SafeModel modelPath={MODELS.road} scale={[0.5, 0.3, 0.5]} />
          </Suspense>
        </group>
      ))}
    </>
  )
}

// Main Scene
function IntegratedScene() {
  const [cameraTarget, setCameraTarget] = useState({ x: 0, y: 2 })

  useFrame(({ camera }) => {
    // Smooth camera follow
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, cameraTarget.x, 0.1)
    camera.lookAt(cameraTarget.x, cameraTarget.y, 0)
  })

  return (
    <>
      {/* Ground with physics - flatter and closer */}
      <RigidBody type="fixed" position={[0, -0.5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[50, 1, 8]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
      </RigidBody>

      {/* Sky backdrop */}
      <mesh position={[0, 3, -15]}>
        <planeGeometry args={[60, 15]} />
        <meshBasicMaterial color="#87CEEB" />
      </mesh>

      {/* Mountains in background - smaller */}
      {[...Array(3)].map((_, i) => (
        <mesh key={`mountain-${i}`} position={[(i - 1) * 12, 1, -12]}>
          <coneGeometry args={[4, 5, 4]} />
          <meshStandardMaterial color="#4a5568" />
        </mesh>
      ))}

      {/* Sky Elements */}
      <SkyElements />

      {/* Buildings */}
      <Buildings />

      {/* Vehicles */}
      <Vehicles />

      {/* Characters */}
      <Characters />

      {/* Environment */}
      <Environment />

      {/* Player Tank */}
      <PlayerTank
        player="player1"
        position={[-3, 0.5, 0]}
      />

      {/* Enemy Tank for reference */}
      <RigidBody type="fixed" position={[5, 0, 0]}>
        <group scale={SCALES.tank}>
          <Suspense fallback={null}>
            <SafeModel modelPath={MODELS.tank} />
          </Suspense>
          <mesh position={[0, 2, 0]}>
            <boxGeometry args={[1.5, 0.2, 0.2]} />
            <meshStandardMaterial color="#ff0066" emissive="#ff0066" emissiveIntensity={0.5} />
          </mesh>
        </group>
      </RigidBody>

      {/* Lighting */}
      <pointLight position={[0, 5, 0]} intensity={0.3} />
    </>
  )
}

export default IntegratedScene