/**
 * Common interface for all games
 */
export interface Game {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
}

/**
 * Game component props that all game implementations should accept
 */
export interface GameComponentProps {
  // Any common props that games need
  onGameEnd?: () => void;
  // Optional initial points for players (defaults to 100)
  initialPoints?: { P1: number; P2: number };
  // Hide control panel and show only game canvas
  hideControls?: boolean;
}

/**
 * Game module interface - what each game must export
 */
export interface GameModule {
  game: Game;
  GameComponent: React.FC<GameComponentProps>;
}
