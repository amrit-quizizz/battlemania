import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import headerLogo from '../assets/logo.svg';
import './PlayerGame.css';

interface Question {
  questionIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctAnswer: number;
  totalQuestions: number;
}

interface GameState {
  gameCode: string;
  playerId: string;
  team: 'A' | 'B';
  scoreA: number;
  scoreB: number;
  totalQuestions: number;
  currentQuestion?: Question;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

function PlayerGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions] = useState(10);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answerResult, setAnswerResult] = useState<'correct' | 'incorrect' | 'not_attempted' | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [showLevelSelection, setShowLevelSelection] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const popupTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { gameCode, playerName, team } = location.state || {};

  // Initialize game state
  useEffect(() => {
    if (gameCode && playerName) {
      // Don't set full state yet - wait for server response
      setIsLoading(true);
    } else {
      setError('Missing game information');
      setIsLoading(false);
    }
  }, [gameCode, playerName]);

  // WebSocket connection
  useEffect(() => {
    if (!gameCode || !playerName) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected - sending player_join for reconnection');
      // Use player_join to reconnect to the game
      ws.send(JSON.stringify({
        type: 'player_join',
        roomCode: gameCode,
        name: playerName
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received:', data);

        switch (data.type) {
          case 'player_joined':
            // Successfully joined/reconnected
            setGameState({
              gameCode: data.roomCode || gameCode,
              playerId: data.playerId,
              team: data.team || team || 'A',
              scoreA: 0,
              scoreB: 0,
              totalQuestions: data.quizMeta?.totalQuestions || 10,
            });
            setIsLoading(false);
            // Hide level selection since 3d-quiz-be doesn't use it
            setShowLevelSelection(false);
            break;

          case 'room_update':
            // Room updated (player joined/left)
            console.log('Room update:', data);
            break;

          case 'game_started':
            // Game is starting
            console.log('Game started, total questions:', data.totalQuestions);
            setGameState(prev => prev ? {
              ...prev,
              totalQuestions: data.totalQuestions || prev.totalQuestions,
            } : prev);
            break;

          case 'question':
            // New question received from backend
            setCurrentQuestion({
              questionIndex: data.questionIndex,
              difficulty: data.difficulty,
              question: data.question,
              options: data.options,
              correctAnswer: -1, // We don't know the answer yet
              totalQuestions: data.totalQuestions,
            });
            setQuestionNumber(data.questionIndex + 1);
            setGameState(prev => prev ? {
              ...prev,
              totalQuestions: data.totalQuestions || prev.totalQuestions,
            } : prev);
            setShowLevelSelection(false);
            setShowResult(false);
            setSelectedAnswer(null);
            setIsAnswerSubmitted(false);
            setTimeRemaining(15); // Reset timer for new question
            break;

          case 'answer_result':
            // Result of our answer submission
            setIsAnswerSubmitted(true);
            const wasCorrect = data.correct;
            setAnswerResult(wasCorrect ? 'correct' : 'incorrect');
            // Update the current question with correct answer
            setCurrentQuestion(prev => prev ? {
              ...prev,
              correctAnswer: data.correctAnswer,
            } : null);
            setShowResult(true);
            // Update player's score
            setGameState(prev => prev ? {
              ...prev,
              scoreA: prev.team === 'A' ? data.score : prev.scoreA,
              scoreB: prev.team === 'B' ? data.score : prev.scoreB,
            } : prev);
            break;

          case 'scores_update':
            // Team scores updated
            console.log('Scores update:', data);
            break;

          case 'game_finished':
            // Game is over
            const teamAScore = data.teamA?.reduce((sum: number, p: { score: number }) => sum + p.score, 0) || 0;
            const teamBScore = data.teamB?.reduce((sum: number, p: { score: number }) => sum + p.score, 0) || 0;
            alert(`Game Over!\nTeam A: ${teamAScore}\nTeam B: ${teamBScore}`);
            navigate('/join');
            break;

          case 'error':
            console.error('Server error:', data.message);
            // Don't show error for "Game already started" since we might be reconnecting
            if (data.message !== 'Game already started') {
              setError(data.message);
            }
            setIsLoading(false);
            break;
        }
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    };

    ws.onerror = () => {
      setError('Connection error');
      setIsLoading(false);
    };
    ws.onclose = () => console.log('WebSocket disconnected');

    return () => {
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
      ws.close();
    };
  }, [gameCode, playerName, team, navigate]);

  const handleLevelSelection = (level: 'low' | 'medium' | 'hard') => {
    if (isAnswerSubmitted || timeRemaining <= 0) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'select_level',
        gameCode: gameState?.gameCode || gameCode,
        level,
      }));
    }
  };

  const handleAnswer = (index: number) => {
    if (!currentQuestion || isAnswerSubmitted) return;

    setSelectedAnswer(index);
    setIsAnswerSubmitted(true);

    // Send answer to 3d-quiz-be backend
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'submit_answer',
        questionIndex: currentQuestion.questionIndex,
        answer: index,
      }));
    }
    // Wait for answer_result from server
  };

  const yourScore = gameState?.team === 'A' ? gameState.scoreA : gameState?.scoreB || 0;

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading game...</div>
      </div>
    );
  }

  if (error && !gameState) {
    return (
      <div className="loading-screen">
        <div className="loading-text" style={{ color: '#ff6b6b' }}>{error}</div>
        <button
          onClick={() => navigate('/join')}
          style={{ marginTop: '20px', padding: '12px 24px', cursor: 'pointer' }}
        >
          Back to Join
        </button>
      </div>
    );
  }

  return (
    <div className="player-game-page">
      {/* Background */}
      <div className="player-game-background"></div>

      {/* Header */}
      <header className="player-game-header">
        <div className="header-left">
          <img src={headerLogo} alt="Logo" className="header-logo" />
          <div className="header-rank-badge">
            <Icon icon="mdi:trophy" />
            <span>1st</span>
          </div>
        </div>
        <div className="header-right">
          <div className="header-score">{yourScore.toLocaleString()}</div>
          <button className="header-icon-btn">
            <Icon icon="mdi:menu" width={20} />
          </button>
          <button className="header-icon-btn">
            <Icon icon="mdi:fullscreen" width={20} />
          </button>
        </div>
      </header>

      {/* Timer */}
      <div className={`timer-display ${timeRemaining <= 3 ? 'warning' : ''}`}>
        {timeRemaining}s
      </div>

      {/* Main Content */}
      <main className="player-game-content">
        {showLevelSelection && !currentQuestion ? (
          <>
            {/* Question Section - Level Selection */}
            <section className="question-section">
              <div className="question-badge">{questionNumber}/{totalQuestions}</div>
              <div className="question-card">
                <h2 className="question-text">Choose your difficulty level</h2>
              </div>
            </section>

            {/* Answers Section - Level Options */}
            <section className="answers-section">
              <p className="answers-instruction">Select a difficulty to get your question</p>
              <div className="answers-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <button
                  className={`answer-card ${isAnswerSubmitted ? 'disabled' : ''}`}
                  onClick={() => handleLevelSelection('low')}
                  disabled={isAnswerSubmitted || timeRemaining <= 0}
                  style={{ background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)' }}
                >
                  <span className="answer-number">1</span>
                  <span className="answer-text">
                    Easy<br />
                    <small style={{ fontSize: '14px', opacity: 0.8 }}>50 Points</small>
                  </span>
                </button>
                <button
                  className={`answer-card ${isAnswerSubmitted ? 'disabled' : ''}`}
                  onClick={() => handleLevelSelection('medium')}
                  disabled={isAnswerSubmitted || timeRemaining <= 0}
                  style={{ background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)' }}
                >
                  <span className="answer-number">2</span>
                  <span className="answer-text">
                    Medium<br />
                    <small style={{ fontSize: '14px', opacity: 0.8 }}>75 Points</small>
                  </span>
                </button>
                <button
                  className={`answer-card ${isAnswerSubmitted ? 'disabled' : ''}`}
                  onClick={() => handleLevelSelection('hard')}
                  disabled={isAnswerSubmitted || timeRemaining <= 0}
                  style={{ background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)' }}
                >
                  <span className="answer-number">3</span>
                  <span className="answer-text">
                    Hard<br />
                    <small style={{ fontSize: '14px', opacity: 0.8 }}>100 Points</small>
                  </span>
                </button>
              </div>
            </section>
          </>
        ) : currentQuestion ? (
          <>
            {/* Question Section */}
            <section className="question-section">
              <div className="question-badge">{questionNumber}/{totalQuestions}</div>
              <div className="question-card">
                <button className="question-speaker-btn">
                  <Icon icon="mdi:volume-high" width={20} />
                </button>
                <h2 className="question-text">{currentQuestion.question}</h2>
              </div>
            </section>

            {/* Answers Section */}
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
            <h2 className="waiting-title">Waiting for game...</h2>
            <p className="waiting-subtitle">The next question will appear soon</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="player-game-footer">
        <div className="footer-player-info">
          <div className="player-avatar">👤</div>
          <span className="player-name">{playerName}</span>
        </div>
        <div className="footer-center">
          <button className="power-up-btn double-points" title="Double Points">
            2x
          </button>
          <button className="power-up-btn shield" title="Shield">
            🛡️
          </button>
          <button className="power-up-btn fifty-fifty" title="50/50">
            ½
          </button>
        </div>
        <div className="footer-right">
          <button
            className={`submit-btn ${selectedAnswer !== null && !isAnswerSubmitted ? 'active' : ''}`}
            disabled={selectedAnswer === null || isAnswerSubmitted}
          >
            Submit
          </button>
        </div>
      </footer>

      {/* Result Overlay */}
      {showResult && (
        <div className="result-overlay">
          <div className="result-card">
            {answerResult === 'correct' && (
              <>
                <div className="result-icon">✅</div>
                <h2 className="result-title correct">Correct!</h2>
                <p className="result-message">
                  You earned {currentQuestion?.points || 0} points!
                </p>
              </>
            )}
            {answerResult === 'incorrect' && (
              <>
                <div className="result-icon">❌</div>
                <h2 className="result-title incorrect">Incorrect</h2>
                <p className="result-message">
                  The correct answer was: {currentQuestion?.options[currentQuestion.correctAnswer]}
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
            <p className="result-wait">Next question loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerGame;
