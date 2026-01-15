# Games Module

This directory contains all game modules for the application. Each game is self-contained and follows a standard interface.

## Directory Structure

```
games/
├── types.ts                 # Common game interfaces
├── registry.ts             # Game registry (register new games here)
├── battlemania/            # BattleMania game module
│   ├── index.ts           # Game module export
│   └── BattleManiaGame.tsx # Game component
└── [your-game]/           # Your new game module
    ├── index.ts
    └── YourGame.tsx
```

## How to Add a New Game

### 1. Create a new game directory

```bash
mkdir src/games/your-game-name
```

### 2. Create your game component

Create `src/games/your-game-name/YourGame.tsx`:

```tsx
import type { GameComponentProps } from '../types';

const YourGame: React.FC<GameComponentProps> = ({ onGameEnd }) => {
  // Your game logic here

  return (
    <div>
      {/* Your game UI here */}
    </div>
  );
};

export default YourGame;
```

### 3. Create the game module export

Create `src/games/your-game-name/index.ts`:

```tsx
import type { GameModule } from '../types';
import YourGame from './YourGame';

export const yourGameModule: GameModule = {
  game: {
    id: 'your-game-id',
    name: 'Your Game Name',
    description: 'Description of your game',
    minPlayers: 1,
    maxPlayers: 4,
  },
  GameComponent: YourGame,
};
```

### 4. Register your game

Add your game to `src/games/registry.ts`:

```tsx
import { yourGameModule } from './your-game-name';

export const gameRegistry: Record<string, GameModule> = {
  battlemania: battleManiaModule,
  yourgame: yourGameModule,  // Add this line
};
```

### 5. Set as default (optional)

To make your game the default, update `DEFAULT_GAME_ID` in `registry.ts`:

```tsx
export const DEFAULT_GAME_ID = 'yourgame';
```

## Game Module Interface

Each game must export a `GameModule` that includes:

- **game**: Metadata about the game
  - `id`: Unique identifier
  - `name`: Display name
  - `description`: Short description
  - `minPlayers`: Minimum number of players
  - `maxPlayers`: Maximum number of players

- **GameComponent**: React component that renders the game
  - Receives `GameComponentProps`
  - Should handle all game logic and UI

## Example: BattleMania

See `src/games/battlemania/` for a complete working example of a game module.

## Future Enhancements

You can extend this system to support:
- Game selection menu
- Multiplayer matchmaking
- Game settings/configuration
- Saved games/state
- Leaderboards per game
