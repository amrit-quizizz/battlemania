import { Routes, Route, Navigate } from 'react-router-dom'
import StartGame from './quiz/StartGame'
import JoinGame from './quiz/JoinGame'
import QuizGame from './quiz/QuizGame'
import PlayerGame from './quiz/PlayerGame'
import SideScrollGame from './3d-game/SideScrollGame'
import './App.css'
import { getGame, DEFAULT_GAME_ID } from './games/registry'

function BattleManiaRoute() {
  const gameModule = getGame(DEFAULT_GAME_ID);

  if (!gameModule) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h1>Game not found</h1>
      </div>
    );
  }

  const { GameComponent } = gameModule;

  return (
    <div style={{ height: '100vh', width: '100vw', margin: 0, padding: 0, overflow: 'hidden' }}>
      <GameComponent />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/quiz/init" replace />} />
      <Route path="/battlemania" element={<BattleManiaRoute />} />
      <Route path="/game-three-d" element={<SideScrollGame />} />
      <Route path="/quiz/init" element={<StartGame />} />
      <Route path="/quiz/join" element={<JoinGame />} />
      <Route path="/quiz/game" element={<QuizGame />} />
      <Route path="/quiz/player-game" element={<PlayerGame />} />
    </Routes>
  )
}

export default App
