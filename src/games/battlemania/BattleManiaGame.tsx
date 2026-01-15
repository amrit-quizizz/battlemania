import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCurrentGame, selectCurrentGameTurnHistory } from '../../store/gameSlice';
import startGame from '../../game/engine/startGame';
import playTurn from '../../game/engine/playTurn';
import endGame from '../../game/engine/endGame';
import resetGame from '../../game/engine/resetGame';
import GameCanvas from '../../components/GameCanvas';
import { useProjectiles } from '../../hooks/useProjectiles';
import { getAmmunitionCatalog, AMMUNITION_MAP } from '../../game/data/ammunition';
import type { GameComponentProps } from '../types';

const MAX_TURNS = 10;

const BattleManiaGame: React.FC<GameComponentProps> = ({ onGameEnd }) => {
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
    const gameId = startGame({ players }, dispatch);
    setCurrentGameId(gameId);
  };

  const handlePlayTurn = () => {
    if (!currentGameId || !currentGame || currentGame.status === 'COMPLETED') return;

    // Random ammunition selection for demo - using catalog
    const catalog = getAmmunitionCatalog();
    const p1Ammo = catalog[Math.floor(Math.random() * catalog.length)].ammunitionId;
    const p2Ammo = catalog[Math.floor(Math.random() * catalog.length)].ammunitionId;

    const turnResult = playTurn(
      currentGameId,
      {
        turnNumber: currentGame.currentTurn,
        actions: [
          { playerId: 'P1', ammunitionId: p1Ammo },
          { playerId: 'P2', ammunitionId: p2Ammo },
        ],
      },
      dispatch
    );

    // Fire projectiles with animation
    fireProjectiles(turnResult);
  };

  const handleEndGame = () => {
    if (!currentGame || currentGame.status === 'COMPLETED') return;
    endGame(currentGame, dispatch);
    onGameEnd?.();
  };

  // Auto-end game after MAX_TURNS
  useEffect(() => {
    if (currentGame && currentGame.status === 'ACTIVE' && currentGame.currentTurn > MAX_TURNS) {
      handleEndGame();
    }
  }, [currentGame?.currentTurn]);

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      {/* Game Canvas - 80% width */}
      <div style={{ width: '80%', height: '100%', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
        <GameCanvas game={currentGame} projectiles={projectiles} />
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
                      {p.playerId}: {p.totalDamageDealt} damage
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
                        const ammo = AMMUNITION_MAP[action.ammunitionId];
                        return (
                          <div key={idx} style={{ fontSize: '10px', marginBottom: '3px' }}>
                            {action.playerId} used {ammo?.icon} {ammo?.name || action.ammunitionId}
                          </div>
                        );
                      })}
                      {turn.damages.map((dmg, idx) => (
                        <div key={idx} style={{ fontSize: '10px', color: '#ef4444' }}>
                          → {dmg.fromPlayer} dealt {dmg.damage} damage to {dmg.toPlayer}
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
