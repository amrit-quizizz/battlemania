import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './JoinGame.css';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002';

function JoinGame() {
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinedGameCode, setJoinedGameCode] = useState<string | null>(null);
  const [playerTeam, setPlayerTeam] = useState<'A' | 'B' | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!gameCode.trim()) {
      setError('Please enter a game code');
      return;
    }

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsJoining(true);
    setError('');

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Connect to WebSocket server
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      // Send join request
      ws.send(JSON.stringify({
        type: 'join',
        gameCode: gameCode.trim().toUpperCase(),
        playerName: playerName.trim()
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);

        switch (data.type) {
          case 'join_success':
            // Successfully joined - store connection and wait for game to start
            setJoinedGameCode(data.gameCode);
            setPlayerTeam(data.team);
            setIsJoining(false);
            console.log(`Successfully joined game ${data.gameCode}! You are in Team ${data.team}`);
            // Keep connection open to receive game state updates
            break;

          case 'game_state':
            // Game state update
            console.log('Game state:', data);
            // If game is active, redirect to player game screen
            if (data.isActive) {
              const currentGameCode = data.gameCode || joinedGameCode || gameCode.trim().toUpperCase();
              // Determine team from player name in team lists
              const isInTeamA = data.teamA?.some((p: any) => p.name === playerName.trim());
              const isInTeamB = data.teamB?.some((p: any) => p.name === playerName.trim());
              const currentTeam = playerTeam || (isInTeamA ? 'A' : isInTeamB ? 'B' : null);
              
              if (!currentTeam) {
                console.error('Could not determine team for player', playerName);
                break;
              }
              
              console.log('Game is active, redirecting player...', { currentGameCode, currentTeam });
              
              // Close WebSocket before navigating
              if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
              }
              
              // Small delay to ensure WebSocket closes cleanly
              setTimeout(() => {
                navigate('/quiz/player-game', {
                  state: {
                    gameCode: currentGameCode,
                    playerName: playerName.trim(),
                    team: currentTeam
                  }
                });
              }, 100);
            }
            break;

          case 'game_started':
            // Game has started - redirect to player game screen
            console.log('Game started event received, redirecting player...', data);
            
            // Use data from message, fallback to state if needed
            const gameCodeForRedirect = data.gameCode || joinedGameCode || gameCode.trim().toUpperCase();
            const teamForRedirect = data.team || playerTeam;
            
            if (!gameCodeForRedirect || !teamForRedirect) {
              console.error('Missing game code or team for redirect', { gameCodeForRedirect, teamForRedirect, data });
              setError('Missing game information. Please try joining again.');
              break;
            }
            
            console.log('Navigating to player game with:', {
              gameCode: gameCodeForRedirect,
              playerName: playerName.trim(),
              team: teamForRedirect
            });
            
            // Close WebSocket before navigating
            if (wsRef.current) {
              wsRef.current.close();
              wsRef.current = null;
            }
            
            // Small delay to ensure WebSocket closes cleanly
            setTimeout(() => {
              navigate('/quiz/player-game', {
                state: {
                  gameCode: gameCodeForRedirect,
                  playerName: playerName.trim(),
                  team: teamForRedirect
                }
              });
            }, 100);
            break;

          case 'error':
            setError(data.message);
            setIsJoining(false);
            if (wsRef.current) {
              wsRef.current.close();
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        setError('Error processing server response');
        setIsJoining(false);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error. Please try again.');
      setIsJoining(false);
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected', event.code);
      // Only reset joining state if it wasn't a clean close (like navigation)
      if (event.code !== 1000) {
        setIsJoining(false);
      }
    };
  };

  // Keep WebSocket connection open to listen for game_started event
  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      // Don't close immediately - keep connection for game_started event
      // Connection will be closed when navigating away
    };
  }, []);

  return (
    <div className="join-game-container">
      <div className="join-game-card">
        <h1 className="join-game-title">Join Game</h1>
        <p className="join-game-subtitle">Enter the game code and your name</p>

        <div className="join-form">
          <div className="form-group">
            <label htmlFor="gameCode">Game Code</label>
            <input
              id="gameCode"
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              maxLength={6}
              disabled={isJoining}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="playerName">Your Name</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              disabled={isJoining}
              className="form-input"
            />
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {joinedGameCode && !error && (
            <div className="success-message" style={{
              padding: '1rem',
              background: 'rgba(68, 255, 68, 0.2)',
              border: '1px solid rgba(68, 255, 68, 0.5)',
              borderRadius: '8px',
              color: '#44ff44',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              Successfully joined! Waiting for game to start...
            </div>
          )}

          <button
            className="join-button"
            onClick={handleJoin}
            disabled={isJoining || !gameCode.trim() || !playerName.trim() || !!joinedGameCode}
          >
            {isJoining ? 'Joining...' : joinedGameCode ? 'Joined!' : 'Join Game'}
          </button>

          <button
            className="back-button"
            onClick={() => navigate('/quiz/init')}
            disabled={isJoining}
          >
            Back to Start
          </button>
        </div>
      </div>
    </div>
  );
}

export default JoinGame;
