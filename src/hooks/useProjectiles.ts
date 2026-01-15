import { useState, useEffect, useCallback } from 'react';
import type { TurnResult } from '../game/engine/playTurn';
import { getAmmunitionDetails } from '../game/data/ammunition';

export interface Projectile {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  fromPlayer: string;
  icon: string;
  active: boolean;
}

const PLAYER_POSITIONS = {
  P1: { x: 132, y: 676 }, // Tank 1 turret center
  P2: { x: 1482, y: 676 }, // Tank 2 turret center
};

export const useProjectiles = () => {
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);

  const fireProjectiles = useCallback((turnResult: TurnResult) => {
    const newProjectiles: Projectile[] = turnResult.damages.map((dmg, index) => {
      const fromPos = PLAYER_POSITIONS[dmg.fromPlayer as keyof typeof PLAYER_POSITIONS];
      const toPos = PLAYER_POSITIONS[dmg.toPlayer as keyof typeof PLAYER_POSITIONS];
      const ammoDetails = getAmmunitionDetails(dmg.ammunitionId);

      return {
        id: `projectile-${Date.now()}-${index}`,
        x: fromPos.x,
        y: fromPos.y,
        targetX: toPos.x,
        targetY: toPos.y,
        speed: 8,
        damage: dmg.damage,
        fromPlayer: dmg.fromPlayer,
        icon: ammoDetails?.icon || '💥',
        active: true,
      };
    });

    setProjectiles(prev => [...prev, ...newProjectiles]);
  }, []);

  useEffect(() => {
    if (projectiles.length === 0) return;

    const interval = setInterval(() => {
      setProjectiles(prev => {
        return prev
          .map(projectile => {
            if (!projectile.active) return projectile;

            const dx = projectile.targetX - projectile.x;
            const dy = projectile.targetY - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < projectile.speed) {
              return { ...projectile, active: false };
            }

            const ratio = projectile.speed / distance;
            return {
              ...projectile,
              x: projectile.x + dx * ratio,
              y: projectile.y + dy * ratio,
            };
          })
          .filter(p => p.active);
      });
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(interval);
  }, [projectiles.length]);

  const clearProjectiles = useCallback(() => {
    setProjectiles([]);
  }, []);

  return {
    projectiles: projectiles.filter(p => p.active),
    fireProjectiles,
    clearProjectiles,
  };
};
