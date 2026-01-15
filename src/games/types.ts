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
}

/**
 * Game module interface - what each game must export
 */
export interface GameModule {
  game: Game;
  GameComponent: React.FC<GameComponentProps>;
}
