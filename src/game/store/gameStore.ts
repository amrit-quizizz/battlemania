import { create } from 'zustand'

interface Position {
  x: number
  y: number
  z: number
}

interface Player {
  position: Position
  rotation: number
  health: number
}

interface Bullet {
  id: string
  position: Position
  direction: Position
  owner: 'player1' | 'player2'
  speed: number
}

interface GameState {
  player1: Player
  player2: Player
  bullets: Bullet[]
  updatePlayerPosition: (player: 'player1' | 'player2', position: Partial<Position>) => void
  updatePlayerRotation: (player: 'player1' | 'player2', rotation: number) => void
  addBullet: (bullet: Bullet) => void
  removeBullet: (id: string) => void
  updateBullets: () => void
  damagePlayer: (player: 'player1' | 'player2', damage: number) => void
}

const useGameStore = create<GameState>((set, get) => ({
  player1: {
    position: { x: -15, y: 1, z: 0 },
    rotation: 0,
    health: 100
  },
  player2: {
    position: { x: 15, y: 1, z: 0 },
    rotation: Math.PI,
    health: 100
  },
  bullets: [],

  updatePlayerPosition: (player, position) => {
    set((state) => ({
      [player]: {
        ...state[player],
        position: { ...state[player].position, ...position }
      }
    }))
  },

  updatePlayerRotation: (player, rotation) => {
    set((state) => ({
      [player]: {
        ...state[player],
        rotation
      }
    }))
  },

  addBullet: (bullet) => {
    set((state) => ({
      bullets: [...state.bullets, bullet]
    }))
  },

  removeBullet: (id) => {
    set((state) => ({
      bullets: state.bullets.filter((b) => b.id !== id)
    }))
  },

  updateBullets: () => {
    const { bullets } = get()
    const updatedBullets = bullets.map((bullet) => ({
      ...bullet,
      position: {
        x: bullet.position.x + bullet.direction.x * bullet.speed,
        y: bullet.position.y + bullet.direction.y * bullet.speed,
        z: bullet.position.z + bullet.direction.z * bullet.speed
      }
    }))
    set({ bullets: updatedBullets })
  },

  damagePlayer: (player, damage) => {
    set((state) => ({
      [player]: {
        ...state[player],
        health: Math.max(0, state[player].health - damage)
      }
    }))
  }
}))

export default useGameStore