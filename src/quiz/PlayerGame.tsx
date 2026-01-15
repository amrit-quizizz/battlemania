import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import questionsData from './questions.json';
import './PlayerGame.css';

interface Question {
  id: number;
  level: 'low' | 'medium' | 'hard';
  points: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface GameState {
  gameCode: string;
  team: 'A' | 'B';
  scoreA: number;
  scoreB: number;
  currentQuestion?: Question;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002';

function PlayerGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLevelSelection, setShowLevelSelection] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<'low' | 'medium' | 'hard' | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(5); // Single timer for the turn
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answerResult, setAnswerResult] = useState<'correct' | 'incorrect' | 'not_attempted' | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Get game code and player info from location state
  const { gameCode, playerName, team } = location.state || {};
  
  // Debug logging
  console.log('PlayerGame Component Render:', {
    locationState: location.state,
    gameCode,
    playerName,
    team,
    gameState,
    showLevelSelection,
    currentQuestion,
    error
  });

  // Initialize game state immediately from location state if available
  useEffect(() => {
    console.log('Initialization useEffect:', { gameCode, playerName, team });
    if (gameCode && playerName) {
      const initialState = {
        gameCode: gameCode,
        team: team || 'A',
        scoreA: 0,
        scoreB: 0,
        isActive: true, // Assume game is active when redirected here
      };
      console.log('Setting initial gameState:', initialState);
      setGameState(prev => {
        if (prev) {
          console.log('GameState already exists, keeping:', prev);
          return prev;
        }
        console.log('Setting new gameState:', initialState);
        return initialState;
      });
      // Show level selection immediately as fallback (server will override if connected)
      setShowLevelSelection(true);
      setTimeRemaining(5);
    } else {
      console.warn('Missing required data for initialization:', { gameCode, playerName });
    }
  }, [gameCode, playerName, team]);

  useEffect(() => {
    console.log('WebSocket useEffect triggered:', { gameCode, playerName });
    if (!gameCode || !playerName) {
      console.error('Missing game information:', { gameCode, playerName });
      setError('Missing game information');
      return;
    }

    console.log('Connecting to WebSocket:', WS_URL);
    // Connect to WebSocket server
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected for player game');
      // Request game state
      const request = {
        type: 'get_game_state',
        gameCode
      };
      console.log('Sending get_game_state request:', request);
      ws.send(JSON.stringify(request));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);

        switch (data.type) {
          case 'game_state':
            // Backend-controlled game state
            console.log('=== GAME STATE UPDATE ===', data);
            
            // Update scores
            setGameState(prev => ({
              ...prev,
              gameCode: data.gameCode || gameCode || prev?.gameCode,
              team: team || data.team || prev?.team || 'A',
              scoreA: data.scoreA !== undefined ? data.scoreA : (prev?.scoreA || 0),
              scoreB: data.scoreB !== undefined ? data.scoreB : (prev?.scoreB || 0),
            }));
            
            // Handle different game states
            if (data.state === 'level_selection') {
              // Backend says: show level selection screen
              console.log('State: level_selection, timer:', data.timer);
              setShowLevelSelection(true);
              setTimeRemaining(data.timer || 5);
              setSelectedLevel(null);
              setCurrentQuestion(null);
              setShowResult(false);
              setAnswerResult(null);
              setSelectedAnswer(null);
              setIsAnswerSubmitted(false);
              setError(null);
            } else if (data.state === 'result') {
              // Backend says: show result popup
              console.log('State: result', data);
              setShowLevelSelection(false);
              setShowResult(true);
              setIsAnswerSubmitted(true);
              setAnswerResult(data.result || 'not_attempted');
              // Update scores from backend
              if (data.scoreA !== undefined) {
                setGameState(prev => prev ? { ...prev, scoreA: data.scoreA } : prev);
              }
              if (data.scoreB !== undefined) {
                setGameState(prev => prev ? { ...prev, scoreB: data.scoreB } : prev);
              }
            }
            break;

          case 'game_started':
            // Game has started, update state
            console.log('Game started message received');
            setGameState(prev => prev ? {
              ...prev,
              scoreA: data.scoreA || prev.scoreA,
              scoreB: data.scoreB || prev.scoreB,
              isActive: true,
            } : {
              gameCode: data.gameCode || gameCode,
              team: team || data.team || 'A',
              scoreA: data.scoreA || 0,
              scoreB: data.scoreB || 0,
              isActive: true,
            });
            // Backend will send game_state: level_selection next
            break;

          case 'turn_timer':
            // Backend sends synchronized timer update
            console.log('Timer update:', data.timeRemaining);
            if (typeof data.timeRemaining === 'number' && data.timeRemaining >= 0) {
              setTimeRemaining(data.timeRemaining);
            }
            break;

          case 'question_received':
            // Server sends question after level selection
            console.log('Question received from server:', data.question, 'timer:', data.timer);
            // Keep level selection visible, just show question
            setCurrentQuestion(data.question);
            // Use the synchronized timer from server (don't reset it)
            // Only update if timer value is provided and valid
            if (data.timer !== undefined && data.timer !== null && data.timer >= 0) {
              setTimeRemaining(data.timer);
            }
            setSelectedAnswer(null);
            // Don't set isAnswerSubmitted - timer is still running
            setError(null); // Clear any errors
            break;

          case 'score_update':
            setGameState(prev => prev ? {
              ...prev,
              scoreA: data.scoreA || prev.scoreA,
              scoreB: data.scoreB || prev.scoreB,
            } : null);
            break;

          case 'question':
            setGameState(prev => prev ? {
              ...prev,
              currentQuestion: data.question,
            } : null);
            break;

          case 'game_ended':
            alert(`Game ended! Final Score - Team A: ${data.finalScoreA}, Team B: ${data.finalScoreB}`);
            navigate('/quiz/join');
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
  }, [gameCode, playerName, team, navigate]);

  // Debug: Log timer changes
  useEffect(() => {
    console.log('Timer value changed:', timeRemaining, 'showLevelSelection:', showLevelSelection, 'currentQuestion:', currentQuestion);
  }, [timeRemaining, showLevelSelection, currentQuestion]);

  // No client-side timers needed - server controls everything

  // Handler functions - defined before conditional returns
  const handleLevelSelection = (level: 'low' | 'medium' | 'hard') => {
    if (isAnswerSubmitted || timeRemaining <= 0) return; // Already submitted or timer ended
    
    console.log('Level selected:', level);
    setSelectedLevel(level);
    
    // Send level selection to server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'select_level',
        gameCode: gameState?.gameCode,
        level: level,
        team: gameState?.team,
      };
      console.log('Sending select_level to server:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected, cannot send level selection');
    }
  };

  const handleAnswer = (selectedIndex: number) => {
    if (!currentQuestion || isAnswerSubmitted) return;
    
    setSelectedAnswer(selectedIndex);
    setIsAnswerSubmitted(true);
    
    // Check answer and send to server immediately
    checkAnswer(selectedIndex);
    setShowResult(true);
  };

  const checkAnswer = (selectedIndex: number) => {
    if (!currentQuestion) return;
    
    const isCorrect = selectedIndex === currentQuestion.correctAnswer;
    setAnswerResult(isCorrect ? 'correct' : 'incorrect');
    
    // Send answer to server
    sendAnswerToServer(selectedIndex);
  };

  const sendAnswerToServer = (answerIndex: number | null, questionId?: number, levelSelectionTimeout?: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    if (levelSelectionTimeout) {
      // Level selection timeout - no question was selected
      wsRef.current.send(JSON.stringify({
        type: 'level_selection_timeout',
        gameCode: gameState?.gameCode,
        team: gameState?.team,
      }));
      return;
    }

    if (!currentQuestion) return;

    const isCorrect = answerIndex !== null && answerIndex === currentQuestion.correctAnswer;
    
    wsRef.current.send(JSON.stringify({
      type: 'submit_answer',
      gameCode: gameState?.gameCode,
      questionId: questionId || currentQuestion.id,
      answerIndex: answerIndex,
      isCorrect: isCorrect,
      points: currentQuestion.points,
      team: gameState?.team,
    }));
  };

  // No client-side timers or auto-advance - backend controls everything via game_state messages
  // Backend will send game_state: level_selection after 3 seconds when result is shown

  console.log('Render check:', { error, gameState, showLevelSelection, currentQuestion });
  
  if (error && !gameState) {
    console.log('Rendering error screen');
    return (
      <div className="player-game-container">
        <div className="player-game-card">
          <div className="error-message">{error}</div>
          <p style={{ color: 'white', marginTop: '1rem' }}>Debug: gameCode={gameCode}, playerName={playerName}, team={team}</p>
          <button onClick={() => navigate('/quiz/join')} className="back-button">
            Back to Join
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    console.log('Rendering loading screen - gameState is null');
    return (
      <div className="player-game-container">
        <div className="player-game-card">
          <div className="loading">Waiting for game to start...</div>
          <p style={{ color: 'white', marginTop: '1rem', fontSize: '0.9rem' }}>
            Debug Info: gameCode={gameCode || 'missing'}, playerName={playerName || 'missing'}, team={team || 'missing'}
          </p>
          <p style={{ color: 'white', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Location state: {JSON.stringify(location.state || 'null')}
          </p>
        </div>
      </div>
    );
  }
  
  console.log('Rendering main game screen:', { showLevelSelection, currentQuestion, gameState });

  if (!gameState) {
    return (
      <div className="player-game-container">
        <div className="player-game-card">
          <div className="loading">Loading game...</div>
        </div>
      </div>
    );
  }

  const isTeamA = gameState.team === 'A';
  const yourScore = isTeamA ? gameState.scoreA : gameState.scoreB;
  const opponentScore = isTeamA ? gameState.scoreB : gameState.scoreA;

  return (
    <div className="player-game-container">
      <div className="player-game-card">
        <div className="player-header">
          <h1 className="player-title">Quiz Game</h1>
          <div className="player-info">
            <span className="player-name-display">{playerName}</span>
            <span className={`team-badge ${isTeamA ? 'team-a' : 'team-b'}`}>
              Team {gameState.team}
            </span>
          </div>
        </div>

        <div className="player-scores">
          <div className={`player-score-panel ${isTeamA ? 'your-team' : 'opponent-team'}`}>
            <div className="score-label">Your Team</div>
            <div className="score-number">{yourScore}</div>
          </div>
          <div className="score-separator">VS</div>
          <div className={`player-score-panel ${!isTeamA ? 'your-team' : 'opponent-team'}`}>
            <div className="score-label">Opponent</div>
            <div className="score-number">{opponentScore}</div>
          </div>
        </div>

        <div className="quiz-content-area">
          {showLevelSelection && !currentQuestion ? (
            <div className="level-selection-container">
              <div className="level-selection-header">
                <h2 className="level-selection-title">Choose Your Difficulty Level</h2>
                <div 
                  className={`timer ${timeRemaining <= 2 ? 'timer-warning' : ''}`} 
                  style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold',
                    minWidth: '60px',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.5rem 1rem',
                    background: 'rgba(100, 108, 255, 0.2)',
                    border: '2px solid rgba(100, 108, 255, 0.5)',
                    borderRadius: '20px',
                    color: '#646cff'
                  }}
                >
                  {Math.max(0, timeRemaining)}s
                </div>
              </div>
              {/* Debug info */}
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>
                Debug: showLevelSelection={showLevelSelection ? 'true' : 'false'}, timeRemaining={timeRemaining}, currentQuestion={currentQuestion ? 'exists' : 'null'}
              </div>
              <p className="level-selection-subtitle">Select a level to get your question</p>
              <div className="level-buttons">
                <button 
                  className="level-button level-low"
                  onClick={() => handleLevelSelection('low')}
                  disabled={isAnswerSubmitted || timeRemaining <= 0}
                >
                  <div className="level-name">Easy</div>
                  <div className="level-points">50 Points</div>
                </button>
                <button 
                  className="level-button level-medium"
                  onClick={() => handleLevelSelection('medium')}
                  disabled={isAnswerSubmitted || timeRemaining <= 0}
                >
                  <div className="level-name">Medium</div>
                  <div className="level-points">75 Points</div>
                </button>
                <button 
                  className="level-button level-hard"
                  onClick={() => handleLevelSelection('hard')}
                  disabled={isAnswerSubmitted || timeRemaining <= 0}
                >
                  <div className="level-name">Hard</div>
                  <div className="level-points">100 Points</div>
                </button>
              </div>
            </div>
          ) : currentQuestion ? (
            <>
              <div className="question-container">
                <div className="question-header">
                  <span className={`question-level-badge level-${currentQuestion.level}`}>
                    {currentQuestion.level.toUpperCase()} - {currentQuestion.points} Points
                  </span>
                  <div className="timer-container">
                    <div className={`timer ${timeRemaining <= 2 ? 'timer-warning' : ''}`}>
                      {timeRemaining}s
                    </div>
                  </div>
                </div>
                <h2 className="question-text">{currentQuestion.question}</h2>
                <div className="answers-container">
                  {currentQuestion.options.map((option: string, index: number) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === currentQuestion.correctAnswer;
                    const showCorrect = showResult && isCorrect;
                    const showIncorrect = showResult && isSelected && !isCorrect;
                    
                    return (
                      <button 
                        key={index} 
                        className={`answer-button ${
                          isSelected ? 'selected' : ''
                        } ${
                          showCorrect ? 'correct-answer' : ''
                        } ${
                          showIncorrect ? 'incorrect-answer' : ''
                        }`}
                        onClick={() => handleAnswer(index)}
                        disabled={isAnswerSubmitted}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {showResult && (
                <div className="result-popup-overlay">
                  <div className="result-popup">
                    {answerResult === 'correct' && (
                      <div className="result-content correct">
                        <div className="result-icon">✓</div>
                        <h2 className="result-title">Correct!</h2>
                        <p className="result-message">You earned {currentQuestion.points} points for your team!</p>
                        <p className="result-wait-message">Next question in 3 seconds...</p>
                      </div>
                    )}
                    {answerResult === 'incorrect' && (
                      <div className="result-content incorrect">
                        <div className="result-icon">✗</div>
                        <h2 className="result-title">Incorrect</h2>
                        <p className="result-message">The opposite team earned {currentQuestion.points} points!</p>
                        <p className="result-wait-message">Next question in 3 seconds...</p>
                      </div>
                    )}
                    {answerResult === 'not_attempted' && (
                      <div className="result-content not-attempted">
                        <div className="result-icon">⏱</div>
                        <h2 className="result-title">Time's Up!</h2>
                        <p className="result-message">No points awarded for this question.</p>
                        <p className="result-wait-message">Next question in 3 seconds...</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="waiting-message">
              <p>Waiting for game to start...</p>
              <p className="waiting-subtitle">The level selection will begin soon!</p>
              {error && (
                <p style={{ color: '#ff6b6b', marginTop: '1rem', fontSize: '0.9rem' }}>
                  Connection issue: {error}. Make sure the WebSocket server is running.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayerGame;
