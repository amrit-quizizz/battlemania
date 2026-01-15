export interface Ammunition {
  ammunitionId: string;
  name: string;
  damage: number;
  cost: number;
  icon: string;
}

export const AMMUNITION_MAP: Record<string, Ammunition> = {
  AMMO_01: {
    ammunitionId: 'AMMO_01',
    name: 'Small Missile',
    damage: 10,
    cost: 10,
    icon: '🚀',
  },
  AMMO_02: {
    ammunitionId: 'AMMO_02',
    name: 'Laser Beam',
    damage: 20,
    cost: 20,
    icon: '⚡',
  },
  AMMO_03: {
    ammunitionId: 'AMMO_03',
    name: 'Heavy Bomb',
    damage: 30,
    cost: 30,
    icon: '💥',
  },
  AMMO_04: {
    ammunitionId: 'AMMO_04',
    name: 'Heavy Cannon',
    damage: 40,
    cost: 40,
    icon: '💣',
  },
  AMMO_05: {
    ammunitionId: 'AMMO_05',
    name: 'Plasma Blast',
    damage: 50,
    cost: 50,
    icon: '🔥',
  },
};

/**
 * Get ammunition details by ID
 * Returns the full ammunition object or null if not found
 */
export const getAmmunitionDetails = (ammunitionId: string): Ammunition | null => {
  return AMMUNITION_MAP[ammunitionId] ?? null;
};

/**
 * GET AMMUNITION CATALOG
 * Returns the full catalog of available ammunition
 */
export const getAmmunitionCatalog = (): Ammunition[] => {
  return Object.values(AMMUNITION_MAP);
};
