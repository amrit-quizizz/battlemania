import { Command, Team, GameEvent } from '../types/game';
import { useGameStore } from '../store/gameStore';

type EventCallback = (event: GameEvent) => void;

class MockSocketService {
  private listeners: EventCallback[] = [];
  private connected = false;
  private autoPlayInterval: ReturnType<typeof setInterval> | null = null;

  connect(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connected = true;
        console.log('[MockSocket] Connected to game server');
        this.emit({
          type: 'spawn',
          data: { message: 'Connected to battle server' },
          timestamp: Date.now(),
        });
        resolve();
      }, 500);
    });
  }

  disconnect(): void {
    this.connected = false;
    this.stopAutoPlay();
    console.log('[MockSocket] Disconnected from game server');
  }

  on(callback: EventCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private emit(event: GameEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  sendCommand(unitId: string, command: Command, targetId?: string): void {
    if (!this.connected) {
      console.warn('[MockSocket] Not connected');
      return;
    }

    // Simulate network latency
    setTimeout(() => {
      const store = useGameStore.getState();
      store.setCommand(unitId, command, targetId);

      this.emit({
        type: 'command',
        data: { unitId, command, targetId },
        timestamp: Date.now(),
      });
    }, Math.random() * 100 + 50);
  }

  startAutoPlay(): void {
    if (this.autoPlayInterval) return;

    this.autoPlayInterval = setInterval(() => {
      const store = useGameStore.getState();
      if (store.isPaused) return;

      // Randomly issue commands from both teams
      const units = store.units;
      if (units.length === 0) return;

      // Pick a random unit
      const randomUnit = units[Math.floor(Math.random() * units.length)];
      const enemyTeam: Team = randomUnit.team === 'red' ? 'blue' : 'red';
      const enemies = units.filter((u) => u.team === enemyTeam);

      if (enemies.length === 0) {
        console.log('[MockSocket] Battle ended - no enemies remaining');
        this.stopAutoPlay();
        return;
      }

      // 70% chance to attack/fire, 30% chance to defend
      const commands: Command[] = ['attack', 'fire', 'fire', 'fire', 'attack', 'attack', 'defend', 'defend', 'defend', 'idle'];
      const randomCommand = commands[Math.floor(Math.random() * commands.length)];
      const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];

      this.sendCommand(randomUnit.id, randomCommand, randomEnemy.id);
    }, 2000);

    console.log('[MockSocket] Auto-play started');
  }

  stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
      console.log('[MockSocket] Auto-play stopped');
    }
  }

  isAutoPlaying(): boolean {
    return this.autoPlayInterval !== null;
  }
}

export const mockSocket = new MockSocketService();
