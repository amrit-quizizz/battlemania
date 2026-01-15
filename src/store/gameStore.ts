import { create } from 'zustand';
import { Unit, Missile, Command, Team, GameState } from '../types/game';

interface GameStore extends GameState {
  addUnit: (unit: Unit) => void;
  removeUnit: (id: string) => void;
  updateUnit: (id: string, updates: Partial<Unit>) => void;
  setCommand: (unitId: string, command: Command, targetId?: string) => void;
  addMissile: (missile: Missile) => void;
  removeMissile: (id: string) => void;
  updateMissile: (id: string, updates: Partial<Missile>) => void;
  selectUnit: (id: string | null) => void;
  damageUnit: (id: string, damage: number) => void;
  togglePause: () => void;
  addBattleLog: (message: string) => void;
  initializeGame: () => void;
}

const createInitialUnits = (): Unit[] => {
  const units: Unit[] = [];

  // Red team (left side)
  for (let i = 0; i < 3; i++) {
    units.push({
      id: `red-tank-${i}`,
      type: 'tank',
      team: 'red',
      position: { x: -8, y: 0.5, z: -3 + i * 3 },
      health: 100,
      maxHealth: 100,
      command: 'idle',
      rotation: Math.PI / 2,
    });
  }

  units.push({
    id: 'red-artillery-0',
    type: 'artillery',
    team: 'red',
    position: { x: -10, y: 0.5, z: 0 },
    health: 80,
    maxHealth: 80,
    command: 'idle',
    rotation: Math.PI / 2,
  });

  // Blue team (right side)
  for (let i = 0; i < 3; i++) {
    units.push({
      id: `blue-tank-${i}`,
      type: 'tank',
      team: 'blue',
      position: { x: 8, y: 0.5, z: -3 + i * 3 },
      health: 100,
      maxHealth: 100,
      command: 'idle',
      rotation: -Math.PI / 2,
    });
  }

  units.push({
    id: 'blue-artillery-0',
    type: 'artillery',
    team: 'blue',
    position: { x: 10, y: 0.5, z: 0 },
    health: 80,
    maxHealth: 80,
    command: 'idle',
    rotation: -Math.PI / 2,
  });

  return units;
};

export const useGameStore = create<GameStore>((set, get) => ({
  units: [],
  missiles: [],
  selectedUnit: null,
  isPaused: false,
  battleLog: [],

  addUnit: (unit) => set((state) => ({ units: [...state.units, unit] })),

  removeUnit: (id) => set((state) => ({
    units: state.units.filter((u) => u.id !== id),
    selectedUnit: state.selectedUnit === id ? null : state.selectedUnit,
  })),

  updateUnit: (id, updates) => set((state) => ({
    units: state.units.map((u) => u.id === id ? { ...u, ...updates } : u),
  })),

  setCommand: (unitId, command, targetId) => {
    const unit = get().units.find((u) => u.id === unitId);
    if (!unit) return;

    set((state) => ({
      units: state.units.map((u) =>
        u.id === unitId ? { ...u, command, target: targetId } : u
      ),
    }));

    const commandMessages: Record<Command, string> = {
      attack: `${unit.team.toUpperCase()} ${unit.type} moving to attack!`,
      fire: `${unit.team.toUpperCase()} ${unit.type} opening fire!`,
      defend: `${unit.team.toUpperCase()} ${unit.type} taking defensive position!`,
      idle: `${unit.team.toUpperCase()} ${unit.type} standing by.`,
    };

    get().addBattleLog(commandMessages[command]);
  },

  addMissile: (missile) => set((state) => ({ missiles: [...state.missiles, missile] })),

  removeMissile: (id) => set((state) => ({
    missiles: state.missiles.filter((m) => m.id !== id)
  })),

  updateMissile: (id, updates) => set((state) => ({
    missiles: state.missiles.map((m) => m.id === id ? { ...m, ...updates } : m),
  })),

  selectUnit: (id) => set({ selectedUnit: id }),

  damageUnit: (id, damage) => {
    const unit = get().units.find((u) => u.id === id);
    if (!unit) return;

    const newHealth = Math.max(0, unit.health - damage);

    if (newHealth <= 0) {
      get().addBattleLog(`${unit.team.toUpperCase()} ${unit.type} destroyed!`);
      get().removeUnit(id);
    } else {
      get().updateUnit(id, { health: newHealth });
      get().addBattleLog(`${unit.team.toUpperCase()} ${unit.type} hit! (${newHealth}/${unit.maxHealth} HP)`);
    }
  },

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  addBattleLog: (message) => set((state) => ({
    battleLog: [...state.battleLog.slice(-49), `[${new Date().toLocaleTimeString()}] ${message}`],
  })),

  initializeGame: () => set({
    units: createInitialUnits(),
    missiles: [],
    selectedUnit: null,
    isPaused: false,
    battleLog: ['Battle initialized! Select units and issue commands.'],
  }),
}));
