import { useEffect, useRef } from 'react';
import type { GameInstance } from '../store/gameSlice';
import { getAmmunitionCatalog } from '../game/data/ammunition';
import { getWallCatalog, getWallDetails } from '../game/data/walls';

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
  onSelectAmmunition: (playerId: string, ammunitionId: string | null) => void;
  onSelectWall: (playerId: string, wallId: string | null) => void;
}

const GameCanvas = ({ game, projectiles, onSelectAmmunition, onSelectWall }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawTank = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    const scale = 1.5; // Scale up the tank
    const bodyWidth = 50 * scale;
    const bodyHeight = 30 * scale;
    const bodyY = y + (20 * scale);
    const wheelRadius = 6 * scale;

    // Tank body (main rectangle)
    ctx.fillStyle = color;
    ctx.fillRect(x, bodyY, bodyWidth, bodyHeight);

    // Tank turret (smaller rectangle on top)
    ctx.fillRect(x + (15 * scale), y + (10 * scale), 20 * scale, 25 * scale);

    // Tank tracks (wheels) - positioned at bottom with 50% submerged
    ctx.fillStyle = '#1a1a1a';
    const wheelY = bodyY + bodyHeight + (wheelRadius * 0.5); // 50% submerged below tank
    const spacing = (bodyWidth - wheelRadius * 2) / 4; // Space between wheels
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const wheelX = x + wheelRadius + (i * spacing);
      ctx.arc(wheelX, wheelY, wheelRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tank outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, bodyY, bodyWidth, bodyHeight);
    ctx.strokeRect(x + (15 * scale), y + (10 * scale), 20 * scale, 25 * scale);
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
        // Player 1 (Left side - Blue tank) - at bottom
        drawTank(ctx, 50, 650, '#3b82f6');

        // Player label above tank
        ctx.fillStyle = 'white';
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`P1`, 107, 640);

        // Damage dealt below tank
        ctx.font = '28px monospace';
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.fillText(`DMG: ${game.players[0].totalDamageDealt}`, 107, 760);

        // Draw P1's wall if selected
        if (game.players[0].selectedWallId) {
          const wallDetails = getWallDetails(game.players[0].selectedWallId);
          if (wallDetails) {
            ctx.font = '60px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(wallDetails.icon, 20, 676);
          }
        }

        // Player 2 (Right side - Red tank) - at bottom
        drawTank(ctx, 1488, 650, '#ef4444');

        // Player label above tank
        ctx.fillStyle = 'white';
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`P2`, 1545, 640);

        // Damage dealt below tank
        ctx.font = '28px monospace';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`DMG: ${game.players[1].totalDamageDealt}`, 1545, 760);

        // Draw P2's wall if selected
        if (game.players[1].selectedWallId) {
          const wallDetails = getWallDetails(game.players[1].selectedWallId);
          if (wallDetails) {
            ctx.font = '60px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(wallDetails.icon, 1568, 676);
          }
        }
      }

      // Draw projectiles as ammunition icons
      projectiles.forEach((projectile) => {
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(projectile.icon, projectile.x, projectile.y);
      });

    };

    animate();
  }, [game, projectiles]);

  const ammunitionCatalog = getAmmunitionCatalog();
  const wallCatalog = getWallCatalog();

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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

      {/* Ammunition & Wall Selection UI - Overlay at bottom */}
      {game && game.status === 'ACTIVE' && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '15%',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          borderTop: '2px solid #666'
        }}>
          {/* P1 Section */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '10px 15px',
            gap: '8px'
          }}>
            {/* Row 1: Player info + Ammunition */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ minWidth: '100px' }}>
                <div style={{
                  color: '#3b82f6',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}>
                  {game.players[0].playerId}
                </div>
                <div style={{
                  color: 'white',
                  fontSize: '16px',
                  fontFamily: 'monospace'
                }}>
                  Pts: {game.players[0].points}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                {/* "No Ammunition" button */}
                <button
                  onClick={() => onSelectAmmunition('P1', null)}
                  style={{
                    width: '80px',
                    height: '60px',
                    backgroundColor: game.players[0].selectedAmmunitionId === null ? 'rgba(251, 191, 36, 0.3)' : 'rgba(60, 60, 60, 0.8)',
                    border: game.players[0].selectedAmmunitionId === null ? '4px solid #fbbf24' : '2px solid #666',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#999', fontFamily: 'monospace', textAlign: 'center' }}>No Ammo</div>
                </button>

                {ammunitionCatalog.map((ammo) => {
                  const player = game.players[0];
                  const isSelected = player.selectedAmmunitionId === ammo.ammunitionId;
                  const canAfford = player.points >= ammo.cost;

                  return (
                    <button
                      key={ammo.ammunitionId}
                      onClick={() => canAfford && onSelectAmmunition('P1', ammo.ammunitionId)}
                      disabled={!canAfford}
                      style={{
                        width: '80px',
                        height: '60px',
                        backgroundColor: isSelected ? 'rgba(251, 191, 36, 0.3)' : 'rgba(60, 60, 60, 0.8)',
                        border: isSelected ? '4px solid #fbbf24' : '2px solid #666',
                        borderRadius: '4px',
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                        opacity: canAfford ? 1 : 0.4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '28px' }}>{ammo.icon}</div>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#fbbf24',
                        fontFamily: 'monospace'
                      }}>
                        ${ammo.cost}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Walls */}
            <div style={{ display: 'flex', gap: '8px', paddingLeft: '115px' }}>
              {/* "No Wall" button */}
              <button
                onClick={() => onSelectWall('P1', null)}
                style={{
                  width: '80px',
                  height: '50px',
                  backgroundColor: game.players[0].selectedWallId === null ? 'rgba(251, 191, 36, 0.3)' : 'rgba(60, 60, 60, 0.8)',
                  border: game.players[0].selectedWallId === null ? '3px solid #fbbf24' : '2px solid #666',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '10px', color: '#999', fontFamily: 'monospace' }}>No Wall</div>
              </button>

              {wallCatalog.map((wall) => {
                const player = game.players[0];
                const isSelected = player.selectedWallId === wall.wallId;
                const canAfford = player.points >= wall.cost;

                return (
                  <button
                    key={wall.wallId}
                    onClick={() => canAfford && onSelectWall('P1', wall.wallId)}
                    disabled={!canAfford}
                    style={{
                      width: '80px',
                      height: '50px',
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(60, 60, 60, 0.8)',
                      border: isSelected ? '3px solid #3b82f6' : '2px solid #666',
                      borderRadius: '4px',
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      opacity: canAfford ? 1 : 0.4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '20px' }}>{wall.icon}</div>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#60a5fa',
                      fontFamily: 'monospace'
                    }}>
                      ${wall.cost}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: '2px', backgroundColor: '#666' }} />

          {/* P2 Section */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '10px 15px',
            gap: '8px'
          }}>
            {/* Row 1: Player info + Ammunition */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ minWidth: '100px' }}>
                <div style={{
                  color: '#ef4444',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}>
                  {game.players[1].playerId}
                </div>
                <div style={{
                  color: 'white',
                  fontSize: '16px',
                  fontFamily: 'monospace'
                }}>
                  Pts: {game.players[1].points}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                {/* "No Ammunition" button */}
                <button
                  onClick={() => onSelectAmmunition('P2', null)}
                  style={{
                    width: '80px',
                    height: '60px',
                    backgroundColor: game.players[1].selectedAmmunitionId === null ? 'rgba(251, 191, 36, 0.3)' : 'rgba(60, 60, 60, 0.8)',
                    border: game.players[1].selectedAmmunitionId === null ? '4px solid #fbbf24' : '2px solid #666',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#999', fontFamily: 'monospace', textAlign: 'center' }}>No Ammo</div>
                </button>

                {ammunitionCatalog.map((ammo) => {
                  const player = game.players[1];
                  const isSelected = player.selectedAmmunitionId === ammo.ammunitionId;
                  const canAfford = player.points >= ammo.cost;

                  return (
                    <button
                      key={ammo.ammunitionId}
                      onClick={() => canAfford && onSelectAmmunition('P2', ammo.ammunitionId)}
                      disabled={!canAfford}
                      style={{
                        width: '80px',
                        height: '60px',
                        backgroundColor: isSelected ? 'rgba(251, 191, 36, 0.3)' : 'rgba(60, 60, 60, 0.8)',
                        border: isSelected ? '4px solid #fbbf24' : '2px solid #666',
                        borderRadius: '4px',
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                        opacity: canAfford ? 1 : 0.4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '28px' }}>{ammo.icon}</div>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#fbbf24',
                        fontFamily: 'monospace'
                      }}>
                        ${ammo.cost}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Walls */}
            <div style={{ display: 'flex', gap: '8px', paddingLeft: '115px' }}>
              {/* "No Wall" button */}
              <button
                onClick={() => onSelectWall('P2', null)}
                style={{
                  width: '80px',
                  height: '50px',
                  backgroundColor: game.players[1].selectedWallId === null ? 'rgba(251, 191, 36, 0.3)' : 'rgba(60, 60, 60, 0.8)',
                  border: game.players[1].selectedWallId === null ? '3px solid #fbbf24' : '2px solid #666',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '10px', color: '#999', fontFamily: 'monospace' }}>No Wall</div>
              </button>

              {wallCatalog.map((wall) => {
                const player = game.players[1];
                const isSelected = player.selectedWallId === wall.wallId;
                const canAfford = player.points >= wall.cost;

                return (
                  <button
                    key={wall.wallId}
                    onClick={() => canAfford && onSelectWall('P2', wall.wallId)}
                    disabled={!canAfford}
                    style={{
                      width: '80px',
                      height: '50px',
                      backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.3)' : 'rgba(60, 60, 60, 0.8)',
                      border: isSelected ? '3px solid #ef4444' : '2px solid #666',
                      borderRadius: '4px',
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      opacity: canAfford ? 1 : 0.4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '20px' }}>{wall.icon}</div>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#f87171',
                      fontFamily: 'monospace'
                    }}>
                      ${wall.cost}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
