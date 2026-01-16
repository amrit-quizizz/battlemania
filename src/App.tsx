import { Routes, Route, Navigate } from 'react-router-dom'
import StartGame from './quiz/StartGame'
import JoinGame from './quiz/JoinGame'
import QuizGame from './quiz/QuizGame'
import SideScrollGame from './3d-game/SideScrollGame'
import AdminDashboard from './admin/AdminDashboard'
import BattleMode from './admin/BattleMode'
import { ToastProvider } from './components/Toast'
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
    <ToastProvider>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
        
        {/* Admin routes - all on /admin/battle-field (no route changes!) */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/battle-field" element={<BattleMode />} />
        
        {/* Student routes - all on /join (no route changes = no disconnects!) */}
        <Route path="/join" element={<JoinGame />} />
        
        {/* Legacy routes (kept for backwards compatibility) */}
        <Route path="/battle-mode" element={<Navigate to="/admin/battle-field" replace />} />
        <Route path="/battlemania" element={<BattleManiaRoute />} />
        <Route path="/game-three-d" element={<SideScrollGame />} />
        <Route path="/quiz/init" element={<StartGame />} />
        <Route path="/quiz/game" element={<QuizGame />} />
      </Routes>
    </ToastProvider>
  )
}

export default App
