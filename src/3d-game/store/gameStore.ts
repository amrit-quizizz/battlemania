import { create } from 'zustand'
import { playerConfig } from '../config/gameConfig'

interface Position {
  x: number
  y: number
  z: number
}

interface Player {
  position: Position
  rotation: number
  health: number
  score: number
  team: 'teamA' | 'teamB'
}

interface Bullet {
  id: string
  position: Position
  direction: Position
  owner: 'player1' | 'player2'
  speed: number
  type: 'tank' | 'turret'
}

interface DamageHistoryEntry {
  playerId: 'player1' | 'player2'
  damage: number
  timestamp: number
}

interface GameState {
  player1: Player
  player2: Player
  bullets: Bullet[]
  damageDealt: { teamA: number; teamB: number }
  damageHistory: DamageHistoryEntry[]
  updatePlayerPosition: (player: 'player1' | 'player2', position: Partial<Position>) => void
  updatePlayerRotation: (player: 'player1' | 'player2', rotation: number) => void
  addBullet: (bullet: Bullet) => void
  removeBullet: (id: string) => void
  updateBullets: () => void
  damagePlayer: (player: 'player1' | 'player2', damage: number) => void
  applyDamageToPlayer: (player: 'player1' | 'player2', damage: number, sourcePlayer: 'player1' | 'player2') => void
  getTeamHealth: (team: 'teamA' | 'teamB') => number
  resetHealth: () => void
  addScore: (player: 'player1' | 'player2', points: number) => void
  setScore: (player: 'player1' | 'player2', score: number) => void
  resetScores: () => void
}

const useGameStore = create<GameState>((set, get) => ({
  player1: {
    position: { ...playerConfig.player1StartPosition },
    rotation: playerConfig.player1StartRotation,
    health: playerConfig.initialHealth,
    score: 0,
    team: 'teamA'
  },
  player2: {
    position: { ...playerConfig.player2StartPosition },
    rotation: playerConfig.player2StartRotation,
    health: playerConfig.initialHealth,
    score: 0,
    team: 'teamB'
  },
  bullets: [],
  damageDealt: { teamA: 0, teamB: 0 },
  damageHistory: [],

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
  },

  applyDamageToPlayer: (player, damage, sourcePlayer) => {
    const state = get()
    const sourceTeam = state[sourcePlayer].team
    const targetTeam = state[player].team
    
    // Apply damage
    state.damagePlayer(player, damage)
    
    // Track damage dealt by source team
    set((currentState) => ({
      damageDealt: {
        ...currentState.damageDealt,
        [sourceTeam]: currentState.damageDealt[sourceTeam] + damage
      },
      damageHistory: [
        ...currentState.damageHistory,
        {
          playerId: player,
          damage,
          timestamp: Date.now()
        }
      ].slice(-50) // Keep last 50 entries
    }))
  },

  getTeamHealth: (team) => {
    const state = get()
    if (team === 'teamA') {
      return state.player1.health
    } else {
      return state.player2.health
    }
  },

  resetHealth: () => {
    set((state) => ({
      player1: {
        ...state.player1,
        health: playerConfig.initialHealth
      },
      player2: {
        ...state.player2,
        health: playerConfig.initialHealth
      },
      damageDealt: { teamA: 0, teamB: 0 },
      damageHistory: []
    }))
  },

  addScore: (player, points) => {
    set((state) => ({
      [player]: {
        ...state[player],
        score: state[player].score + points
      }
    }))
  },

  setScore: (player, score) => {
    set((state) => ({
      [player]: {
        ...state[player],
        score
      }
    }))
  },

  resetScores: () => {
    set((state) => ({
      player1: {
        ...state.player1,
        score: 0
      },
      player2: {
        ...state.player2,
        score: 0
      }
    }))
  }
}))

export default useGameStore