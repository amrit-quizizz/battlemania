import { Routes, Route, Navigate } from 'react-router-dom'
import StartGame from './quiz/StartGame'
import JoinGame from './quiz/JoinGame'
import QuizGame from './quiz/QuizGame'
import PlayerGame from './quiz/PlayerGame'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/quiz/init" replace />} />
      <Route path="/quiz/init" element={<StartGame />} />
      <Route path="/quiz/join" element={<JoinGame />} />
      <Route path="/quiz/game" element={<QuizGame />} />
      <Route path="/quiz/player-game" element={<PlayerGame />} />
    </Routes>
  )
}

export default App
