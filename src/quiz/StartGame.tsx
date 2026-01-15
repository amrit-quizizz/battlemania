import { useState } from 'react';
import './StartGame.css';

function StartGame() {
  const [gameCode, setGameCode] = useState<string | null>(null);

  const generateGameCode = (): string => {
    // Generate a 6-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleStartGame = () => {
    const code = generateGameCode();
    setGameCode(code);
  };

  return (
    <div className="start-game-container">
      <div className="start-game-card">
        {!gameCode ? (
          <>
            <h1 className="start-game-title">Quiz Game</h1>
            <p className="start-game-subtitle">Start a new game session</p>
            <button className="start-game-button" onClick={handleStartGame}>
              Start Game
            </button>
          </>
        ) : (
          <>
            <h1 className="start-game-title">Game Started!</h1>
            <p className="start-game-subtitle">Share this code with players to join</p>
            <div className="game-code-container">
              <div className="game-code">{gameCode}</div>
            </div>
            <button 
              className="start-game-button secondary" 
              onClick={() => setGameCode(null)}
            >
              Start New Game
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default StartGame;
