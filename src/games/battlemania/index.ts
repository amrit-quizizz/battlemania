import type { GameModule } from '../types';
import BattleManiaGame from './BattleManiaGame';

export const battleManiaModule: GameModule = {
  game: {
    id: 'battlemania',
    name: 'BattleMania',
    description: 'Turn-based tank battle game where players shoot ammunition at each other',
    minPlayers: 2,
    maxPlayers: 2,
  },
  GameComponent: BattleManiaGame,
};
