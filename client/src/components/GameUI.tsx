import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { mockSocket } from '../services/mockSocket';
import { Command, Team } from '../types/game';

export function GameUI() {
  const units = useGameStore((state) => state.units);
  const selectedUnit = useGameStore((state) => state.selectedUnit);
  const battleLog = useGameStore((state) => state.battleLog);
  const isPaused = useGameStore((state) => state.isPaused);
  const togglePause = useGameStore((state) => state.togglePause);
  const initializeGame = useGameStore((state) => state.initializeGame);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const selectedUnitData = units.find((u) => u.id === selectedUnit);
  const redTeamUnits = units.filter((u) => u.team === 'red');
  const blueTeamUnits = units.filter((u) => u.team === 'blue');

  useEffect(() => {
    initializeGame();
    mockSocket.connect().then(() => setIsConnected(true));
    return () => mockSocket.disconnect();
  }, [initializeGame]);

  const handleCommand = (command: Command) => {
    if (!selectedUnit) return;

    const unit = units.find((u) => u.id === selectedUnit);
    if (!unit) return;

    // Find a random enemy target for attack/fire commands
    const enemyTeam: Team = unit.team === 'red' ? 'blue' : 'red';
    const enemies = units.filter((u) => u.team === enemyTeam);
    const targetId = enemies.length > 0 ? enemies[Math.floor(Math.random() * enemies.length)].id : undefined;

    mockSocket.sendCommand(selectedUnit, command, targetId);
  };

  const handleAutoPlay = () => {
    if (isAutoPlay) {
      mockSocket.stopAutoPlay();
    } else {
      mockSocket.startAutoPlay();
    }
    setIsAutoPlay(!isAutoPlay);
  };

  const handleReset = () => {
    mockSocket.stopAutoPlay();
    setIsAutoPlay(false);
    initializeGame();
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-auto">
        {/* Red team status */}
        <div className="bg-gradient-to-r from-red-900/90 to-red-800/70 backdrop-blur-sm rounded-lg p-4 min-w-[200px] border border-red-700">
          <h2 className="text-red-300 font-bold text-lg mb-2 flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            RED TEAM
          </h2>
          <div className="space-y-1">
            {redTeamUnits.map((unit) => (
              <div key={unit.id} className="flex justify-between text-sm">
                <span className="text-red-200 capitalize">{unit.type}</span>
                <span className={unit.health > 50 ? 'text-green-400' : unit.health > 25 ? 'text-yellow-400' : 'text-red-400'}>
                  {unit.health}/{unit.maxHealth}
                </span>
              </div>
            ))}
            {redTeamUnits.length === 0 && (
              <span className="text-red-400 text-sm">All units destroyed!</span>
            )}
          </div>
        </div>

        {/* Title and controls */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500">
            BATTLE FIELDS
          </h1>
          <div className="flex gap-2">
            <button
              onClick={togglePause}
              className="px-4 py-2 bg-gray-800/90 hover:bg-gray-700 text-white rounded-lg transition-all border border-gray-600"
            >
              {isPaused ? 'RESUME' : 'PAUSE'}
            </button>
            <button
              onClick={handleAutoPlay}
              className={`px-4 py-2 rounded-lg transition-all border ${
                isAutoPlay
                  ? 'bg-green-600 hover:bg-green-700 border-green-500 text-white'
                  : 'bg-gray-800/90 hover:bg-gray-700 border-gray-600 text-white'
              }`}
            >
              {isAutoPlay ? 'STOP AUTO' : 'AUTO BATTLE'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-orange-600/90 hover:bg-orange-700 text-white rounded-lg transition-all border border-orange-500"
            >
              RESET
            </button>
          </div>
          <div className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'Connected to server' : 'Connecting...'}
          </div>
        </div>

        {/* Blue team status */}
        <div className="bg-gradient-to-l from-blue-900/90 to-blue-800/70 backdrop-blur-sm rounded-lg p-4 min-w-[200px] border border-blue-700">
          <h2 className="text-blue-300 font-bold text-lg mb-2 flex items-center gap-2 justify-end">
            BLUE TEAM
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
          </h2>
          <div className="space-y-1">
            {blueTeamUnits.map((unit) => (
              <div key={unit.id} className="flex justify-between text-sm">
                <span className="text-blue-200 capitalize">{unit.type}</span>
                <span className={unit.health > 50 ? 'text-green-400' : unit.health > 25 ? 'text-yellow-400' : 'text-red-400'}>
                  {unit.health}/{unit.maxHealth}
                </span>
              </div>
            ))}
            {blueTeamUnits.length === 0 && (
              <span className="text-blue-400 text-sm">All units destroyed!</span>
            )}
          </div>
        </div>
      </div>

      {/* Command panel (bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-end">
        {/* Battle log */}
        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 w-80 max-h-48 overflow-y-auto border border-gray-700 pointer-events-auto">
          <h3 className="text-gray-400 font-bold text-sm mb-2">BATTLE LOG</h3>
          <div className="space-y-1 text-xs font-mono">
            {battleLog.slice(-10).map((log, i) => (
              <div key={i} className="text-gray-300">{log}</div>
            ))}
          </div>
        </div>

        {/* Selected unit commands */}
        <div className="flex flex-col items-center gap-3 pointer-events-auto">
          {selectedUnitData ? (
            <>
              <div
                className="px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: selectedUnitData.team === 'red' ? 'rgba(139, 0, 0, 0.9)' : 'rgba(0, 0, 139, 0.9)',
                  borderColor: selectedUnitData.team === 'red' ? '#ef4444' : '#3b82f6',
                }}
              >
                <span className="text-white font-bold capitalize">
                  {selectedUnitData.team} {selectedUnitData.type} selected
                </span>
              </div>
              <div className="flex gap-2">
                <CommandButton
                  label="ATTACK"
                  icon="icon-attack"
                  color="bg-red-600 hover:bg-red-700"
                  onClick={() => handleCommand('attack')}
                />
                <CommandButton
                  label="FIRE"
                  icon="icon-fire"
                  color="bg-orange-600 hover:bg-orange-700"
                  onClick={() => handleCommand('fire')}
                />
                <CommandButton
                  label="DEFEND"
                  icon="icon-defend"
                  color="bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleCommand('defend')}
                />
                <CommandButton
                  label="HOLD"
                  icon="icon-idle"
                  color="bg-gray-600 hover:bg-gray-700"
                  onClick={() => handleCommand('idle')}
                />
              </div>
            </>
          ) : (
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-6 py-3 border border-gray-600">
              <span className="text-gray-400">Click on a unit to select it</span>
            </div>
          )}
        </div>

        {/* Mini instructions */}
        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 w-64 border border-gray-700">
          <h3 className="text-gray-400 font-bold text-sm mb-2">CONTROLS</h3>
          <div className="space-y-1 text-xs text-gray-400">
            <div>Left Click - Select unit</div>
            <div>Right Drag - Rotate camera</div>
            <div>Scroll - Zoom in/out</div>
            <div>Middle Drag - Pan camera</div>
          </div>
        </div>
      </div>

      {/* Victory/Defeat overlay */}
      {(redTeamUnits.length === 0 || blueTeamUnits.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto">
          <div className="text-center">
            <h2
              className={`text-6xl font-bold mb-4 ${
                redTeamUnits.length === 0 ? 'text-blue-500' : 'text-red-500'
              }`}
            >
              {redTeamUnits.length === 0 ? 'BLUE TEAM WINS!' : 'RED TEAM WINS!'}
            </h2>
            <button
              onClick={handleReset}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xl font-bold rounded-lg transition-all"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CommandButton({
  label,
  color,
  onClick,
}: {
  label: string;
  icon: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} px-6 py-3 rounded-lg text-white font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg`}
    >
      {label}
    </button>
  );
}
