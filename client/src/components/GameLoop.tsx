import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/gameStore';

// Simple UUID generator
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function GameLoop() {
  const units = useGameStore((state) => state.units);
  const addMissile = useGameStore((state) => state.addMissile);
  const isPaused = useGameStore((state) => state.isPaused);
  const lastFireTime = useRef<Record<string, number>>({});

  useFrame(() => {
    if (isPaused) return;

    const now = Date.now();

    units.forEach((unit) => {
      // Fire command - shoot missiles at target
      if (unit.command === 'fire' && unit.target) {
        const lastFire = lastFireTime.current[unit.id] || 0;
        const fireRate = unit.type === 'artillery' ? 3000 : 2000; // ms between shots

        if (now - lastFire > fireRate) {
          const target = units.find((u) => u.id === unit.target);
          if (target) {
            addMissile({
              id: generateId(),
              fromUnit: unit.id,
              toUnit: target.id,
              position: { ...unit.position },
              targetPosition: { ...target.position },
              team: unit.team,
              damage: unit.type === 'artillery' ? 25 : 15,
              progress: 0,
            });
            lastFireTime.current[unit.id] = now;
          }
        }
      }

      // Attack command - move and auto-fire
      if (unit.command === 'attack' && unit.target) {
        const lastFire = lastFireTime.current[unit.id] || 0;
        const fireRate = 2500;

        if (now - lastFire > fireRate) {
          const target = units.find((u) => u.id === unit.target);
          if (target) {
            addMissile({
              id: generateId(),
              fromUnit: unit.id,
              toUnit: target.id,
              position: { ...unit.position },
              targetPosition: { ...target.position },
              team: unit.team,
              damage: 10,
              progress: 0,
            });
            lastFireTime.current[unit.id] = now;
          }
        }
      }
    });
  });

  return null;
}
