import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './store';

export interface GamePlayer {
  playerId: string;
  health: number;
  totalDamageDealt: number;
  points: number;
  selectedAmmunitionId: string | null;
  selectedWallId: string | null;
}

export interface TurnAction {
  playerId: string;
  ammunitionId: string | null;
  wallId?: string | null;
}

export interface TurnRecord {
  turnNumber: number;
  actions: TurnAction[];
  damages: Array<{
    fromPlayer: string;
    toPlayer: string;
    damage: number;
    ammunitionId: string;
    defendedBy?: number;
  }>;
  timestamp: number;
}

export interface GameInstance {
  gameId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  currentTurn: number;
  players: GamePlayer[];
  turnHistory: TurnRecord[];
  winner?: string;
}

interface GameState {
  games: Record<string, GameInstance>;
  currentGameId: string | null;
}

const initialState: GameState = {
  games: {},
  currentGameId: null,
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    startGame: (state, action: PayloadAction<{ gameId: string; playerIds: string[]; initialPoints?: Record<string, number> }>) => {
      const { gameId, playerIds, initialPoints } = action.payload;

      const newGame: GameInstance = {
        gameId,
        status: 'ACTIVE',
        currentTurn: 1,
        players: playerIds.map(playerId => ({
          playerId,
          health: 100,
          totalDamageDealt: 0,
          points: initialPoints?.[playerId] || 100,
          selectedAmmunitionId: null,
          selectedWallId: null,
        })),
        turnHistory: [],
      };

      state.games[gameId] = newGame;
      state.currentGameId = gameId;
    },
    updateDamage: (state, action: PayloadAction<{ gameId: string; playerId: string; damage: number }>) => {
      const { gameId, playerId, damage } = action.payload;
      const game = state.games[gameId];

      if (game) {
        const player = game.players.find(p => p.playerId === playerId);
        if (player) {
          player.totalDamageDealt += damage;
        }
      }
    },
    takeDamage: (state, action: PayloadAction<{ gameId: string; playerId: string; damage: number }>) => {
      const { gameId, playerId, damage } = action.payload;
      const game = state.games[gameId];

      if (game) {
        const player = game.players.find(p => p.playerId === playerId);
        if (player) {
          player.health = Math.max(0, player.health - damage);
        }
      }
    },
    incrementTurn: (state, action: PayloadAction<string>) => {
      const gameId = action.payload;
      const game = state.games[gameId];

      if (game) {
        game.currentTurn += 1;
      }
    },
    endGame: (state, action: PayloadAction<{ gameId: string; winner?: string }>) => {
      const { gameId, winner } = action.payload;
      const game = state.games[gameId];

      if (game) {
        game.status = 'COMPLETED';
        if (winner) {
          game.winner = winner;
        }
      }
    },
    recordTurn: (state, action: PayloadAction<{ gameId: string; turnRecord: TurnRecord }>) => {
      const { gameId, turnRecord } = action.payload;
      const game = state.games[gameId];

      if (game) {
        game.turnHistory.push(turnRecord);
      }
    },
    resetGame: (state) => {
      state.currentGameId = null;
    },
    selectAmmunition: (state, action: PayloadAction<{ gameId: string; playerId: string; ammunitionId: string | null }>) => {
      const { gameId, playerId, ammunitionId } = action.payload;
      const game = state.games[gameId];

      if (game) {
        const player = game.players.find(p => p.playerId === playerId);
        if (player) {
          player.selectedAmmunitionId = ammunitionId;
        }
      }
    },
    selectWall: (state, action: PayloadAction<{ gameId: string; playerId: string; wallId: string | null }>) => {
      const { gameId, playerId, wallId } = action.payload;
      const game = state.games[gameId];

      if (game) {
        const player = game.players.find(p => p.playerId === playerId);
        if (player) {
          player.selectedWallId = wallId;
        }
      }
    },
    clearSelections: (state, action: PayloadAction<string>) => {
      const gameId = action.payload;
      const game = state.games[gameId];

      if (game) {
        game.players.forEach(player => {
          player.selectedAmmunitionId = null;
          player.selectedWallId = null;
        });
      }
    },
    deductPoints: (state, action: PayloadAction<{ gameId: string; playerId: string; points: number }>) => {
      const { gameId, playerId, points } = action.payload;
      const game = state.games[gameId];

      if (game) {
        const player = game.players.find(p => p.playerId === playerId);
        if (player) {
          player.points -= points;
        }
      }
    },
  },
});

export const { startGame, updateDamage, takeDamage, incrementTurn, endGame, recordTurn, resetGame, selectAmmunition, selectWall, clearSelections, deductPoints } = gameSlice.actions;

export const selectGame = (gameId: string) => (state: RootState) =>
  state.game.games[gameId];

export const selectCurrentGame = (state: RootState) =>
  state.game.currentGameId ? state.game.games[state.game.currentGameId] : null;

export const selectAllGames = (state: RootState) => state.game.games;

export const selectTurnHistory = (gameId: string) => (state: RootState) =>
  state.game.games[gameId]?.turnHistory ?? [];

export const selectCurrentGameTurnHistory = (state: RootState) =>
  state.game.currentGameId ? state.game.games[state.game.currentGameId]?.turnHistory ?? [] : [];

export default gameSlice.reducer;
