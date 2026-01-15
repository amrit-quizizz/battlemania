import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './StartGame.css';

interface Player {
  id: string;
  name: string;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002';

function StartGame() {
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [teamA, setTeamA] = useState<Player[]>([]);
  const [teamB, setTeamB] = useState<Player[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const handleStartGame = () => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setError(null);
    setIsConnecting(true);

    try {
      // Connect to WebSocket server with timeout
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          setError('Connection timeout. Make sure the WebSocket server is running on port 3002.');
          setIsConnecting(false);
        }
      }, 5000); // 5 second timeout

      ws.onopen = () => {
        console.log('WebSocket connected');
        clearTimeout(connectionTimeout);
        setIsConnecting(false);
        // Request to create a new game
        try {
          ws.send(JSON.stringify({
            type: 'create_game'
          }));
        } catch (error) {
          console.error('Error sending message:', error);
          setError('Failed to send message to server');
          setIsConnecting(false);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);

          switch (data.type) {
            case 'game_created':
              setGameCode(data.gameCode);
              setTeamA([]);
              setTeamB([]);
              setError(null);
              break;

            case 'game_state':
              setTeamA(data.teamA || []);
              setTeamB(data.teamB || []);
              break;

            case 'error':
              console.error('WebSocket error:', data.message);
              setError(data.message);
              setIsConnecting(false);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          setError('Error processing server response');
          setIsConnecting(false);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        clearTimeout(connectionTimeout);
        setError('Failed to connect to server. Make sure the WebSocket server is running on port 3002.');
        setIsConnecting(false);
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        clearTimeout(connectionTimeout);
        setIsConnecting(false);
        // Only show error if it was an unexpected close (not a clean close)
        if (event.code !== 1000 && !gameCode && event.code !== 1006) {
          // 1006 is abnormal closure, which happens when server isn't running
          if (event.code === 1006) {
            setError('Cannot connect to server. Please start the WebSocket server with: npm run dev:server');
          } else {
            setError('Connection closed. Please try again.');
          }
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setError('Failed to create connection. Please check your browser console.');
      setIsConnecting(false);
    }
  };

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const canStartGame = teamA.length === 1 && teamB.length === 1;

  const handleBeginGame = () => {
    if (canStartGame && gameCode) {
      // Send start game message to server
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'start_game',
          gameCode
        }));
      }
      // Navigate to quiz game screen
      navigate('/quiz/game', { state: { gameCode } });
    }
  };

  return (
    <div className="start-game-container">
      <div className="start-game-card">
        {!gameCode ? (
          <>
            <h1 className="start-game-title">Quiz Game</h1>
            <p className="start-game-subtitle">Start a new game session</p>
            {error && (
              <div className="error-message" style={{ 
                marginBottom: '1rem', 
                padding: '0.75rem 1rem',
                background: 'rgba(255, 68, 68, 0.2)',
                border: '1px solid rgba(255, 68, 68, 0.5)',
                borderRadius: '8px',
                color: '#ff6b6b',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}
            <button 
              className="start-game-button" 
              onClick={handleStartGame}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Start Game'}
            </button>
            <a href="/quiz/join" className="join-link">
              Or join an existing game
            </a>
          </>
        ) : (
          <div className="game-lobby">
            <div className="game-header">
              <h1 className="start-game-title">Game Lobby</h1>
              <p className="start-game-subtitle">Share this code with players to join</p>
              <div className="game-code-container">
                <div className="game-code">{gameCode}</div>
              </div>
            </div>

            <div className="teams-container">
              <div className="team-section team-a">
                <h2 className="team-title">Team A</h2>
                <div className="player-list">
                  {teamA.length === 0 ? (
                    <div className="empty-team">Waiting for players...</div>
                  ) : (
                    teamA.map((player) => (
                      <div key={player.id} className="player-item">
                        <span className="player-name">{player.name}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="team-count">{teamA.length} player{teamA.length !== 1 ? 's' : ''}</div>
              </div>

              <div className="team-divider"></div>

              <div className="team-section team-b">
                <h2 className="team-title">Team B</h2>
                <div className="player-list">
                  {teamB.length === 0 ? (
                    <div className="empty-team">Waiting for players...</div>
                  ) : (
                    teamB.map((player) => (
                      <div key={player.id} className="player-item">
                        <span className="player-name">{player.name}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="team-count">{teamB.length} player{teamB.length !== 1 ? 's' : ''}</div>
              </div>
            </div>

            <div className="game-actions">
              <button
                className={`start-game-button begin-game ${canStartGame ? 'active' : 'disabled'}`}
                onClick={handleBeginGame}
                disabled={!canStartGame}
              >
                Start Game
              </button>
              {!canStartGame && (
                <p className="start-game-hint">
                  Waiting for 2 players (1 in each team)...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StartGame;
