import { useFrame } from '@react-three/fiber'
import { useRef, useEffect, Suspense } from 'react'
import Tank from './Tank'
import M26TankWithTexture from './M26TankWithTexture'
import Bullet from './Bullet'
import Platform from './Platform'
import useGameStore from '../store/gameStore'
import { playerConfig, bulletConfig } from '../config/gameConfig'
import * as THREE from 'three'

// Helper function to fire turret bullets (fires 2 bullets with spread)
function fireTurretBullets(
  playerPosition: { x: number; y: number; z: number },
  playerRotation: number,
  owner: 'player1' | 'player2',
  addBullet: (bullet: any) => void
) {
  const baseDirection = owner === 'player1'
    ? new THREE.Vector3(1, 0, 0)
    : new THREE.Vector3(-1, 0, 0)

  const spreadAngle = bulletConfig.turretFire.spreadAngle

  // Fire two bullets with spread
  for (let i = 0; i < 2; i++) {
    const angleOffset = i === 0 ? -spreadAngle / 2 : spreadAngle / 2
    const direction = baseDirection.clone()
      .applyEuler(new THREE.Euler(0, playerRotation + angleOffset, 0))

    addBullet({
      id: `turret_${Date.now()}_${owner}_${i}`,
      position: { ...playerPosition },
      direction: { x: direction.x, y: 0, z: direction.z },
      owner,
      speed: bulletConfig.turretFire.speed,
      type: 'turret'
    })
  }
}

function GameScene() {
  const {
    player1,
    player2,
    bullets,
    updatePlayerPosition,
    updatePlayerRotation,
    addBullet,
    updateBullets,
    removeBullet,
    damagePlayer
  } = useGameStore()

  const keysPressed = useRef<Set<string>>(new Set())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase())

      // Fire tank bullets
      if (e.key === ' ' && !e.repeat) { // Space for player 1
        const direction = new THREE.Vector3(1, 0, 0)
          .applyEuler(new THREE.Euler(0, player1.rotation, 0))

        addBullet({
          id: Date.now().toString(),
          position: { ...player1.position },
          direction: { x: direction.x, y: 0, z: direction.z },
          owner: 'player1',
          speed: bulletConfig.speed,
          type: 'tank'
        })
      }

      if (e.key === 'Enter' && !e.repeat) { // Enter for player 2
        const direction = new THREE.Vector3(-1, 0, 0)
          .applyEuler(new THREE.Euler(0, player2.rotation, 0))

        addBullet({
          id: Date.now().toString() + 'p2',
          position: { ...player2.position },
          direction: { x: direction.x, y: 0, z: direction.z },
          owner: 'player2',
          speed: bulletConfig.speed,
          type: 'tank'
        })
      }

      // Fire turret bullets (Z for player 1, M for player 2)
      if (e.key.toLowerCase() === 'z' && !e.repeat) {
        fireTurretBullets(player1.position, player1.rotation, 'player1', addBullet)
      }

      if (e.key.toLowerCase() === 'm' && !e.repeat) {
        fireTurretBullets(player2.position, player2.rotation, 'player2', addBullet)
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
  }, [player1.rotation, player1.position, player2.rotation, player2.position, addBullet])

  useFrame(() => {
    // Player 1 controls (WASD)
    if (keysPressed.current.has('w')) {
      updatePlayerPosition('player1', { z: player1.position.z - playerConfig.moveSpeed })
    }
    if (keysPressed.current.has('s')) {
      updatePlayerPosition('player1', { z: player1.position.z + playerConfig.moveSpeed })
    }
    if (keysPressed.current.has('a')) {
      updatePlayerRotation('player1', player1.rotation + playerConfig.rotationSpeed)
    }
    if (keysPressed.current.has('d')) {
      updatePlayerRotation('player1', player1.rotation - playerConfig.rotationSpeed)
    }

    // Player 2 controls (Arrow keys)
    if (keysPressed.current.has('arrowup')) {
      updatePlayerPosition('player2', { z: player2.position.z - playerConfig.moveSpeed })
    }
    if (keysPressed.current.has('arrowdown')) {
      updatePlayerPosition('player2', { z: player2.position.z + playerConfig.moveSpeed })
    }
    if (keysPressed.current.has('arrowleft')) {
      updatePlayerRotation('player2', player2.rotation + playerConfig.rotationSpeed)
    }
    if (keysPressed.current.has('arrowright')) {
      updatePlayerRotation('player2', player2.rotation - playerConfig.rotationSpeed)
    }

    // Update bullets
    updateBullets()

    // Check turret-to-turret collisions and remove out of bounds bullets
    bullets.forEach((bullet) => {
      // Boundary check
      if (
        Math.abs(bullet.position.x) > bulletConfig.boundaryLimits.standard.x ||
        Math.abs(bullet.position.z) > bulletConfig.boundaryLimits.standard.z
      ) {
        removeBullet(bullet.id)
        return
      }

      // Turret-to-turret collision detection (turret bullets only)
      if (bullet.type === 'turret') {
        const hitRadius = bulletConfig.turretFire.turretHitRadius

        // Get target player position (enemy turret)
        const targetPlayer = bullet.owner === 'player1' ? player2 : player1
        const targetPlayerId = bullet.owner === 'player1' ? 'player2' : 'player1'

        // Calculate distance between bullet and target turret
        const dx = bullet.position.x - targetPlayer.position.x
        const dz = bullet.position.z - targetPlayer.position.z
        const distance = Math.sqrt(dx * dx + dz * dz)

        // Check if bullet hit the enemy turret
        if (distance <= hitRadius) {
          // Apply turret damage (higher than tank damage)
          damagePlayer(targetPlayerId as 'player1' | 'player2', bulletConfig.turretFire.damage)
          removeBullet(bullet.id)
        }
      }
    })
  })

  return (
    <>
      {/* Game Platform */}
      <Platform />

      {/* Tanks with 3D Models */}
      <Suspense fallback={
        <>
          <Tank
            position={[player1.position.x, player1.position.y, player1.position.z]}
            rotation={player1.rotation}
            color="#4444ff"
            player="player1"
          />
          <Tank
            position={[player2.position.x, player2.position.y, player2.position.z]}
            rotation={player2.rotation}
            color="#ff4444"
            player="player2"
          />
        </>
      }>
        {/* Player 1 Tank (left side) - M26 3D Model with Texture */}
        <M26TankWithTexture
          position={[player1.position.x, player1.position.y, player1.position.z]}
          rotation={player1.rotation}
          color="#4444ff"
          player="player1"
        />

        {/* Player 2 Tank (right side) - M26 3D Model with Texture */}
        <M26TankWithTexture
          position={[player2.position.x, player2.position.y, player2.position.z]}
          rotation={player2.rotation}
          color="#ff4444"
          player="player2"
        />
      </Suspense>

      {/* Render all bullets */}
      {bullets.map((bullet) => (
        <Bullet
          key={bullet.id}
          position={[bullet.position.x, bullet.position.y, bullet.position.z]}
        />
      ))}
    </>
  )
}

export default GameScene