import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCurrentGame, selectCurrentGameTurnHistory, selectAmmunition, selectWall, clearSelections, deductPoints } from '../../store/gameSlice';
import startGame from '../../game/engine/startGame';
import playTurn from '../../game/engine/playTurn';
import endGame from '../../game/engine/endGame';
import resetGame from '../../game/engine/resetGame';
import GameCanvas from '../../components/GameCanvas';
import { useProjectiles } from '../../hooks/useProjectiles';
import { getAmmunitionDetails, AMMUNITION_MAP } from '../../game/data/ammunition';
import { getWallDetails, WALL_MAP } from '../../game/data/walls';
import type { GameComponentProps } from '../types';

const MAX_TURNS = 1;

const BattleManiaGame: React.FC<GameComponentProps> = ({ onGameEnd, initialPoints, hideControls }) => {
  const currentGame = useAppSelector(selectCurrentGame);
  const turnHistory = useAppSelector(selectCurrentGameTurnHistory);
  const dispatch = useAppDispatch();
  const { projectiles, fireProjectiles, clearProjectiles } = useProjectiles();
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);

  const handleStartGame = () => {
    // Reset previous game state
    resetGame(dispatch);
    clearProjectiles();

    // Start new game
    const players = [
      { id: 'P1' },
      { id: 'P2' }
    ];
    const gameId = startGame({
      players,
      initialPoints: initialPoints ? { P1: initialPoints.P1, P2: initialPoints.P2 } : undefined
    }, dispatch);
    setCurrentGameId(gameId);
  };

  const handleSelectAmmunition = (playerId: string, ammunitionId: string | null) => {
    if (!currentGameId) return;
    dispatch(selectAmmunition({ gameId: currentGameId, playerId, ammunitionId }));
  };

  const handleSelectWall = (playerId: string, wallId: string | null) => {
    if (!currentGameId) return;
    dispatch(selectWall({ gameId: currentGameId, playerId, wallId }));
  };

  const handlePlayTurn = () => {
    if (!currentGameId || !currentGame || currentGame.status === 'COMPLETED') return;

    const p1 = currentGame.players[0];
    const p2 = currentGame.players[1];

    // Auto-select ammunition based on points when hideControls is true
    if (hideControls) {
      // Find best ammunition each player can afford
      const allAmmunition = Object.values(AMMUNITION_MAP).sort((a, b) => b.cost - a.cost); // Sort by cost descending

      // Auto-select for P1
      if (!p1.selectedAmmunitionId) {
        const affordableP1Ammo = allAmmunition.find(ammo => ammo.cost <= p1.points);
        if (affordableP1Ammo) {
          dispatch(selectAmmunition({ gameId: currentGameId, playerId: 'P1', ammunitionId: affordableP1Ammo.ammunitionId }));
        }
      }

      // Auto-select for P2
      if (!p2.selectedAmmunitionId) {
        const affordableP2Ammo = allAmmunition.find(ammo => ammo.cost <= p2.points);
        if (affordableP2Ammo) {
          dispatch(selectAmmunition({ gameId: currentGameId, playerId: 'P2', ammunitionId: affordableP2Ammo.ammunitionId }));
        }
      }

      // Wait for next render cycle to execute turn with updated selections
      setTimeout(() => handlePlayTurn(), 0);
      return;
    }

    // Get ammunition and wall details (null ammunition means "No Attack")
    const p1Ammo = p1.selectedAmmunitionId ? getAmmunitionDetails(p1.selectedAmmunitionId) : null;
    const p2Ammo = p2.selectedAmmunitionId ? getAmmunitionDetails(p2.selectedAmmunitionId) : null;
    const p1Wall = p1.selectedWallId ? getWallDetails(p1.selectedWallId) : null;
    const p2Wall = p2.selectedWallId ? getWallDetails(p2.selectedWallId) : null;

    // Calculate total costs
    const p1TotalCost = (p1Ammo?.cost || 0) + (p1Wall?.cost || 0);
    const p2TotalCost = (p2Ammo?.cost || 0) + (p2Wall?.cost || 0);

    // Validate players can afford their selections
    if (p1.points < p1TotalCost) {
      console.error('P1 cannot afford selected ammunition and wall');
      return;
    }

    if (p2.points < p2TotalCost) {
      console.error('P2 cannot afford selected ammunition and wall');
      return;
    }

    // Execute turn (null ammunition is allowed - means no attack)
    const turnResult = playTurn(
      currentGameId,
      {
        turnNumber: currentGame.currentTurn,
        actions: [
          { playerId: 'P1', ammunitionId: p1.selectedAmmunitionId, wallId: p1.selectedWallId },
          { playerId: 'P2', ammunitionId: p2.selectedAmmunitionId, wallId: p2.selectedWallId },
        ],
      },
      dispatch
    );

    // Deduct points for both ammunition and walls
    if (p1TotalCost > 0) {
      dispatch(deductPoints({ gameId: currentGameId, playerId: 'P1', points: p1TotalCost }));
    }
    if (p2TotalCost > 0) {
      dispatch(deductPoints({ gameId: currentGameId, playerId: 'P2', points: p2TotalCost }));
    }

    // Clear selections for next turn
    dispatch(clearSelections(currentGameId));

    // Fire projectiles with animation
    fireProjectiles(turnResult);
  };

  const handleEndGame = () => {
    if (!currentGame || currentGame.status === 'COMPLETED') return;
    endGame(currentGame, dispatch);
    onGameEnd?.();
  };

  // Auto-start game when initialPoints are provided (for quiz integration)
  useEffect(() => {
    if (initialPoints && !currentGameId) {
      handleStartGame();
    }
  }, [initialPoints]);

  // Auto-end game after MAX_TURNS
  useEffect(() => {
    if (currentGame && currentGame.status === 'ACTIVE' && currentGame.currentTurn > MAX_TURNS) {
      handleEndGame();
    }
  }, [currentGame?.currentTurn]);

  // Auto-end game when any player reaches 0 health
  useEffect(() => {
    if (currentGame && currentGame.status === 'ACTIVE') {
      const anyPlayerDead = currentGame.players.some(p => p.health <= 0);
      if (anyPlayerDead) {
        handleEndGame();
      }
    }
  }, [currentGame?.players]);

  // Auto-play turn when game starts in hideControls mode
  useEffect(() => {
    if (hideControls && currentGame && currentGame.status === 'ACTIVE' && currentGame.currentTurn === 1) {
      // Small delay to ensure game is fully initialized
      const timer = setTimeout(() => {
        handlePlayTurn();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hideControls, currentGame?.status, currentGame?.currentTurn]);

  // If hideControls is true, render only the game canvas without overlay UI
  if (hideControls) {
    return (
      <div className="hide-controls-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
        <GameCanvas game={currentGame} projectiles={projectiles} onSelectAmmunition={handleSelectAmmunition} onSelectWall={handleSelectWall} />
        {/* Hide the bottom overlay with CSS - target the last absolute positioned div in GameCanvas */}
        <style>{`
          .hide-controls-wrapper > div > div[style*="position: absolute"][style*="bottom: 0"] {
            display: none !important;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      {/* Game Canvas - 80% width */}
      <div style={{ width: '80%', height: '100%', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
        <GameCanvas game={currentGame} projectiles={projectiles} onSelectAmmunition={handleSelectAmmunition} onSelectWall={handleSelectWall} />
      </div>

      {/* Control Panel - 20% width */}
      <div style={{ width: '20%', height: '100%', backgroundColor: '#242424', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ marginTop: 0, fontSize: '20px', borderBottom: '2px solid #444', paddingBottom: '10px' }}>BattleMania</h2>

        {/* Game Info Section */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '8px', border: '1px solid #444' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid #444'
          }}>
            <span style={{ color: '#999', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Turn</span>
            <span style={{
              fontSize: '20px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              color: '#3b82f6'
            }}>
              {currentGame?.currentTurn || '-'}<span style={{ color: '#666' }}>/{MAX_TURNS}</span>
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#999', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</span>
            <span style={{
              fontSize: '14px',
              fontWeight: 'bold',
              padding: '4px 12px',
              borderRadius: '4px',
              backgroundColor: currentGame?.status === 'ACTIVE' ? '#166534' : currentGame?.status === 'COMPLETED' ? '#991b1b' : '#374151',
              color: currentGame?.status === 'ACTIVE' ? '#22c55e' : currentGame?.status === 'COMPLETED' ? '#ef4444' : '#9ca3af'
            }}>
              {currentGame?.status || 'NOT STARTED'}
            </span>
          </div>
        </div>

        {!currentGame && (
          <div style={{ marginBottom: '20px' }}>
            <button onClick={handleStartGame} style={{ width: '100%', fontSize: '16px', padding: '15px' }}>Start Game</button>
          </div>
        )}

        {currentGame && (
          <>
            {currentGame.status === 'COMPLETED' && currentGame.winner && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#166534', borderRadius: '8px', border: '2px solid #22c55e' }}>
                <h3 style={{ margin: 0, color: '#22c55e', fontSize: '18px' }}>🏆 Game Over!</h3>
                <p style={{ fontSize: '16px', margin: '10px 0', color: 'white' }}>
                  Winner: <strong>{currentGame.winner}</strong>
                </p>
                <div style={{ fontSize: '12px', color: '#86efac', marginBottom: '10px' }}>
                  {currentGame.players.map(p => (
                    <div key={p.playerId}>
                      {p.playerId}: {p.health} HP | {p.totalDamageDealt} DMG
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleStartGame}
                  style={{ width: '100%', backgroundColor: '#16a34a' }}
                >
                  New Game
                </button>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={handlePlayTurn}
                disabled={currentGame.status === 'COMPLETED'}
                style={{ width: '100%', marginBottom: '10px' }}
              >
                Play Turn
              </button>
              <button
                onClick={handleEndGame}
                disabled={currentGame.status === 'COMPLETED'}
                style={{ width: '100%', marginBottom: '10px', backgroundColor: '#dc2626' }}
              >
                End Game
              </button>
              <button
                onClick={handleStartGame}
                style={{ width: '100%', backgroundColor: '#f59e0b' }}
              >
                Reset Game
              </button>
            </div>

            {turnHistory.length > 0 && (
              <div style={{ fontSize: '11px' }}>
                <strong>Turn History:</strong>
                <div style={{ marginTop: '10px', maxHeight: 'calc(100vh - 600px)', overflowY: 'auto' }}>
                  {turnHistory.map((turn) => (
                    <div key={turn.turnNumber} style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Turn {turn.turnNumber}</div>
                      {turn.actions.map((action, idx) => {
                        const ammo = action.ammunitionId ? AMMUNITION_MAP[action.ammunitionId] : null;
                        const wall = action.wallId ? WALL_MAP[action.wallId] : null;
                        return (
                          <div key={idx} style={{ fontSize: '10px', marginBottom: '3px' }}>
                            {action.playerId} used {ammo ? `${ammo.icon} ${ammo.name}` : 'No Attack'}
                            {wall && ` + ${wall.icon} ${wall.name}`}
                          </div>
                        );
                      })}
                      {turn.damages.map((dmg, idx) => (
                        <div key={idx} style={{ fontSize: '10px', color: '#ef4444' }}>
                          → {dmg.fromPlayer} dealt {dmg.damage} damage to {dmg.toPlayer}
                          {dmg.defendedBy && dmg.defendedBy > 0 && ` (blocked ${dmg.defendedBy})`}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BattleManiaGame;
