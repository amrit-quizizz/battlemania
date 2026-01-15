import './App.css'
import { getGame, DEFAULT_GAME_ID } from './games/registry'

function App() {
  // Get the current game module (can be extended to support game selection)
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

export default App
