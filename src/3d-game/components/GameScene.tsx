import { useFrame } from '@react-three/fiber'
import { useRef, useEffect, Suspense } from 'react'
import Tank from './Tank'
import M26Tank from './M26Tank'
import M26TankWithTexture from './M26TankWithTexture'
import Bullet from './Bullet'
import Platform from './Platform'
import useGameStore from '../store/gameStore'
import { playerConfig, bulletConfig } from '../config/gameConfig'
import * as THREE from 'three'

function GameScene() {
  const {
    player1,
    player2,
    bullets,
    updatePlayerPosition,
    updatePlayerRotation,
    addBullet,
    updateBullets,
    removeBullet
  } = useGameStore()

  const keysPressed = useRef<Set<string>>(new Set())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase())

      // Fire bullets
      if (e.key === ' ' && !e.repeat) { // Space for player 1
        const direction = new THREE.Vector3(1, 0, 0)
          .applyEuler(new THREE.Euler(0, player1.rotation, 0))

        addBullet({
          id: Date.now().toString(),
          position: { ...player1.position },
          direction: { x: direction.x, y: 0, z: direction.z },
          owner: 'player1',
          speed: bulletConfig.speed
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
          speed: bulletConfig.speed
        })
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
  }, [player1.rotation, player2.rotation, addBullet])

  useFrame((state, delta) => {
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

    // Remove bullets that are out of bounds
    bullets.forEach((bullet) => {
      if (
        Math.abs(bullet.position.x) > bulletConfig.boundaryLimits.standard.x ||
        Math.abs(bullet.position.z) > bulletConfig.boundaryLimits.standard.z
      ) {
        removeBullet(bullet.id)
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