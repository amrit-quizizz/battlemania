import { useEffect, useRef } from 'react';
import type { GameInstance } from '../store/gameSlice';
import { getAmmunitionCatalog } from '../game/data/ammunition';

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

  const drawTank = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, facingRight: boolean) => {
    const scale = 1.3; // Scale up the tank

    // Tank body (main rectangle)
    ctx.fillStyle = color;
    ctx.fillRect(x, y + 20, 50 * scale, 30 * scale);

    // Tank turret (smaller rectangle on top)
    ctx.fillRect(x + 15 * scale, y + 10, 20 * scale, 25 * scale);

    // Tank cannon
    ctx.fillStyle = color;
    if (facingRight) {
      ctx.fillRect(x + 50 * scale, y + 20, 25 * scale, 6 * scale);
    } else {
      ctx.fillRect(x - 25 * scale, y + 20, 25 * scale, 6 * scale);
    }

    // Tank tracks (wheels)
    ctx.fillStyle = '#1a1a1a';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(x + 10 * scale + (i * 12 * scale), y + 52 * scale, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tank outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y + 20, 50 * scale, 30 * scale);
    ctx.strokeRect(x + 15 * scale, y + 10, 20 * scale, 25 * scale);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      // Sky gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, 675);
      skyGradient.addColorStop(0, '#1a4d6d');
      skyGradient.addColorStop(1, '#3b7a9e');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, 675);

      // Ground
      const groundGradient = ctx.createLinearGradient(0, 675, 0, canvas.height);
      groundGradient.addColorStop(0, '#4a5c3a');
      groundGradient.addColorStop(1, '#2d3a24');
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, 675, canvas.width, 225);

      // Ground details (grass patches)
      ctx.fillStyle = '#3a4a2a';
      for (let i = 0; i < 30; i++) {
        const x = (i * 60) + (i % 3) * 20;
        ctx.fillRect(x, 675 + (i % 3) * 15, 40, 10);
      }

      // Distant mountains
      ctx.fillStyle = '#2a3a4a';
      ctx.beginPath();
      ctx.moveTo(0, 575);
      ctx.lineTo(250, 400);
      ctx.lineTo(500, 500);
      ctx.lineTo(800, 420);
      ctx.lineTo(1100, 530);
      ctx.lineTo(1350, 450);
      ctx.lineTo(1600, 575);
      ctx.lineTo(1600, 675);
      ctx.lineTo(0, 675);
      ctx.closePath();
      ctx.fill();

      // Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(250, 100, 40, 0, Math.PI * 2);
      ctx.arc(300, 100, 50, 0, Math.PI * 2);
      ctx.arc(350, 100, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(1000, 150, 50, 0, Math.PI * 2);
      ctx.arc(1060, 150, 60, 0, Math.PI * 2);
      ctx.arc(1120, 150, 50, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(1400, 120, 45, 0, Math.PI * 2);
      ctx.arc(1450, 120, 55, 0, Math.PI * 2);
      ctx.arc(1500, 120, 45, 0, Math.PI * 2);
      ctx.fill();

      if (!game) {
        // Draw welcome screen
        ctx.fillStyle = 'white';
        ctx.font = '56px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BattleMania', 800, 400);
        ctx.font = '28px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText('Click "Start Game" to begin', 800, 470);
        ctx.textAlign = 'left';
        return;
      }

      // Draw players as tanks
      if (game.players.length >= 2) {
        // Player 1 (Left side - Blue tank facing right) - at bottom
        drawTank(ctx, 100, 725, '#3b82f6', true);
        ctx.fillStyle = 'white';
        ctx.font = '20px monospace';
        ctx.fillText(`P1`, 125, 765);
        ctx.fillText(`DMG: ${game.players[0].totalDamageDealt}`, 90, 825);

        // Player 2 (Right side - Red tank facing left) - at bottom
        drawTank(ctx, 1450, 725, '#ef4444', false);
        ctx.fillStyle = 'white';
        ctx.fillText(`P2`, 1475, 765);
        ctx.fillText(`DMG: ${game.players[1].totalDamageDealt}`, 1440, 825);
      }

      // Draw projectiles as ammunition icons
      projectiles.forEach((projectile) => {
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(projectile.icon, projectile.x, projectile.y);
      });

      // Draw ammunition catalog (top-right)
      const ammunitionCatalog = getAmmunitionCatalog();

      // Draw ammunition icons with damage
      ctx.fillStyle = 'white';
      const startX = 1550;
      const spacing = -120;
      ammunitionCatalog.forEach((ammo, index) => {
        const x = startX + (index * spacing);

        // Draw icon
        ctx.font = '39px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(ammo.icon, x, 45);

        // Draw damage below icon
        ctx.font = '20px monospace';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`${ammo.damage}`, x, 65);
        ctx.fillStyle = 'white';
      });

      ctx.textAlign = 'left';
    };

    animate();
  }, [game, projectiles]);

  return (
    <canvas
      ref={canvasRef}
      width={1600}
      height={900}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        backgroundColor: '#1a1a1a',
      }}
    />
  );
};

export default GameCanvas;
