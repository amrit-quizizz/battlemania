export type Team = 'red' | 'blue';
export type UnitType = 'tank' | 'artillery';
export type Command = 'attack' | 'fire' | 'defend' | 'idle';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Unit {
  id: string;
  type: UnitType;
  team: Team;
  position: Position;
  health: number;
  maxHealth: number;
  command: Command;
  target?: string;
  rotation: number;
}

export interface Missile {
  id: string;
  fromUnit: string;
  toUnit: string;
  position: Position;
  targetPosition: Position;
  team: Team;
  damage: number;
  progress: number;
}

export interface GameState {
  units: Unit[];
  missiles: Missile[];
  selectedUnit: string | null;
  isPaused: boolean;
  battleLog: string[];
}

export interface GameEvent {
  type: 'command' | 'damage' | 'destroy' | 'spawn';
  data: Record<string, unknown>;
  timestamp: number;
}
