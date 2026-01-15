export interface Wall {
  wallId: string;
  name: string;
  defense: number;
  cost: number;
  icon: string;
}

export const WALL_MAP: Record<string, Wall> = {
  WALL_01: { wallId: 'WALL_01', name: 'Light Shield', defense: 10, cost: 10, icon: '🛡️' },
  WALL_02: { wallId: 'WALL_02', name: 'Shield', defense: 20, cost: 20, icon: '🛡️' },
  WALL_03: { wallId: 'WALL_03', name: 'Heavy Shield', defense: 30, cost: 30, icon: '🛡️' },
  WALL_04: { wallId: 'WALL_04', name: 'Fortress', defense: 40, cost: 40, icon: '🏰' },
  WALL_05: { wallId: 'WALL_05', name: 'Mega Fortress', defense: 50, cost: 50, icon: '🏰' }
};

export const getWallCatalog = (): Wall[] => {
  return Object.values(WALL_MAP);
};

export const getWallDetails = (wallId: string): Wall | null => {
  return WALL_MAP[wallId] || null;
};
