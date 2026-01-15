import type { GameModule } from './types';
import { battleManiaModule } from './battlemania';

/**
 * Game Registry
 * Add new games here to make them available in the application
 */
export const gameRegistry: Record<string, GameModule> = {
  battlemania: battleManiaModule,
  // Add more games here in the future:
  // tetris: tetrisModule,
  // chess: chessModule,
};

/**
 * Get all available games
 */
export const getAllGames = (): GameModule[] => {
  return Object.values(gameRegistry);
};

/**
 * Get a specific game by ID
 */
export const getGame = (gameId: string): GameModule | undefined => {
  return gameRegistry[gameId];
};

/**
 * Default game to load
 */
export const DEFAULT_GAME_ID = 'battlemania';
