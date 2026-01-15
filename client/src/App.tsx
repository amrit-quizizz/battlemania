import { Battlefield } from './components/Battlefield';
import { GameUI } from './components/GameUI';
import './index.css';

function App() {
  return (
    <div className="w-full h-screen relative overflow-hidden">
      <Battlefield />
      <GameUI />
    </div>
  );
}

export default App;
