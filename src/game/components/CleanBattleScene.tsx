import { useRef, Suspense, useEffect, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import { 
  modelScalesConfig, 
  bulletConfig, 
  playerConfig, 
  physicsConfig, 
  environmentConfig, 
  lightingConfig,
  animationConfig,
  visualEffectsConfig
} from '../config/gameConfig'
import { StadiumWithSpectators } from './StadiumWithSpectators'
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
  bullet: '/src/game/assets/3d models/all-models/Bullet.glb',
  stadiumSeats: '/src/game/assets/3d models/environment/Stadium Seats.glb'
}

// Preload models
Object.values(MODELS).forEach(path => {
  try {
    useGLTF.preload(path)
  } catch (error) {
    console.warn(`Failed to preload ${path}:`, error)
  }
})

// Scale constants - now using config
const SCALES = {
  tank: modelScalesConfig.tank.standard,
  cloud: modelScalesConfig.cloud.large,
  clouds: modelScalesConfig.cloud.large,
  sun: modelScalesConfig.sun.standard,
  ground: modelScalesConfig.ground,
  tree: modelScalesConfig.tree.standard,
  road: modelScalesConfig.road.bits,
  pathStraight: modelScalesConfig.road.pathStraight,
  turretGun: modelScalesConfig.buildings.turretGun,
  truck: modelScalesConfig.vehicles.truck,
  skyscraper: modelScalesConfig.buildings.skyscraper,
  largeBuilding: modelScalesConfig.buildings.largeBuilding,
  castle: modelScalesConfig.buildings.castle,
  barracks: modelScalesConfig.buildings.barracks,
  fortress: modelScalesConfig.buildings.fortress,
  bullet: modelScalesConfig.bullet.standard,
  stadiumSeats: modelScalesConfig.buildings.stadiumSeats
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
      <meshStandardMaterial color={environmentConfig.sky.primaryColor} />
    </mesh>
  )
}

// Collision data interface
interface BulletHitData {
  hitTankHandle: number | undefined
  firingDirection: { x: number; y: number }
}

// Bullet Component
function Bullet({ position, velocity, onHit, ownerTankHandle, firingDirection }: { position: [number, number, number], velocity: { x: number, y: number }, onHit?: (data: BulletHitData) => void, ownerTankHandle?: number, firingDirection: { x: number; y: number } }) {
  const bulletRef = useRef<RapierRigidBody>(null)
  const [active, setActive] = useState(true)

  useFrame((_state, delta) => {
    if (!bulletRef.current || !active) return

    // Move bullet
    const pos = bulletRef.current.translation()
    bulletRef.current.setTranslation({
      x: pos.x + velocity.x * delta * bulletConfig.velocityMultiplier,
      y: pos.y + velocity.y * delta * bulletConfig.velocityMultiplier,
      z: pos.z
    }, true)

    // Remove bullet if it goes off screen
    if (Math.abs(pos.x) > bulletConfig.boundaryLimits.sideScroll.x || Math.abs(pos.y) > bulletConfig.boundaryLimits.sideScroll.y) {
      setActive(false)
      onHit?.({ hitTankHandle: undefined, firingDirection })
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
        onHit?.({ hitTankHandle: otherHandle, firingDirection })
      }}
    >
      <Suspense fallback={
        <mesh castShadow>
          <sphereGeometry args={bulletConfig.geometrySizes.medium} />
          <meshStandardMaterial
            color={bulletConfig.materialColor}
            emissive={bulletConfig.materialEmissive}
            emissiveIntensity={bulletConfig.materialEmissiveIntensity}
            metalness={visualEffectsConfig.materials.metalness}
            roughness={visualEffectsConfig.materials.roughness}
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
function PlayerTank({ player, position, onBulletHit, tankRef: externalTankRef }: { player: 'player1' | 'player2', position: [number, number, number], onBulletHit?: (data: BulletHitData) => void, tankRef?: React.RefObject<RapierRigidBody | null> }) {
  const internalTankRef = useRef<RapierRigidBody>(null)
  const tankRef = externalTankRef || internalTankRef
  const tankGroupRef = useRef<THREE.Group>(null)
  const keysPressed = useRef<Set<string>>(new Set())
  const [bullets, setBullets] = useState<Array<{ id: number, position: [number, number, number], velocity: { x: number, y: number }, ownerTankHandle?: number, firingDirection: { x: number; y: number } }>>([])
  const lastFireTime = useRef<number>(0)
  const fireCooldown = bulletConfig.fireCooldown

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
    const bulletOffset = direction * bulletConfig.forwardOffset
    const tankHandle = tankRef.current.handle
    const firingDirection = { x: direction, y: 0 }
    const newBullet = {
      id: Date.now() + Math.random(), // Ensure unique ID
      position: [
        tankPos.x + bulletOffset, // Offset forward from tank
        tankPos.y + bulletConfig.verticalOffset, // Offset upward for cannon height
        tankPos.z
      ] as [number, number, number],
      velocity: { 
        x: direction * bulletConfig.speedSideScroll, // Fire speed
        y: 0 
      },
      ownerTankHandle: tankHandle,
      firingDirection
    }
    setBullets(prev => [...prev, newBullet])
  }, [player, tankRef])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase())

      // Jump
      if (player === 'player1' && e.key === 'w' && tankRef.current) {
        tankRef.current.applyImpulse({ x: 0, y: playerConfig.jumpImpulse, z: 0 }, true)
      }
      if (player === 'player2' && e.key === 'ArrowUp' && tankRef.current) {
        tankRef.current.applyImpulse({ x: 0, y: playerConfig.jumpImpulse, z: 0 }, true)
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
      if (keysPressed.current.has('a')) moveX = -playerConfig.horizontalMoveSpeed
      if (keysPressed.current.has('d')) moveX = playerConfig.horizontalMoveSpeed
    } else {
      if (keysPressed.current.has('arrowleft')) moveX = -playerConfig.horizontalMoveSpeed
      if (keysPressed.current.has('arrowright')) moveX = playerConfig.horizontalMoveSpeed
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
        mass={physicsConfig.tankMass}
        friction={physicsConfig.friction}
        restitution={physicsConfig.restitution}
      >
        <group ref={tankGroupRef} scale={SCALES.tank} rotation={[0, facing, 0]}>
          <Suspense fallback={
            <mesh castShadow receiveShadow>
              <boxGeometry args={[3, 1.5, 4]} />
              <meshStandardMaterial color={player === 'player1' ? '#4a6fa5' : '#a54a4a'} />
            </mesh>
          }>
            <SafeModel modelPath={MODELS.tank} scale={modelScalesConfig.tank.large * 2.4} />
          </Suspense>

          {/* Team indicator bar - more visible */}
          <mesh position={playerConfig.teamIndicatorPositions.elevated} castShadow>
            <boxGeometry args={playerConfig.teamIndicatorGeometry} />
            <meshStandardMaterial
              color={player === 'player1' ? playerConfig.player1Color : playerConfig.player2Color}
              emissive={player === 'player1' ? playerConfig.player1Color : playerConfig.player2Color}
              emissiveIntensity={visualEffectsConfig.emissive.medium}
            />
          </mesh>

          {/* Player label */}
          <mesh position={[0, 3.2, 0]}>
            <boxGeometry args={playerConfig.teamIndicatorGeometries.label} />
            <meshStandardMaterial
              color="#ffffff"
              emissive={player === 'player1' ? playerConfig.player1Color : playerConfig.player2Color}
              emissiveIntensity={visualEffectsConfig.emissive.low}
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
          firingDirection={bullet.firingDirection}
          onHit={(hitData) => {
            setBullets(prev => prev.filter(b => b.id !== bullet.id))
            onBulletHit?.(hitData)
          }}
        />
      ))}
    </>
  )
}

// Road Component - Uses Path Straight model, tiled to cover entire road
function Road({ roadY }: { roadY: number }) {
  const { road } = environmentConfig

  return (
    <>
      {/* Ground below road */}
      <RigidBody type="fixed" position={[0, roadY - 0.5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={road.groundDimensions} />
          <meshStandardMaterial color={road.groundColor} roughness={visualEffectsConfig.materials.roughnessAlternative} />
        </mesh>
      </RigidBody>

      {/* Path Straight segments - Tiled to form continuous road */}
      {[...Array(road.segmentCount)].map((_, i) => {
        const xPosition = (i - (road.segmentCount - 1) / 2) * road.segmentSpacing
        return (
          <RigidBody 
            key={`path-segment-${i}`} 
            type="fixed" 
            position={[xPosition, roadY, 0.5]}
          >
            <Suspense fallback={
              <mesh receiveShadow castShadow>
                <boxGeometry args={[3.5, 2, 10]} />
                <meshStandardMaterial color={environmentConfig.sky.primaryColor} />
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
    const { clouds: cloudAnim } = animationConfig
    
    // Slow drifting clouds
    if (cloud2Ref.current) {
      cloud2Ref.current.position.x = Math.cos(time * cloudAnim.cloud1Speed) * cloudAnim.cloud1AmplitudeX
      cloud2Ref.current.position.y = cloudAnim.cloud1YBase + Math.cos(time * cloudAnim.cloud1YSpeed) * cloudAnim.cloud1AmplitudeY
    }
    
    if (cloud5Ref.current) {
      cloud5Ref.current.position.x = Math.sin(time * cloudAnim.cloud2Speed) * cloudAnim.cloud2AmplitudeX + cloudAnim.cloud2XOffset
      cloud5Ref.current.position.y = cloudAnim.cloud2YBase + Math.cos(time * cloudAnim.cloud2YSpeed) * cloudAnim.cloud2AmplitudeY
    }
  })

  return (
    <>
      {/* Main clouds - positioned behind sky layers to avoid clipping */}

      {/* Cloud 1 - Left-center, higher up */}
      <group ref={cloud2Ref} position={animationConfig.clouds.positions.cloud1}>
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
      <group ref={cloud5Ref} position={animationConfig.clouds.positions.cloud2}>
        <Suspense fallback={
          <mesh>
            <sphereGeometry args={[1.4, 16, 16]} />
            <meshBasicMaterial color="#ffffff" opacity={1} transparent />
          </mesh>
        }>
          <SafeModel modelPath={MODELS.clouds} scale={SCALES.clouds * modelScalesConfig.cloud.medium} />
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

      {/* Stadium with Spectators */}
      <StadiumWithSpectators
        position={[-1, roadY + 1, -2]}
        rotation={[0, Math.PI, 0]}
        scale={SCALES.stadiumSeats}
        dimensions={[2.0, 0.6, 1.5]}
        roadY={roadY}
      />

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
  const roadY = environmentConfig.road.yPosition
  
  // Refs to store both tank RigidBody references for collision effects
  const player1TankRef = useRef<RapierRigidBody>(null)
  const player2TankRef = useRef<RapierRigidBody>(null)

  // Recoil effect: Push shooter tank backward (opposite to firing direction)
  const applyRecoilEffect = useCallback((tankRef: React.RefObject<RapierRigidBody | null>, firingDirection: { x: number; y: number }) => {
    if (!tankRef.current) return
    
    // Recoil is in negative direction of bullet (opposite to firing direction)
    tankRef.current.applyImpulse({
      x: -firingDirection.x * physicsConfig.recoilForce,
      y: 0,
      z: 0
    }, true)
  }, [])

  // Explosion shake effect: Apply upward impulse, horizontal push-back, and rotation to enemy tank
  const applyShakeEffect = useCallback((tankRef: React.RefObject<RapierRigidBody | null>, firingDirection: { x: number; y: number }) => {
    if (!tankRef.current) return
    
    // Apply upward impulse to lift tank
    tankRef.current.applyImpulse({
      x: 0,
      y: physicsConfig.shakeUpwardImpulse,
      z: 0
    }, true)

    // Apply horizontal push-back in the direction of the bullet (hit recoil)
    tankRef.current.applyImpulse({
      x: firingDirection.x * physicsConfig.hitRecoilForce,
      y: 0,
      z: 0
    }, true)

    // Apply rotation for shake/destabilization effect
    tankRef.current.applyTorqueImpulse({
      x: (Math.random() - 0.5) * physicsConfig.shakeTorqueRange,
      y: 0,
      z: (Math.random() - 0.5) * physicsConfig.shakeTorqueRange
    }, true)
  }, [])

  // Handle bullet hit: Route collision to appropriate effects
  const handleBulletHit = useCallback((hitData: BulletHitData, ownerTankHandle?: number) => {
    if (!hitData.hitTankHandle) return // Bullet went off screen or hit non-tank object
    
    // Determine which tank fired (shooter) and which was hit (enemy)
    const player1Handle = player1TankRef.current?.handle
    const player2Handle = player2TankRef.current?.handle
    
    // Find shooter tank ref
    let shooterTankRef: React.RefObject<RapierRigidBody | null> | undefined = undefined
    if (ownerTankHandle === player1Handle) {
      shooterTankRef = player1TankRef
    } else if (ownerTankHandle === player2Handle) {
      shooterTankRef = player2TankRef
    }
    
    // Find enemy tank ref (the one that was hit)
    let enemyTankRef: React.RefObject<RapierRigidBody | null> | undefined = undefined
    if (hitData.hitTankHandle === player1Handle) {
      enemyTankRef = player1TankRef
    } else if (hitData.hitTankHandle === player2Handle) {
      enemyTankRef = player2TankRef
    }
    
    // Apply recoil to shooter tank
    if (shooterTankRef) {
      applyRecoilEffect(shooterTankRef, hitData.firingDirection)
    }
    
    // Apply shake to enemy tank (with firing direction for hit recoil)
    if (enemyTankRef) {
      applyShakeEffect(enemyTankRef, hitData.firingDirection)
    }
  }, [applyRecoilEffect, applyShakeEffect])

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
      <mesh position={environmentConfig.skyPlanes.mainPosition}>
        <planeGeometry args={environmentConfig.skyPlanes.mainSize} />
        <meshBasicMaterial color={environmentConfig.sky.primaryColor} />
      </mesh>

      {/* Additional sky layers for depth - positioned forward to match main sky */}
      <mesh position={environmentConfig.skyPlanes.layerPosition}>
        <planeGeometry args={environmentConfig.skyPlanes.layerSize} />
        <meshBasicMaterial color={environmentConfig.sky.secondaryColor} opacity={environmentConfig.skyPlanes.layerOpacity} transparent />
      </mesh>

      {/* SUN - Positioned prominently in background with enhanced visibility */}
      <group position={[7, 3.5, -8]}>
        <Suspense fallback={
          <mesh>
            <sphereGeometry args={[0.8]} />
            <meshBasicMaterial color={visualEffectsConfig.sunGlow.innerColor} />
          </mesh>
        }>
          <SafeModel modelPath={MODELS.sun} scale={SCALES.sun * modelScalesConfig.sun.large} />
        </Suspense>
        {/* Sun light - stronger and more visible */}
        <pointLight intensity={lightingConfig.pointLight.intensity} color={lightingConfig.pointLight.color} distance={lightingConfig.pointLight.distance} />
        {/* Sun glow effect - multiple layers */}
        <mesh>
          <sphereGeometry args={[visualEffectsConfig.sunGlow.innerRadius]} />
          <meshBasicMaterial color={visualEffectsConfig.sunGlow.innerColor} opacity={visualEffectsConfig.sunGlow.innerOpacity} transparent />
        </mesh>
        <mesh>
          <sphereGeometry args={[visualEffectsConfig.sunGlow.outerRadius]} />
          <meshBasicMaterial color={visualEffectsConfig.sunGlow.outerColor} opacity={visualEffectsConfig.sunGlow.outerOpacity} transparent />
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
        position={[-4.5, roadY + 2.5, 2.5]}
        tankRef={player1TankRef}
        onBulletHit={(hitData) => {
          const ownerTankHandle = player1TankRef.current?.handle
          handleBulletHit(hitData, ownerTankHandle)
        }}
      />

      {/* PLAYER 2 TANK - Right side, facing LEFT (towards center) */}
      <PlayerTank
        player="player2"
        position={[4.5, roadY + 2.5, 2.5]}
        tankRef={player2TankRef}
        onBulletHit={(hitData) => {
          const ownerTankHandle = player2TankRef.current?.handle
          handleBulletHit(hitData, ownerTankHandle)
        }}
      />

      {/* ENHANCED LIGHTING - More realistic lighting setup */}
      {/* Ambient light for overall illumination - brighter */}
      <ambientLight intensity={lightingConfig.ambientIntensity} color={lightingConfig.ambientColor} />
      
      {/* Main directional light from sun position - stronger */}
      <directionalLight
        position={lightingConfig.directionalSun.position}
        intensity={lightingConfig.directionalSun.intensity}
        castShadow={lightingConfig.directionalSun.castShadow}
        shadow-mapSize={lightingConfig.directionalSun.shadowMapSize}
        shadow-camera-far={lightingConfig.directionalSun.shadowCamera.far}
        shadow-camera-left={lightingConfig.directionalSun.shadowCamera.left}
        shadow-camera-right={lightingConfig.directionalSun.shadowCamera.right}
        shadow-camera-top={lightingConfig.directionalSun.shadowCamera.top}
        shadow-camera-bottom={lightingConfig.directionalSun.shadowCamera.bottom}
        shadow-bias={lightingConfig.directionalSun.shadowCamera.bias}
      />
      
      {/* Fill light from opposite side - warmer tone */}
      <directionalLight
        position={lightingConfig.directionalFillWarm.position}
        intensity={lightingConfig.directionalFillWarm.intensity}
        color={lightingConfig.directionalFillWarm.color}
      />
      
      {/* Rim light for depth */}
      <directionalLight
        position={lightingConfig.directionalRim.position}
        intensity={lightingConfig.directionalRim.intensity}
        color={lightingConfig.directionalRim.color}
      />
      
      {/* Additional subtle light from above */}
      <directionalLight
        position={lightingConfig.directionalTop.position}
        intensity={lightingConfig.directionalTop.intensity}
        color={lightingConfig.directionalTop.color}
      />
    </>
  )
}

export default CleanBattleScene