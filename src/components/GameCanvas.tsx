import { useEffect, useRef } from 'react';
import type { GameInstance } from '../store/gameSlice';

interface Projectile {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  fromPlayer: string;
  icon: string;
}

interface GameCanvasProps {
  game: GameInstance | null;
  projectiles: Projectile[];
}

const GameCanvas = ({ game, projectiles }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw players as rectangles
      if (game && game.players.length >= 2) {
        // Player 1 (Left side - Blue)
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(50, 150, 60, 100);
        ctx.fillStyle = 'white';
        ctx.font = '14px monospace';
        ctx.fillText(`P1`, 65, 200);
        ctx.fillText(`DMG: ${game.players[0].totalDamageDealt}`, 40, 270);

        // Player 2 (Right side - Red)
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(690, 150, 60, 100);
        ctx.fillStyle = 'white';
        ctx.fillText(`P2`, 705, 200);
        ctx.fillText(`DMG: ${game.players[1].totalDamageDealt}`, 680, 270);
      }

      // Draw projectiles as ammunition icons
      projectiles.forEach((projectile) => {
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(projectile.icon, projectile.x, projectile.y);
      });

      // Draw turn number
      if (game) {
        ctx.fillStyle = 'white';
        ctx.font = '20px monospace';
        ctx.fillText(`Turn: ${game.currentTurn}`, 350, 30);
        ctx.fillText(`Status: ${game.status}`, 320, 60);
      }
    };

    animate();
  }, [game, projectiles]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={400}
      style={{
        border: '2px solid #555',
        borderRadius: '8px',
        backgroundColor: '#1a1a1a',
      }}
    />
  );
};

export default GameCanvas;
