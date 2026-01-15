import { useState, useEffect } from 'react'
import './App.css'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { selectCurrentGame, selectCurrentGameTurnHistory } from './store/gameSlice'
import startGame from './game/engine/startGame'
import playTurn from './game/engine/playTurn'
import endGame from './game/engine/endGame'
import GameCanvas from './components/GameCanvas'
import { useProjectiles } from './hooks/useProjectiles'
import { getAmmunitionCatalog, AMMUNITION_MAP } from './game/data/ammunition'

const MAX_TURNS = 10;

function App() {
  const currentGame = useAppSelector(selectCurrentGame)
  const turnHistory = useAppSelector(selectCurrentGameTurnHistory)
  const dispatch = useAppDispatch()
  const { projectiles, fireProjectiles } = useProjectiles()
  const [currentGameId, setCurrentGameId] = useState<string | null>(null)

  const handleStartGame = () => {
    const players = [
      { id: 'P1' },
      { id: 'P2' }
    ];
    const gameId = startGame({ players }, dispatch);
    setCurrentGameId(gameId);
  }

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
  }

  const handleEndGame = () => {
    if (!currentGame || currentGame.status === 'COMPLETED') return;
    endGame(currentGame, dispatch);
  }

  // Auto-end game after MAX_TURNS
  useEffect(() => {
    if (currentGame && currentGame.status === 'ACTIVE' && currentGame.currentTurn > MAX_TURNS) {
      handleEndGame();
    }
  }, [currentGame?.currentTurn]);

  return (
    <>
      <h1>BattleMania</h1>

      <div className="card">
        {!currentGame && (
          <button onClick={handleStartGame}>Start Game</button>
        )}

        {currentGame && (
          <>
            <GameCanvas game={currentGame} projectiles={projectiles} />

            {currentGame.status === 'COMPLETED' && currentGame.winner && (
              <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#166534', borderRadius: '8px', border: '2px solid #22c55e' }}>
                <h2 style={{ margin: 0, color: '#22c55e' }}>🏆 Game Over!</h2>
                <p style={{ fontSize: '24px', margin: '10px 0', color: 'white' }}>
                  Winner: <strong>{currentGame.winner}</strong>
                </p>
                <div style={{ fontSize: '14px', color: '#86efac' }}>
                  {currentGame.players.map(p => (
                    <div key={p.playerId}>
                      {p.playerId}: {p.totalDamageDealt} damage dealt
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleStartGame}
                  style={{ marginTop: '15px', backgroundColor: '#16a34a' }}
                >
                  New Game
                </button>
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              <button
                onClick={handlePlayTurn}
                disabled={currentGame.status === 'COMPLETED'}
                style={{ marginRight: '10px' }}
              >
                Play Turn ({currentGame.currentTurn}/{MAX_TURNS})
              </button>
              <button
                onClick={handleEndGame}
                disabled={currentGame.status === 'COMPLETED'}
                style={{ backgroundColor: '#dc2626' }}
              >
                End Game
              </button>
            </div>
            <div style={{ marginTop: '20px', textAlign: 'left', fontSize: '12px' }}>
              <strong>Ammunition Catalog:</strong>
              {getAmmunitionCatalog().map(ammo => (
                <div key={ammo.ammunitionId}>
                  {ammo.icon} {ammo.ammunitionId}: {ammo.name} (DMG: {ammo.damage}, Cost: {ammo.cost})
                </div>
              ))}
            </div>

            {turnHistory.length > 0 && (
              <div style={{ marginTop: '20px', textAlign: 'left', fontSize: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                <strong>Turn History:</strong>
                {turnHistory.map((turn) => (
                  <div key={turn.turnNumber} style={{ marginTop: '10px', padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
                    <div><strong>Turn {turn.turnNumber}</strong></div>
                    {turn.actions.map((action, idx) => {
                      const ammo = AMMUNITION_MAP[action.ammunitionId];
                      return (
                        <div key={idx} style={{ marginLeft: '10px', marginTop: '5px' }}>
                          {action.playerId} used {ammo?.icon} {ammo?.name || action.ammunitionId}
                        </div>
                      );
                    })}
                    {turn.damages.map((dmg, idx) => (
                      <div key={idx} style={{ marginLeft: '10px', color: '#ef4444' }}>
                        → {dmg.fromPlayer} dealt {dmg.damage} damage to {dmg.toPlayer}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default App
