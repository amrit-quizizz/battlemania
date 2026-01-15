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
  const wsRef = useRef<WebSocket | null>(null);

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
            setGameState({
              gameCode: data.gameCode,
              teamA: data.teamA || [],
              teamB: data.teamB || [],
              scoreA: data.scoreA || 0,
              scoreB: data.scoreB || 0,
            });
            break;

          case 'score_update':
            setGameState(prev => prev ? {
              ...prev,
              scoreA: data.scoreA || prev.scoreA,
              scoreB: data.scoreB || prev.scoreB,
            } : null);
            break;

          case 'game_ended':
            alert('Game has been ended');
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
      navigate('/quiz/init');
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
      </div>
    </div>
  );
}

export default QuizGame;
