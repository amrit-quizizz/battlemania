import { useRef, Suspense, useEffect, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Model paths - using models from public/models
const MODELS = {
  tank: '/models/Tank.glb',
  cloud: '/models/Cloud.glb',
  clouds: '/models/Clouds.glb',
  cumulusClouds: '/models/Cumulus Clouds 2.glb',
  sun: '/models/Sun.glb',
  road: '/models/Road Bits.glb',
  pathStraight: '/models/Path Straight.glb', // Continuous road piece
  ground: '/models/Ground.glb',
  turretGun: '/models/Turret.glb', // Using Turret.glb from public/models
  militaryTent: '/src/game/assets/3d models/environment/Military Tent.glb',
  humvee: '/src/game/assets/3d models/environment/Humvee.glb',
  truck: '/models/M939 Truck.glb',
  skyscraper: '/models/Skyscraper.glb',
  largeBuilding: '/models/Large Building.glb',
  castle: '/models/Castle.glb',
  barracks: '/models/Barracks.glb',
  fortress: '/models/Fortress.glb',
  bullet: '/src/game/assets/3d models/all-models/Bullet.glb'
}

// Preload models
Object.values(MODELS).forEach(path => {
  try {
    useGLTF.preload(path)
  } catch (error) {
    console.warn(`Failed to preload ${path}:`, error)
  }
})

// Scale constants - optimized for better visibility
const SCALES = {
  tank: 0.2,        // Smaller tanks
  cloud: 18,       // Larger clouds
  clouds: 18,      // Cloud group scale
  sun: 1,         // Larger sun
  ground: 0.5,      // Ground scale
  tree: 0.4,        // Tree scale
  road: 2.0,        // Road bits scale
  pathStraight: [40, 8, 5], // Path Straight scale - larger road
  turretGun: 2.5,   // Turret gun scale - optimized for visibility
  truck: 0.4,       // Truck scale - optimized for visibility
  skyscraper: 2.0,  // Skyscraper scale for background
  largeBuilding: 1.5, // Large building scale for background
  castle: 1.8,     // Castle scale for background
  barracks: 1.2,   // Barracks scale for background
  fortress: 1.5,   // Fortress scale for background
  bullet: 0.08      // Bullet scale - may need adjustment based on model size
}

// Safe model loader with better error handling
function SafeModel({ modelPath, scale = 1 }: { modelPath: string, scale?: number | number[] }) {
  // Always call hook - cannot be conditional
  let scene: THREE.Object3D | null = null
  try {
    const gltf = useGLTF(modelPath)
    scene = gltf.scene.clone()
    
    // Enable shadows for all meshes
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  } catch (error) {
    console.warn(`Failed to load model ${modelPath}, using fallback:`, error)
  }
  
  if (scene) {
    return <primitive object={scene} scale={scale} />
  }
  
  // Fallback mesh
  const size = typeof scale === 'number' ? scale : 1
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[size * 2, size, size * 3]} />
      <meshStandardMaterial color="#87CEEB" />
    </mesh>
  )
}

// Bullet Component
function Bullet({ position, velocity, onHit, ownerTankHandle }: { position: [number, number, number], velocity: { x: number, y: number }, onHit?: () => void, ownerTankHandle?: number }) {
  const bulletRef = useRef<RapierRigidBody>(null)
  const [active, setActive] = useState(true)

  useFrame((_state, delta) => {
    if (!bulletRef.current || !active) return

    // Move bullet
    const pos = bulletRef.current.translation()
    bulletRef.current.setTranslation({
      x: pos.x + velocity.x * delta * 10,
      y: pos.y + velocity.y * delta * 10,
      z: pos.z
    }, true)

    // Remove bullet if it goes off screen
    if (Math.abs(pos.x) > 25 || Math.abs(pos.y) > 20) {
      setActive(false)
      onHit?.()
    }
  })

  if (!active) return null

  return (
    <RigidBody
      ref={bulletRef}
      position={position}
      type="kinematicPosition"
      sensor
      onIntersectionEnter={(collision) => {
        const otherHandle = collision.other.rigidBody?.handle
        // Ignore collision with own tank
        if (ownerTankHandle !== undefined && otherHandle === ownerTankHandle) {
          return
        }
        setActive(false)
        onHit?.()
      }}
    >
      <Suspense fallback={
        <mesh castShadow>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial
            color="#ffaa00"
            emissive="#ff6600"
            emissiveIntensity={0.8}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      }>
        <group rotation={[0, -Math.PI / 2, 0]}>
          <SafeModel modelPath={MODELS.bullet} scale={SCALES.bullet} />
        </group>
      </Suspense>
    </RigidBody>
  )
}

// Enhanced Player Tank Component
function PlayerTank({ player, position }: { player: 'player1' | 'player2', position: [number, number, number] }) {
  const tankRef = useRef<RapierRigidBody>(null)
  const tankGroupRef = useRef<THREE.Group>(null)
  const keysPressed = useRef<Set<string>>(new Set())
  const [bullets, setBullets] = useState<Array<{ id: number, position: [number, number, number], velocity: { x: number, y: number }, ownerTankHandle?: number }>>([])
  const lastFireTime = useRef<number>(0)
  const fireCooldown = 500 // milliseconds between shots

  // Rotate both tanks 180 degrees from default, then adjust so they face each other
  // Player 1 (left) faces right (towards center): 0 + Math.PI = Math.PI
  // Player 2 (right) faces left (towards center): Math.PI + Math.PI = 0 (or 2*Math.PI)
  const facing = player === 'player1' ? Math.PI : 0

  const fireBullet = useCallback(() => {
    if (!tankRef.current) return

    const tankPos = tankRef.current.translation()
    // Determine firing direction based on player facing
    // Player 1 faces right (facing = Math.PI), so fire right (+x direction)
    // Player 2 faces left (facing = 0), so fire left (-x direction)
    const direction = player === 'player1' ? 1 : -1
    const bulletOffset = direction * 1.5 // Increased offset to clear tank collision bounds
    const tankHandle = tankRef.current.handle
    const newBullet = {
      id: Date.now() + Math.random(), // Ensure unique ID
      position: [
        tankPos.x + bulletOffset, // Offset forward from tank
        tankPos.y + 0.5, // Offset upward for cannon height
        tankPos.z
      ] as [number, number, number],
      velocity: { 
        x: direction * 2, // Fire speed - reduced for visibility
        y: 0 
      },
      ownerTankHandle: tankHandle
    }
    setBullets(prev => [...prev, newBullet])
  }, [player])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase())

      // Jump
      if (player === 'player1' && e.key === 'w' && tankRef.current) {
        tankRef.current.applyImpulse({ x: 0, y: 0.8, z: 0 }, true)
      }
      if (player === 'player2' && e.key === 'ArrowUp' && tankRef.current) {
        tankRef.current.applyImpulse({ x: 0, y: 0.8, z: 0 }, true)
      }

      // Fire (Space for P1, Enter for P2) - prevent key repeat
      if (!e.repeat && ((player === 'player1' && e.key === ' ') ||
          (player === 'player2' && e.key === 'Enter'))) {
        const currentTime = Date.now()
        if (currentTime - lastFireTime.current >= fireCooldown && tankRef.current) {
          fireBullet()
          lastFireTime.current = currentTime
        }
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
  }, [player, fireBullet])

  useFrame(() => {
    if (!tankRef.current) return

    let moveX = 0
    if (player === 'player1') {
      if (keysPressed.current.has('a')) moveX = -1.5
      if (keysPressed.current.has('d')) moveX = 1.5
    } else {
      if (keysPressed.current.has('arrowleft')) moveX = -1.5
      if (keysPressed.current.has('arrowright')) moveX = 1.5
    }

    if (moveX !== 0) {
      tankRef.current.setLinvel({ x: moveX, y: tankRef.current.linvel().y, z: 0 }, true)
    }
  })

  return (
    <>
      <RigidBody
        ref={tankRef}
        position={position}
        colliders="hull"
        mass={3}
        friction={0.8}
        restitution={0.1}
      >
        <group ref={tankGroupRef} scale={SCALES.tank} rotation={[0, facing, 0]}>
          <Suspense fallback={
            <mesh castShadow receiveShadow>
              <boxGeometry args={[3, 1.5, 4]} />
              <meshStandardMaterial color={player === 'player1' ? '#4a6fa5' : '#a54a4a'} />
            </mesh>
          }>
            <SafeModel modelPath={MODELS.tank} scale={1.2} />
          </Suspense>

          {/* Team indicator bar - more visible */}
          <mesh position={[0, 2.5, 0]} castShadow>
            <boxGeometry args={[2, 0.3, 0.3]} />
            <meshStandardMaterial
              color={player === 'player1' ? '#0066ff' : '#ff0066'}
              emissive={player === 'player1' ? '#0066ff' : '#ff0066'}
              emissiveIntensity={0.6}
            />
          </mesh>

          {/* Player label */}
          <mesh position={[0, 3.2, 0]}>
            <boxGeometry args={[1.2, 0.4, 0.1]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive={player === 'player1' ? '#0066ff' : '#ff0066'}
              emissiveIntensity={0.3}
            />
          </mesh>
        </group>
      </RigidBody>

      {/* Render bullets */}
      {bullets.map(bullet => (
        <Bullet
          key={bullet.id}
          position={bullet.position}
          velocity={bullet.velocity}
          ownerTankHandle={bullet.ownerTankHandle}
          onHit={() => {
            setBullets(prev => prev.filter(b => b.id !== bullet.id))
          }}
        />
      ))}
    </>
  )
}

// Road Component - Uses Path Straight model, tiled to cover entire road
function Road({ roadY }: { roadY: number }) {
  // Number of Path Straight segments to cover the full road width
  const numSegments = 10 // More segments for full coverage
  const segmentSpacing = 3.0 // Spacing between segments (adjusted for larger scale)

  return (
    <>
      {/* Ground below road */}
      <RigidBody type="fixed" position={[0, roadY - 0.5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[35, 1, 12]} />
          <meshStandardMaterial color="#8B7355" roughness={1} />
        </mesh>
      </RigidBody>

      {/* Path Straight segments - Tiled to form continuous road */}
      {[...Array(numSegments)].map((_, i) => {
        const xPosition = (i - (numSegments - 1) / 2) * segmentSpacing
        return (
          <RigidBody 
            key={`path-segment-${i}`} 
            type="fixed" 
            position={[xPosition, roadY, 0.5]}
          >
            <Suspense fallback={
              <mesh receiveShadow castShadow>
                <boxGeometry args={[3.5, 2, 10]} />
                <meshStandardMaterial color="#87CEEB" />
              </mesh>
            }>
              <SafeModel modelPath={MODELS.pathStraight} scale={SCALES.pathStraight} />
            </Suspense>
          </RigidBody>
        )
      })}
    </>
  )
}

// Enhanced Animated Clouds with multiple types
function Clouds() {
  const cloud2Ref = useRef<THREE.Group>(null)
  const cloud5Ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    const time = state.clock.elapsedTime
    
    // Slow drifting clouds
    if (cloud2Ref.current) {
      cloud2Ref.current.position.x = Math.cos(time * 0.025) * 2.5
      cloud2Ref.current.position.y = 2.8 + Math.cos(time * 0.04) * 0.15
    }
    
    if (cloud5Ref.current) {
      cloud5Ref.current.position.x = Math.sin(time * 0.028) * 1.8 + 7
      cloud5Ref.current.position.y = 2.4 + Math.cos(time * 0.05) * 0.15
    }
  })

  return (
    <>
      {/* Main clouds - positioned behind sky layers to avoid clipping */}

      {/* Cloud 1 - Left-center, higher up */}
      <group ref={cloud2Ref} position={[-2, 5, -3]}>
        <Suspense fallback={
          <mesh>
            <sphereGeometry args={[2, 16, 16]} />
            <meshBasicMaterial color="#ffffff" opacity={0.7} transparent />
          </mesh>
        }>
          <SafeModel modelPath={MODELS.clouds} scale={SCALES.clouds} />
        </Suspense>
      </group>


      {/* Cloud 2 - Right side, spread out */}
      <group ref={cloud5Ref} position={[6, 2, -4]}>
        <Suspense fallback={
          <mesh>
            <sphereGeometry args={[1.4, 16, 16]} />
            <meshBasicMaterial color="#ffffff" opacity={1} transparent />
          </mesh>
        }>
          <SafeModel modelPath={MODELS.clouds} scale={SCALES.clouds * 0.8} />
        </Suspense>
      </group>
    </>
  )
}

// Background Buildings Component - Adds buildings to create urban skyline
function BackgroundBuildings({ roadY }: { roadY: number }) {
  return (
    <>
      {/* Buildings positioned in background (behind clouds, in front of sky) */}
      {/* Left side buildings */}
      <group position={[-7, roadY + 1, 1]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.skyscraper} scale={SCALES.skyscraper} />
        </Suspense>
      </group>

      <group position={[-5, roadY + 0.8, 1]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.largeBuilding} scale={SCALES.largeBuilding} />
        </Suspense>
      </group>

      {/* Right side buildings */}

      <group position={[3, roadY + 1, 1]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.largeBuilding} scale={SCALES.largeBuilding} />
        </Suspense>
      </group>

      <group position={[6, roadY + 0.8, 1]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.skyscraper} scale={SCALES.skyscraper} />
        </Suspense>
      </group>
    </>
  )
}

// Main Clean Battle Scene - Enhanced with realistic environment
function CleanBattleScene() {
  // Road position - lowered significantly to eliminate brown space at bottom
  // With camera at y=-2.5 and fov=60, road positioned to fill viewport
  const roadY = -5.8

  return (
    <>
      {/* ============================================
          BACKGROUND WORLD RENDERING EXPLANATION:
          ============================================
          
          The background is rendered using a layered approach with different Z positions:
          
          1. SKY: Large plane geometry at z=-20 (far back) with sky blue color
          2. SKY LAYERS: Additional semi-transparent planes at z=-15 for depth
          3. SUN: 3D model positioned at z=-8 with point light and glow effects
          4. CLOUDS: Multiple animated cloud models at z=-5 to -6, slowly drifting
          5. MOUNTAINS: Cone geometries at z=-7 to -7.5 creating triangular peaks
          6. TREES: 3D tree models at z=-3.5 to -4 for midground depth
          7. ROAD: Path Straight model at z=0 (foreground)
          
          Objects further back (negative Z) appear in background,
          objects at z=0 are in foreground where tanks battle.
      ============================================ */}

      {/* SKY BACKGROUND - Large plane positioned forward to avoid gray rendering issues */}
      {/* Moved forward (less negative Z) to stay within camera view and avoid fog rendering problems */}
      <mesh position={[0, 0, -5]}>
        <planeGeometry args={[500, 1000]} />
        <meshBasicMaterial color="#87CEEB" />
      </mesh>

      {/* Additional sky layers for depth - positioned forward to match main sky */}
      <mesh position={[0, 15, -10]}>
        <planeGeometry args={[300, 280]} />
        <meshBasicMaterial color="#B0E0E6" opacity={0.4} transparent />
      </mesh>

      {/* SUN - Positioned prominently in background with enhanced visibility */}
      <group position={[7, 3.5, -8]}>
        <Suspense fallback={
          <mesh>
            <sphereGeometry args={[0.8]} />
            <meshBasicMaterial color="#FFD700" />
          </mesh>
        }>
          <SafeModel modelPath={MODELS.sun} scale={SCALES.sun * 1.5} />
        </Suspense>
        {/* Sun light - stronger and more visible */}
        <pointLight intensity={1} color="#ffaa00" distance={25} />
        {/* Sun glow effect - multiple layers */}
        <mesh>
          <sphereGeometry args={[1.0]} />
          <meshBasicMaterial color="#FFD700" opacity={0.4} transparent />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.3]} />
          <meshBasicMaterial color="#FFE55C" opacity={0.2} transparent />
        </mesh>
      </group>

      {/* CLOUDS - Multiple animated clouds */}
      <Clouds />

      {/* BACKGROUND BUILDINGS - Urban skyline in the background */}
      <BackgroundBuildings roadY={roadY} />

      {/* ROAD - Built from Road Bits model pattern */}
      <Road roadY={roadY} />

      {/* MILITARY EQUIPMENT - Turret gun, tent, Humvee, truck */}
      {/* Turret Gun 1 - Right side behind road, rotated to face battlefield */}
      <group position={[-2, roadY + 0.5, -5]} rotation={[0, Math.PI/2, 0]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.turretGun} scale={SCALES.turretGun} />
        </Suspense>
      </group>
      
      {/* Turret Gun 2 - Right side behind road, rotated to face battlefield */}
      <group position={[2, roadY + 0.5, 5]} rotation={[0, -Math.PI/2, 0]}>
        <Suspense fallback={null}>
          <SafeModel modelPath={MODELS.turretGun} scale={SCALES.turretGun} />
        </Suspense>
      </group>

      {/* PLAYER 1 TANK - Left side, facing RIGHT (towards center) */}
      <PlayerTank
        player="player1"
        position={[-3, roadY + 2.5, 2.5]}
      />

      {/* PLAYER 2 TANK - Right side, facing LEFT (towards center) */}
      <PlayerTank
        player="player2"
        position={[3, roadY + 2.5, 2.5]}
      />

      {/* ENHANCED LIGHTING - More realistic lighting setup */}
      {/* Ambient light for overall illumination - brighter */}
      <ambientLight intensity={0.7} color="#ffffff" />
      
      {/* Main directional light from sun position - stronger */}
      <directionalLight
        position={[7, 6, -5]}
        intensity={1.0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />
      
      {/* Fill light from opposite side - warmer tone */}
      <directionalLight
        position={[-5, 4, 5]}
        intensity={0.4}
        color="#e0e8f0"
      />
      
      {/* Rim light for depth */}
      <directionalLight
        position={[0, 8, 5]}
        intensity={0.25}
        color="#ffffff"
      />
      
      {/* Additional subtle light from above */}
      <directionalLight
        position={[0, 10, 0]}
        intensity={0.15}
        color="#ffffff"
      />
    </>
  )
}

export default CleanBattleScene