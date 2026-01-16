import { useEffect, useRef } from 'react';

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

interface BattleDisplayProps {
  projectiles: Projectile[];
  teamScores?: { teamA: number; teamB: number };
  playerHealth?: { teamA: number; teamB: number };
}

const BattleDisplay = ({ projectiles, teamScores, playerHealth }: BattleDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawTank = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    const scale = 1.3;

    // Tank body
    ctx.fillStyle = color;
    ctx.fillRect(x, y + 20, 50 * scale, 30 * scale);

    // Tank turret
    ctx.fillRect(x + 15 * scale, y + 10, 20 * scale, 25 * scale);

    // Tank tracks
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
      const skyGradient = ctx.createLinearGradient(0, 0, 0, 270);
      skyGradient.addColorStop(0, '#1a4d6d');
      skyGradient.addColorStop(1, '#3b7a9e');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, 270);

      // Ground
      const groundGradient = ctx.createLinearGradient(0, 270, 0, canvas.height);
      groundGradient.addColorStop(0, '#4a5c3a');
      groundGradient.addColorStop(1, '#2d3a24');
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, 270, canvas.width, 90);

      // Ground details
      ctx.fillStyle = '#3a4a2a';
      for (let i = 0; i < 15; i++) {
        const x = (i * 40) + (i % 3) * 10;
        ctx.fillRect(x, 270 + (i % 3) * 8, 30, 6);
      }

      // Distant mountains
      ctx.fillStyle = '#2a3a4a';
      ctx.beginPath();
      ctx.moveTo(0, 230);
      ctx.lineTo(125, 160);
      ctx.lineTo(250, 200);
      ctx.lineTo(400, 170);
      ctx.lineTo(550, 210);
      ctx.lineTo(600, 180);
      ctx.lineTo(600, 270);
      ctx.lineTo(0, 270);
      ctx.closePath();
      ctx.fill();

      // Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(125, 40, 20, 0, Math.PI * 2);
      ctx.arc(150, 40, 25, 0, Math.PI * 2);
      ctx.arc(175, 40, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(450, 60, 25, 0, Math.PI * 2);
      ctx.arc(480, 60, 30, 0, Math.PI * 2);
      ctx.arc(510, 60, 25, 0, Math.PI * 2);
      ctx.fill();

      // Draw tanks
      // Player 1 (Left side - Blue tank)
      drawTank(ctx, 40, 260, '#3b82f6');
      ctx.fillStyle = 'white';
      ctx.font = '16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Team A', 50, 305);

      // Draw Team A health bar
      if (playerHealth) {
        const healthPercent = playerHealth.teamA / 500;
        const barWidth = 80;
        const barHeight = 10;
        const barX = 40;
        const barY = 245;

        // Background (dark red)
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health fill (gradient based on health)
        if (healthPercent > 0.5) {
          ctx.fillStyle = '#22c55e'; // Green
        } else if (healthPercent > 0.25) {
          ctx.fillStyle = '#eab308'; // Yellow
        } else {
          ctx.fillStyle = '#ef4444'; // Red
        }
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Health text
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${playerHealth.teamA}/500`, barX + barWidth / 2, barY - 5);
      }

      // Player 2 (Right side - Red tank)
      drawTank(ctx, 510, 260, '#ef4444');
      ctx.fillStyle = 'white';
      ctx.font = '16px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('Team B', 590, 305);

      // Draw Team B health bar
      if (playerHealth) {
        const healthPercent = playerHealth.teamB / 500;
        const barWidth = 80;
        const barHeight = 10;
        const barX = 510;
        const barY = 245;

        // Background (dark red)
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health fill (gradient based on health)
        if (healthPercent > 0.5) {
          ctx.fillStyle = '#22c55e'; // Green
        } else if (healthPercent > 0.25) {
          ctx.fillStyle = '#eab308'; // Yellow
        } else {
          ctx.fillStyle = '#ef4444'; // Red
        }
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Health text
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${playerHealth.teamB}/500`, barX + barWidth / 2, barY - 5);
      }

      // Draw team scores if provided
      if (teamScores) {
        ctx.save();
        const padding = 15;
        const x = padding;
        const y = 10;
        const width = 600 - (padding * 2);
        const height = 40;
        const radius = 8;

        // Draw rounded rectangle background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';

        // Team A score (left side - blue)
        ctx.fillStyle = '#3b82f6';
        ctx.fillText(`Team A: ${teamScores.teamA}`, 145, 38);

        // VS separator
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('VS', 300, 38);

        // Team B score (right side - red)
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(`Team B: ${teamScores.teamB}`, 455, 38);

        ctx.restore();
      }

      // Draw projectiles
      projectiles.forEach((projectile) => {
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(projectile.icon, projectile.x, projectile.y);
      });
    };

    animate();
  }, [projectiles, teamScores, playerHealth]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={360}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        backgroundColor: '#1a1a1a',
        borderRadius: '12px'
      }}
    />
  );
};

export default BattleDisplay;
