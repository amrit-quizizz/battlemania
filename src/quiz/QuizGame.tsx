import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './QuizGame.css';

interface Player {
  id: string;
  name: string;
}

interface GameState {
  gameCode: string;
  teamA: Player[];
  teamB: Player[];
  scoreA: number;
  scoreB: number;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002';

function QuizGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const popupTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get game code from location state or try to reconnect
  const gameCode = location.state?.gameCode;

  useEffect(() => {
    if (!gameCode) {
      setError('No game code provided');
      return;
    }

    // Connect to WebSocket server
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected for quiz game');
      // Request game state
      ws.send(JSON.stringify({
        type: 'get_game_state',
        gameCode
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);

        switch (data.type) {
          case 'game_state':
            // Check if this is a popup state
            if (data.state === 'SHOWING_POPUP') {
              console.log('Admin received SHOWING_POPUP', data);
              setShowPopup(true);

              // Clear any existing popup timer
              if (popupTimerRef.current) {
                clearTimeout(popupTimerRef.current);
              }

              // Check if this is a game over popup
              const isGameOver = data.isGameOver || false;

              // Auto-continue after 5 seconds
              popupTimerRef.current = setTimeout(() => {
                console.log('Admin popup timer expired');
                setShowPopup(false);

                if (isGameOver) {
                  // Send continue signal
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                      type: 'popup_continue',
                      gameCode: gameCode
                    }));
                  }
                } else {
                  // Normal turn end, send continue signal
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                      type: 'popup_continue',
                      gameCode: gameCode
                    }));
                  }
                }
              }, 5000);

              // Update scores if provided
              if (data.scoreA !== undefined || data.scoreB !== undefined) {
                setGameState(prev => prev ? {
                  ...prev,
                  scoreA: data.scoreA !== undefined ? data.scoreA : prev.scoreA,
                  scoreB: data.scoreB !== undefined ? data.scoreB : prev.scoreB,
                } : null);
              }
            } else {
              // Normal game state update
              setGameState({
                gameCode: data.gameCode,
                teamA: data.teamA || [],
                teamB: data.teamB || [],
                scoreA: data.scoreA || 0,
                scoreB: data.scoreB || 0,
              });
            }
            break;

          case 'score_update':
            setGameState(prev => prev ? {
              ...prev,
              scoreA: data.scoreA || prev.scoreA,
              scoreB: data.scoreB || prev.scoreB,
            } : null);
            break;

          case 'game_ended':
            console.log('Game ended, navigating to start');
            navigate('/quiz/init');
            break;

          case 'error':
            setError(data.message);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }
    };
  }, [gameCode, navigate]);

  const handleEndGame = () => {
    if (window.confirm('Are you sure you want to end the game?')) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'end_game',
          gameCode
        }));
      }
      // Don't navigate immediately - wait for server to send game_ended message
      // The game_ended handler will navigate to /quiz/init
    }
  };

  if (error && !gameState) {
    return (
      <div className="quiz-game-container">
        <div className="quiz-game-card">
          <div className="error-message">{error}</div>
          <button onClick={() => navigate('/quiz/init')} className="back-button">
            Back to Start
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="quiz-game-container">
        <div className="quiz-game-card">
          <div className="loading">Loading game...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-game-container">
      <div className="quiz-game-card">
        <div className="quiz-header">
          <h1 className="quiz-title">Quiz Game</h1>
          <div className="game-code-display">Game Code: {gameState.gameCode}</div>
        </div>

        <div className="scores-container">
          <div className="score-panel team-a-score">
            <h2 className="score-team-title">Team A</h2>
            <div className="score-value">{gameState.scoreA}</div>
            <div className="score-players">
              {gameState.teamA.map(player => (
                <div key={player.id} className="score-player">{player.name}</div>
              ))}
            </div>
          </div>

          <div className="score-divider">VS</div>

          <div className="score-panel team-b-score">
            <h2 className="score-team-title">Team B</h2>
            <div className="score-value">{gameState.scoreB}</div>
            <div className="score-players">
              {gameState.teamB.map(player => (
                <div key={player.id} className="score-player">{player.name}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="quiz-content">
          <div className="quiz-placeholder">
            <p>Quiz questions will appear here</p>
            <p className="quiz-subtitle">Game is ready to begin!</p>
          </div>
        </div>

        <div className="quiz-actions">
          <button onClick={handleEndGame} className="end-game-button">
            End Game
          </button>
        </div>

        {/* Popup Panel - Shows during transitions */}
        {showPopup && (
          <div className="result-popup-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-in-out'
          }}>
            <div className="result-popup" style={{
              minHeight: '400px',
              minWidth: '600px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #1a2332 0%, #2d3e50 100%)',
              borderRadius: '24px',
              padding: '3rem',
              border: '3px solid #ffd700',
              boxShadow: '0 0 50px rgba(255, 215, 0, 0.5)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Battlefield background effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px)',
                pointerEvents: 'none'
              }}></div>

              <div className="result-content" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <h2 style={{
                  fontSize: '2.5rem',
                  marginBottom: '1rem',
                  color: '#ffd700',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                  animation: 'pulse 1s ease-in-out infinite'
                }}>
                  ⚔️ BATTLE INTERMISSION ⚔️
                </h2>

                {/* Tank Battle Animation */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  margin: '3rem 0',
                  position: 'relative',
                  height: '100px'
                }}>
                  {/* Blue Team Tank */}
                  <div style={{
                    fontSize: '4rem',
                    animation: 'tankMove 2s ease-in-out infinite',
                    filter: 'drop-shadow(0 0 10px rgba(0, 212, 255, 0.8))'
                  }}>
                    🛡️
                  </div>

                  {/* Explosion in middle */}
                  <div style={{
                    fontSize: '3rem',
                    animation: 'explosion 1s ease-in-out infinite',
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}>
                    💥
                  </div>

                  {/* Red Team Tank */}
                  <div style={{
                    fontSize: '4rem',
                    animation: 'tankMove 2s ease-in-out infinite',
                    animationDirection: 'reverse',
                    filter: 'drop-shadow(0 0 10px rgba(255, 68, 68, 0.8))'
                  }}>
                    ⚡
                  </div>
                </div>

                <p style={{
                  fontSize: '1.3rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 600,
                  marginBottom: '1rem'
                }}>
                  Preparing next round...
                </p>

                {/* Loading bar */}
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginTop: '2rem'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #00d4ff 0%, #ff4444 100%)',
                    animation: 'pulse 1s ease-in-out infinite'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizGame;
