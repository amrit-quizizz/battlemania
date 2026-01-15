import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useToast } from '../components/Toast';
import joinPageBg from '../assets/joinPageW.svg';
import waygroundLogo from '../assets/waygroundLogo.svg';
import './JoinGame.css';

// Use the same backend for API and WebSocket
const API_URL = import.meta.env.VITE_QUIZ_API_URL || 'http://localhost:3001';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

function JoinGame() {
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [step, setStep] = useState<'code' | 'name' | 'waiting'>('code');
  const [isJoining, setIsJoining] = useState(false);
  const [roomInfo, setRoomInfo] = useState<{ topic: string; subject: string } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Check if room exists when code is complete
  const checkRoom = async (code: string) => {
    try {
      const response = await fetch(`${API_URL}/api/room/${code}`);
      if (response.ok) {
        const data = await response.json();
        setRoomInfo({ topic: data.quizMeta.topic, subject: data.quizMeta.subject });
        setStep('name');
      } else {
        showToast('Room not found. Please check the code.', 'error');
      }
    } catch {
      showToast('Could not verify room. Please try again.', 'error');
    }
  };

  const handleJoin = () => {
    if (!playerName.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }

    if (playerName.trim().length < 2) {
      showToast('Name must be at least 2 characters', 'error');
      return;
    }

    setIsJoining(true);

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Connect to WebSocket server
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      // Send join request with new message type
      ws.send(JSON.stringify({
        type: 'player_join',
        roomCode: gameCode.trim().toUpperCase(),
        name: playerName.trim()
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);

        switch (data.type) {
          case 'player_joined':
            // Successfully joined - wait for game to start
            setStep('waiting');
            setIsJoining(false);
            showToast('Successfully joined! Waiting for game to start...', 'success');
            break;

          case 'room_update':
            // Room updated (player joined/left)
            console.log('Room update:', data);
            break;

          case 'game_started':
            // Game has started - redirect to player game screen
            console.log('Game started, redirecting...');
            if (wsRef.current) {
              wsRef.current.close();
              wsRef.current = null;
            }
            navigate('/quiz/player-game', {
              state: {
                gameCode: gameCode.trim().toUpperCase(),
                playerName: playerName.trim(),
                team: data.team || 'A'
              }
            });
            break;

          case 'question':
            // Question received - if we're still here, navigate
            console.log('Question received, redirecting...');
            if (wsRef.current) {
              wsRef.current.close();
              wsRef.current = null;
            }
            navigate('/quiz/player-game', {
              state: {
                gameCode: gameCode.trim().toUpperCase(),
                playerName: playerName.trim(),
                team: 'A'
              }
            });
            break;

          case 'error':
            showToast(data.message || 'An error occurred', 'error');
            setIsJoining(false);
            if (wsRef.current) {
              wsRef.current.close();
              wsRef.current = null;
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing message:', error);
        showToast('Error processing server response', 'error');
        setIsJoining(false);
      }
    };

    ws.onerror = () => {
      showToast('Connection error. Please try again.', 'error');
      setIsJoining(false);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected', event.code);
      if (event.code !== 1000 && event.code !== 1001 && step !== 'waiting') {
        setIsJoining(false);
      }
    };
  };

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return (
    <div className="join-page-wrapper">
      <div className="app-content">
        {/* Background with SVG */}
        <div 
          className="background-gradient"
          style={{ backgroundImage: `url(${joinPageBg})` }}
        >
        </div>

        {/* Fixed Header - Matching reference structure */}
        <div className="fixed-header">
          <header className="landing-header">
            <div className="header-left">
              {/* Wayground Logo - Exact from reference */}
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 13.1255C8 13.0423 8.06439 12.9689 8.14845 12.9591L15.6831 12.0667C15.744 12.0595 15.8004 12.0947 15.8206 12.1524L23.8973 34.8689C23.9324 34.9678 23.8587 35.0701 23.7545 35.0701H16.1759C16.0919 35.0701 16.0275 34.9968 16.0373 34.9136L8 13.1255Z" fill="white"/>
                <path d="M28.6904 13H39.8602C39.9526 13 40.0198 13.0888 39.9946 13.1791L33.9686 34.8957C33.9518 34.9563 33.8972 34.9986 33.8342 34.9986H26.2556C26.1716 34.9986 26.1072 34.9253 26.117 34.8421L28.5517 13.1255C28.5615 13.0423 28.6259 12.9689 28.6904 13Z" fill="white"/>
                <path d="M16.5 13L24 35L31.5 13" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="header-right">
              {/* Avatar from Wayground - exact from reference */}
              <button className="avatar-button">
                <div className="avatar-wrapper">
                  <div className="avatar-inner">
                    <div className="avatar-relative">
                      <img 
                        src="https://wayground.com/_media/avatar-assets/accessory/o_scarf.svg" 
                        alt="body-accessory" 
                        className="avatar-accessory"
                        style={{ height: '80px', width: '48.3092px' }}
                      />
                    </div>
                  </div>
                </div>
              </button>
              <button className="header-nav-button">
                <Icon icon="mdi:storefront" className="button-icon" />
                <span className="button-text">Go to shop</span>
              </button>
              <button className="header-nav-button">
                <Icon icon="mdi:view-grid" className="button-icon" />
                <span className="button-text">My dashboard</span>
              </button>
            </div>
          </header>
        </div>

        {/* Main container */}
        <main className="main-container">
          {/* Main Logo - Wayground branding */}
          <div className="logo-container">
            <img 
              src={waygroundLogo} 
              alt="Wayground - formerly Quizizz" 
              className="main-logo-image"
            />
          </div>

          {/* Join Form */}
          <div className="join-form-container">
            {step === 'code' && (
              <div className="join-form-wrapper">
                <input
                  id="gameCode"
                  type="text"
                  value={gameCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    if (value.length <= 4) {
                      setGameCode(value);
                    }
                  }}
                  placeholder="Enter a join code"
                  maxLength={4}
                  className="join-input"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && gameCode.trim().length === 4) {
                      checkRoom(gameCode.trim());
                    }
                  }}
                />
                <button
                  className="join-button-inline"
                  onClick={() => checkRoom(gameCode.trim())}
                  disabled={gameCode.trim().length !== 4}
                >
                  Join
                </button>
              </div>
            )}

            {step === 'name' && (
              <>
                <div className="room-info">
                  <span className="room-code-badge">{gameCode}</span>
                  {roomInfo && (
                    <span className="room-topic">{roomInfo.subject} - {roomInfo.topic}</span>
                  )}
                </div>
                <div className="join-form-wrapper">
                  <input
                    id="playerName"
                    type="text"
                    value={playerName}
                    onChange={(e) => {
                      if (e.target.value.length <= 30) {
                        setPlayerName(e.target.value);
                      }
                    }}
                    placeholder="Enter your name"
                    disabled={isJoining}
                    className="join-input"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && playerName.trim().length >= 2 && !isJoining) {
                        handleJoin();
                      }
                    }}
                  />
                  <button
                    className="join-button-inline"
                    onClick={handleJoin}
                    disabled={isJoining || playerName.trim().length < 2}
                  >
                    {isJoining ? (
                      <>
                        <span className="spinner-small"></span>
                        Joining...
                      </>
                    ) : (
                      'Join'
                    )}
                  </button>
                </div>
                <button
                  className="back-link"
                  onClick={() => {
                    setStep('code');
                    setGameCode('');
                    setRoomInfo(null);
                  }}
                >
                  ← Change code
                </button>
              </>
            )}

            {step === 'waiting' && (
              <div className="waiting-container">
                <div className="waiting-icon">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="32" cy="32" r="28" stroke="white" strokeWidth="4" strokeDasharray="8 8" className="rotating-circle"/>
                    <circle cx="32" cy="32" r="20" fill="rgba(255,255,255,0.1)"/>
                    <path d="M32 20V32L40 40" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="waiting-text">
                  <div className="waiting-title">You're in!</div>
                  <div className="waiting-subtitle">Waiting for the teacher to start the game...</div>
                </div>
                <div className="waiting-info">
                  <div className="waiting-player-name">{playerName}</div>
                  <div className="waiting-room-code">Room: {gameCode}</div>
                </div>
              </div>
            )}
          </div>

          {/* Mascot - positioned on the right */}
          <div className="mascot-container">
            <div className="mascot">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="36" fill="#FFA500"/>
                <circle cx="30" cy="35" r="6" fill="white"/>
                <circle cx="50" cy="35" r="6" fill="white"/>
                <circle cx="32" cy="36" r="3" fill="#333"/>
                <circle cx="52" cy="36" r="3" fill="#333"/>
                <path d="M28 50 Q40 60 52 50" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/>
                <ellipse cx="22" cy="45" rx="4" ry="3" fill="#FF8C00"/>
                <ellipse cx="58" cy="45" rx="4" ry="3" fill="#FF8C00"/>
              </svg>
            </div>
          </div>

          {/* Footer Wrapper - Matching reference structure */}
          <div className="footer-wrapper">
            <footer className="footer" data-testid="footer">
              <a href="#" className="footer-link">Quick links</a>
              <a href="#" className="footer-link">Worksheets</a>
              <a href="#" className="footer-link">Teacher resources</a>
              <a href="#" className="footer-link">Library</a>
              <a href="#" className="footer-link">Accessibility &amp; Inclusion</a>
              <span className="footer-copyright">© 2026 Quizizz Inc. (DBA Wayground)</span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

export default JoinGame;
