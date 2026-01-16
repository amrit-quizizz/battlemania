import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useToast } from '../components/Toast';
import joinPageBg from '../assets/joinPageW.svg';
import waygroundLogo from '../assets/waygroundLogo.svg';
import headerLogo from '../assets/logo.svg';
import './JoinGame.css';
import './PlayerGame.css';

const API_URL = import.meta.env.VITE_QUIZ_API_URL || 'http://localhost:3001';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

interface Question {
  questionIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctAnswer: number;
  totalQuestions: number;
  points?: number;
}

interface GameState {
  gameCode: string;
  playerId: string;
  playerName: string;
  team: 'A' | 'B';
  score: number;
  teamAHealth: number;
  teamBHealth: number;
  totalQuestions: number;
}

interface GameResult {
  winner: 'A' | 'B' | 'draw';
  teamAHealth: number;
  teamBHealth: number;
  playerScore: number;
  teamAPlayers: { name: string; score: number }[];
  teamBPlayers: { name: string; score: number }[];
}

type GameStep = 'code' | 'name' | 'waiting' | 'playing' | 'results';

function JoinGame() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Form state
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [step, setStep] = useState<GameStep>('code');
  const [isJoining, setIsJoining] = useState(false);
  const [roomInfo, setRoomInfo] = useState<{ topic: string; subject: string } | null>(null);
  
  // Game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answerResult, setAnswerResult] = useState<'correct' | 'incorrect' | 'not_attempted' | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [showLevelSelection, setShowLevelSelection] = useState(false);
  const [isSelectingLevel, setIsSelectingLevel] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if room exists using HTTP API
  const checkRoom = async (code: string) => {
    if (code.length !== 4) {
      showToast('Please enter a valid 4-character game code', 'error');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/room/${code.toUpperCase()}`);
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
    setStep('waiting');

    // Connect to WebSocket - ONCE, and keep it connected!
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.error('WebSocket connection timeout');
        ws.close();
        showToast('Connection timeout. Make sure the server is running.', 'error');
        setIsJoining(false);
        setStep('name');
      }
    }, 5000);

    ws.onopen = () => {
      clearTimeout(connectionTimeout);
      console.log('WebSocket connected - joining room:', gameCode.toUpperCase());
      
      ws.send(JSON.stringify({
        type: 'player_join',
        roomCode: gameCode.trim().toUpperCase(),
        name: playerName.trim(),
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received:', data);

        switch (data.type) {
          case 'player_joined':
            setGameState({
              gameCode: data.roomCode || gameCode.toUpperCase(),
              playerId: data.playerId,
              playerName: playerName.trim(),
              team: data.team,
              score: 0,
              teamAHealth: data.teamAHealth ?? 100,
              teamBHealth: data.teamBHealth ?? 100,
              totalQuestions: data.quizMeta?.totalQuestions || 30,
            });
            setIsJoining(false);
            showToast('Successfully joined! Waiting for game to start...', 'success');
            // Stay in waiting step
            break;

          case 'room_update':
            console.log('Room update:', data);
            break;

          case 'game_started':
            console.log('Game started!');
            setStep('playing');
            setShowLevelSelection(true);
            setGameState(prev => prev ? {
              ...prev,
              totalQuestions: data.totalQuestions || prev.totalQuestions,
              teamAHealth: data.teamAHealth ?? prev.teamAHealth,
              teamBHealth: data.teamBHealth ?? prev.teamBHealth,
            } : prev);
            break;

          case 'question':
            setCurrentQuestion({
              questionIndex: data.questionIndex,
              difficulty: data.difficulty,
              question: data.question,
              options: data.options,
              correctAnswer: -1,
              totalQuestions: data.totalQuestions,
              points: data.difficulty === 'easy' ? 10 : data.difficulty === 'medium' ? 20 : 30,
            });
            setQuestionNumber(prev => prev + 1);
            setShowLevelSelection(false);
            setShowResult(false);
            setSelectedAnswer(null);
            setIsAnswerSubmitted(false);
            setIsSelectingLevel(false);
            setTimeRemaining(30);
            break;

          case 'answer_result':
            setIsAnswerSubmitted(true);
            setAnswerResult(data.correct ? 'correct' : 'incorrect');
            setCurrentQuestion(prev => prev ? {
              ...prev,
              correctAnswer: data.correctAnswer,
            } : null);
            setShowResult(true);
            setGameState(prev => prev ? {
              ...prev,
              score: data.score,
              teamAHealth: data.teamAHealth ?? prev.teamAHealth,
              teamBHealth: data.teamBHealth ?? prev.teamBHealth,
            } : prev);
            
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            
            setTimeout(() => {
              setShowResult(false);
              setCurrentQuestion(null);
              setShowLevelSelection(true);
            }, 2000);
            break;

          case 'health_update':
            setGameState(prev => prev ? {
              ...prev,
              teamAHealth: data.teamAHealth,
              teamBHealth: data.teamBHealth,
            } : prev);
            break;

          case 'game_finished':
            console.log('Game finished:', data);
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            
            const result: GameResult = {
              winner: data.winner || 'draw',
              teamAHealth: data.teamAHealth ?? 0,
              teamBHealth: data.teamBHealth ?? 0,
              playerScore: gameState?.score || 0,
              teamAPlayers: data.teamA || [],
              teamBPlayers: data.teamB || [],
            };
            setGameResult(result);
            setStep('results');
            break;

          case 'error':
            console.error('Server error:', data.message);
            showToast(data.message, 'error');
            if (data.message === 'Room not found') {
              setStep('code');
              setGameCode('');
              setRoomInfo(null);
            }
            setIsJoining(false);
            break;
        }
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      clearTimeout(connectionTimeout);
      showToast('Connection error - check if server is running', 'error');
      setIsJoining(false);
      setStep('name');
    };

    ws.onclose = (event) => {
      console.log(`WebSocket closed - Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`);
      clearTimeout(connectionTimeout);
    };
  };

  // Timer countdown for questions
  useEffect(() => {
    if (currentQuestion && !isAnswerSubmitted && timeRemaining > 0 && step === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setAnswerResult('not_attempted');
            setShowResult(true);
            setIsAnswerSubmitted(true);
            
            setTimeout(() => {
              setShowResult(false);
              setCurrentQuestion(null);
              setShowLevelSelection(true);
            }, 2000);
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentQuestion, isAnswerSubmitted, step]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
    };
  }, []);

  const handleLevelSelection = (level: 'easy' | 'medium' | 'hard') => {
    if (isSelectingLevel) return;
    
    setIsSelectingLevel(true);
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'select_level',
        difficulty: level,
      }));
    }
  };

  const handleAnswer = (index: number) => {
    if (!currentQuestion || isAnswerSubmitted) return;

    setSelectedAnswer(index);
    setIsAnswerSubmitted(true);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'submit_answer',
        questionIndex: currentQuestion.questionIndex,
        answer: index,
        difficulty: currentQuestion.difficulty,
      }));
    }
  };

  const handlePlayAgain = () => {
    // Reset everything and go back to code entry
    if (wsRef.current) {
      wsRef.current.close(1000, 'Starting new game');
      wsRef.current = null;
    }
    
    setGameCode('');
    setPlayerName('');
    setStep('code');
    setRoomInfo(null);
    setGameState(null);
    setGameResult(null);
    setCurrentQuestion(null);
    setShowLevelSelection(false);
    setQuestionNumber(0);
  };

  // ========== RENDER CODE STEP ==========
  if (step === 'code') {
    return (
      <div className="join-page-wrapper">
        <div className="app-content">
          <div className="background-gradient" style={{ backgroundImage: `url(${joinPageBg})` }}></div>
          
          <div className="fixed-header">
            <header className="landing-header">
              <div className="header-left">
                <img src={headerLogo} alt="Wayground" className="header-logo-img" />
              </div>
              <div className="header-right">
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

          <main className="main-container">
            <div className="logo-container">
              <img src={waygroundLogo} alt="Wayground" className="main-logo-image" />
            </div>

            <div className="join-form-container">
              <div className="join-form-wrapper">
                <input
                  id="gameCode"
                  type="text"
                  value={gameCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    if (value.length <= 4) setGameCode(value);
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
            </div>
          </main>

          <div className="footer-wrapper">
            <footer className="footer">
              <div className="footer-left">
                <a href="#" className="footer-link">Quick links</a>
                <a href="#" className="footer-link">Worksheets</a>
                <a href="#" className="footer-link">Teacher resources</a>
                <a href="#" className="footer-link">Library</a>
              </div>
              <div className="footer-right">
                <a href="#" className="footer-link">Accessibility &amp; Inclusion</a>
                <span className="footer-copyright">© 2026 Quizizz Inc. (DBA Wayground)</span>
              </div>
            </footer>
          </div>
        </div>
      </div>
    );
  }

  // ========== RENDER NAME STEP ==========
  if (step === 'name') {
    return (
      <div className="join-page-wrapper">
        <div className="app-content">
          <div className="background-gradient" style={{ backgroundImage: `url(${joinPageBg})` }}></div>
          
          <div className="fixed-header">
            <header className="landing-header">
              <div className="header-left">
                <img src={headerLogo} alt="Wayground" className="header-logo-img" />
              </div>
              <div className="header-right">
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

          <main className="main-container">
            <div className="logo-container">
              <img src={waygroundLogo} alt="Wayground" className="main-logo-image" />
            </div>

            <div className="join-form-container">
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
                    if (e.target.value.length <= 30) setPlayerName(e.target.value);
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
            </div>
          </main>

          <div className="footer-wrapper">
            <footer className="footer">
              <div className="footer-left">
                <a href="#" className="footer-link">Quick links</a>
                <a href="#" className="footer-link">Worksheets</a>
                <a href="#" className="footer-link">Teacher resources</a>
                <a href="#" className="footer-link">Library</a>
              </div>
              <div className="footer-right">
                <a href="#" className="footer-link">Accessibility &amp; Inclusion</a>
                <span className="footer-copyright">© 2026 Quizizz Inc. (DBA Wayground)</span>
              </div>
            </footer>
          </div>
        </div>
      </div>
    );
  }

  // ========== RENDER WAITING STEP ==========
  if (step === 'waiting') {
    return (
      <div className="join-page-wrapper">
        <div className="app-content">
          <div className="background-gradient" style={{ backgroundImage: `url(${joinPageBg})` }}></div>
          
          <div className="fixed-header">
            <header className="landing-header">
              <div className="header-left">
                <img src={headerLogo} alt="Wayground" className="header-logo-img" />
              </div>
            </header>
          </div>

          <main className="main-container">
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
                <div className="waiting-room-code">Team: {gameState?.team === 'A' ? 'Blue' : 'Red'}</div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ========== RENDER RESULTS STEP ==========
  if (step === 'results' && gameResult) {
    const isWinner = gameResult.winner === gameState?.team;
    const isDraw = gameResult.winner === 'draw';
    
    return (
      <div className="player-game-page">
        <div className="player-game-background"></div>
        <div className="result-overlay" style={{ background: 'rgba(0,0,0,0.9)' }}>
          <div className="result-card" style={{ maxWidth: '500px', padding: '40px' }}>
            <div className="result-icon" style={{ fontSize: '64px' }}>
              {isDraw ? '🤝' : isWinner ? '🏆' : '😢'}
            </div>
            <h2 className="result-title" style={{ 
              color: isDraw ? '#f59e0b' : isWinner ? '#22c55e' : '#ef4444',
              fontSize: '32px',
              marginBottom: '20px'
            }}>
              {isDraw ? "It's a Draw!" : isWinner ? 'Victory!' : 'Defeat'}
            </h2>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-around', 
              marginBottom: '20px',
              gap: '20px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#3b82f6', fontSize: '14px', marginBottom: '5px' }}>Team Blue</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{gameResult.teamAHealth} HP</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#ef4444', fontSize: '14px', marginBottom: '5px' }}>Team Red</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{gameResult.teamBHealth} HP</div>
              </div>
            </div>
            
            <div style={{ 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: '12px', 
              padding: '15px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '14px', color: '#888', marginBottom: '5px' }}>Your Score</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#22c55e' }}>
                {gameState?.score || 0} points
              </div>
            </div>
            
            <button
              onClick={handlePlayAgain}
              style={{ 
                width: '100%',
                padding: '15px 30px', 
                fontSize: '16px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== RENDER PLAYING STEP ==========
  if (step === 'playing') {
    const HealthBar = ({ team, health }: { team: 'A' | 'B'; health: number }) => (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '8px',
      }}>
        <span style={{ 
          fontSize: '12px', 
          color: team === 'A' ? '#3b82f6' : '#ef4444',
          fontWeight: 'bold'
        }}>
          {team === 'A' ? 'BLUE' : 'RED'}
        </span>
        <div style={{
          width: '80px',
          height: '8px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.max(0, health)}%`,
            height: '100%',
            background: team === 'A' ? '#3b82f6' : '#ef4444',
            transition: 'width 0.3s ease',
          }} />
        </div>
        <span style={{ fontSize: '12px', color: '#fff', minWidth: '30px' }}>{health}</span>
      </div>
    );

    return (
      <div className="player-game-page">
        <div className="player-game-background"></div>

        <header className="player-game-header">
          <div className="header-left">
            <img src={headerLogo} alt="Logo" className="header-logo" />
            <div className="header-rank-badge" style={{
              background: gameState?.team === 'A' ? '#3b82f6' : '#ef4444'
            }}>
              <span>Team {gameState?.team === 'A' ? 'Blue' : 'Red'}</span>
            </div>
          </div>
          <div className="header-right">
            <HealthBar team="A" health={gameState?.teamAHealth || 100} />
            <HealthBar team="B" health={gameState?.teamBHealth || 100} />
            <div className="header-score">{gameState?.score || 0}</div>
          </div>
        </header>

        {currentQuestion && (
          <div className={`timer-display ${timeRemaining <= 5 ? 'warning' : ''}`}>
            {timeRemaining}s
          </div>
        )}

        <main className="player-game-content">
          {showLevelSelection && !currentQuestion ? (
            <>
              <section className="question-section">
                <div className="question-badge">Question {questionNumber + 1}</div>
                <div className="question-card">
                  <h2 className="question-text">Choose your difficulty level</h2>
                  <p style={{ color: '#888', marginTop: '10px' }}>
                    Higher difficulty = More damage to enemy team!
                  </p>
                </div>
              </section>

              <section className="answers-section">
                <div className="answers-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <button
                    className={`answer-card ${isSelectingLevel ? 'disabled' : ''}`}
                    onClick={() => handleLevelSelection('easy')}
                    disabled={isSelectingLevel}
                    style={{ background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)' }}
                  >
                    <span className="answer-number">1</span>
                    <span className="answer-text">
                      Easy<br />
                      <small style={{ fontSize: '14px', opacity: 0.8 }}>10 Damage</small>
                    </span>
                  </button>
                  <button
                    className={`answer-card ${isSelectingLevel ? 'disabled' : ''}`}
                    onClick={() => handleLevelSelection('medium')}
                    disabled={isSelectingLevel}
                    style={{ background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)' }}
                  >
                    <span className="answer-number">2</span>
                    <span className="answer-text">
                      Medium<br />
                      <small style={{ fontSize: '14px', opacity: 0.8 }}>20 Damage</small>
                    </span>
                  </button>
                  <button
                    className={`answer-card ${isSelectingLevel ? 'disabled' : ''}`}
                    onClick={() => handleLevelSelection('hard')}
                    disabled={isSelectingLevel}
                    style={{ background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)' }}
                  >
                    <span className="answer-number">3</span>
                    <span className="answer-text">
                      Hard<br />
                      <small style={{ fontSize: '14px', opacity: 0.8 }}>30 Damage</small>
                    </span>
                  </button>
                </div>
                {isSelectingLevel && (
                  <p style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
                    Loading question...
                  </p>
                )}
              </section>
            </>
          ) : currentQuestion ? (
            <>
              <section className="question-section">
                <div className="question-badge" style={{
                  background: currentQuestion.difficulty === 'easy' ? '#22c55e' : 
                             currentQuestion.difficulty === 'medium' ? '#f59e0b' : '#ef4444'
                }}>
                  {currentQuestion.difficulty.toUpperCase()} - {currentQuestion.points} pts
                </div>
                <div className="question-card">
                  <button className="question-speaker-btn">
                    <Icon icon="mdi:volume-high" width={20} />
                  </button>
                  <h2 className="question-text">{currentQuestion.question}</h2>
                </div>
              </section>

              <section className="answers-section">
                <div className="answers-grid">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === currentQuestion.correctAnswer;
                    const showCorrectStyle = showResult && isCorrect;
                    const showIncorrectStyle = showResult && isSelected && !isCorrect;

                    return (
                      <button
                        key={index}
                        className={`answer-card ${isSelected ? 'selected' : ''} ${showCorrectStyle ? 'correct' : ''} ${showIncorrectStyle ? 'incorrect' : ''} ${isAnswerSubmitted ? 'disabled' : ''}`}
                        onClick={() => handleAnswer(index)}
                        disabled={isAnswerSubmitted}
                      >
                        <span className="answer-number">{index + 1}</span>
                        <span className="answer-text">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          ) : (
            <div className="waiting-screen">
              <div className="waiting-icon">⏳</div>
              <h2 className="waiting-title">Loading...</h2>
            </div>
          )}
        </main>

        <footer className="player-game-footer">
          <div className="footer-player-info">
            <div className="player-avatar">👤</div>
            <span className="player-name">{playerName}</span>
          </div>
          <div className="footer-center">
            <div style={{ fontSize: '14px', color: '#888' }}>
              Room: {gameCode}
            </div>
          </div>
          <div className="footer-right">
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              Score: {gameState?.score || 0}
            </div>
          </div>
        </footer>

        {showResult && answerResult && (
          <div className="result-overlay">
            <div className="result-card">
              {answerResult === 'correct' && (
                <>
                  <div className="result-icon">✅</div>
                  <h2 className="result-title correct">Correct!</h2>
                  <p className="result-message">
                    +{currentQuestion?.points || 0} points! Firing at enemy team!
                  </p>
                </>
              )}
              {answerResult === 'incorrect' && (
                <>
                  <div className="result-icon">❌</div>
                  <h2 className="result-title incorrect">Incorrect</h2>
                  <p className="result-message">
                    The correct answer was: {currentQuestion?.options[currentQuestion?.correctAnswer || 0]}
                  </p>
                </>
              )}
              {answerResult === 'not_attempted' && (
                <>
                  <div className="result-icon">⏰</div>
                  <h2 className="result-title timeout">Time's Up!</h2>
                  <p className="result-message">No answer submitted in time.</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default JoinGame;
