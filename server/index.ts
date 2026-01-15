import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load questions
const questionsData = JSON.parse(readFileSync(join(__dirname, 'questions.json'), 'utf-8'));

const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

// Game state machine
enum GameState {
  WAITING = 'WAITING',
  LEVEL_SELECTION = 'LEVEL_SELECTION',
  ANSWERING_QUESTION = 'ANSWERING_QUESTION',
  SHOWING_RESULT = 'SHOWING_RESULT',
  SHOWING_POPUP = 'SHOWING_POPUP',
  GAME_OVER = 'GAME_OVER'
}

// Game session types
interface Question {
  id: number;
  level: 'low' | 'medium' | 'hard';
  points: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Player {
  id: string;
  name: string;
  ws: WebSocket;
  team: 'A' | 'B';
}

interface PlayerTurnState {
  playerId: string;
  team: 'A' | 'B';
  hasSelectedLevel: boolean;
  selectedLevel: 'low' | 'medium' | 'hard' | null;
  levelSelectionTimestamp: number | null;
  assignedQuestion: Question | null;
  hasSubmittedAnswer: boolean;
  submittedAnswer: number | null;
  answerSubmissionTimestamp: number | null;
  isCorrect: boolean | null;
  pointsEarned: number;
}

interface GameSession {
  gameCode: string;
  teamA: Player[];
  teamB: Player[];
  hostWs: WebSocket | null;
  createdAt: Date;
  scoreA: number;
  scoreB: number;
  isActive: boolean;

  // State machine fields
  currentState: GameState;

  // Timer management (timestamp-based)
  turnStartTimestamp: number | null;
  totalTurnDuration: number;
  turnTimerInterval: NodeJS.Timeout | null;

  // Turn data
  currentTurn: number;
  playerStates: Map<WebSocket, PlayerTurnState>;
}

// Store game sessions
const gameSessions = new Map<string, GameSession>();

// Create HTTP server for WebSocket
const server = createServer();
const wss = new WebSocketServer({ server });

// Helper function to generate game code
function generateGameCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Round-robin team assignment
function assignTeam(session: GameSession): 'A' | 'B' {
  const totalPlayers = session.teamA.length + session.teamB.length;
  // Round-robin: alternate between teams
  return totalPlayers % 2 === 0 ? 'A' : 'B';
}

// Broadcast game state to all clients in a session
function broadcastGameState(session: GameSession) {
  const gameState = {
    type: 'game_state',
    gameCode: session.gameCode,
    teamA: session.teamA.map(p => ({ id: p.id, name: p.name })),
    teamB: session.teamB.map(p => ({ id: p.id, name: p.name })),
    scoreA: session.scoreA,
    scoreB: session.scoreB,
    isActive: session.isActive,
  };

  // Send to host
  if (session.hostWs && session.hostWs.readyState === WebSocket.OPEN) {
    session.hostWs.send(JSON.stringify(gameState));
  }

  // Send to all players
  [...session.teamA, ...session.teamB].forEach(player => {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(gameState));
    }
  });
}

// ===== STATE MACHINE HELPER FUNCTIONS =====

function clearTimers(session: GameSession): void {
  if (session.turnTimerInterval) {
    clearInterval(session.turnTimerInterval);
    session.turnTimerInterval = null;
  }
}

function assignRandomLevel(session: GameSession, playerWs: WebSocket): void {
  const levels: ('low' | 'medium' | 'hard')[] = ['low', 'medium', 'hard'];
  const randomLevel = levels[Math.floor(Math.random() * levels.length)];

  const playerState = session.playerStates.get(playerWs);
  if (!playerState) return;

  // Assign random level
  playerState.hasSelectedLevel = true;
  playerState.selectedLevel = randomLevel;
  playerState.levelSelectionTimestamp = Date.now();

  // Get random question for that level
  const levelQuestions = questionsData.questions.filter((q: any) => q.level === randomLevel);
  const randomQuestion = levelQuestions[Math.floor(Math.random() * levelQuestions.length)];
  playerState.assignedQuestion = randomQuestion;

  console.log(`Auto-assigned ${randomLevel} level to player ${playerState.playerId}`);
}

// ===== TIMER MANAGEMENT FUNCTIONS =====

function startTimerBroadcast(session: GameSession): void {
  clearTimers(session);

  // Broadcast every 500ms for smooth countdown
  session.turnTimerInterval = setInterval(() => {
    const currentTime = Date.now();
    const elapsedTime = currentTime - session.turnStartTimestamp!;
    const timeRemainingMs = Math.max(0, session.totalTurnDuration - elapsedTime);
    const timeRemaining = Math.ceil(timeRemainingMs / 1000);

    // Broadcast to all players
    [...session.teamA, ...session.teamB].forEach(player => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify({
          type: 'turn_timer',
          state: session.currentState,
          timeRemaining: timeRemaining,
          serverTimestamp: currentTime,
          turnStartTimestamp: session.turnStartTimestamp
        }));
      }
    });

    // Check if timer expired
    if (timeRemainingMs <= 0) {
      handleTimerExpiry(session);
    }
  }, 500);
}

function handleTimerExpiry(session: GameSession): void {
  console.log(`Timer expired in state: ${session.currentState}`);

  clearTimers(session);

  if (session.currentState === GameState.LEVEL_SELECTION) {
    // Players who haven't selected get random level
    session.playerStates.forEach((playerState, playerWs) => {
      if (!playerState.hasSelectedLevel) {
        assignRandomLevel(session, playerWs);
      }
    });
  }

  // Transition to showing result
  transitionToShowingResult(session);
}

// ===== RESULT PROCESSING FUNCTIONS =====

function processPlayerResults(session: GameSession): void {
  session.playerStates.forEach((playerState, playerWs) => {
    const player = [...session.teamA, ...session.teamB].find(p => p.ws === playerWs);
    if (!player) return;

    // Case 1: Didn't select level or didn't get a question
    if (!playerState.hasSelectedLevel || !playerState.assignedQuestion) {
      playerState.pointsEarned = 0;
      playerState.isCorrect = null;
      return;
    }

    // Case 2: Selected level but didn't answer
    if (!playerState.hasSubmittedAnswer) {
      playerState.pointsEarned = 0;
      playerState.isCorrect = null;
      return;
    }

    // Case 3: Submitted answer
    const question = playerState.assignedQuestion;
    const isCorrect = playerState.submittedAnswer === question.correctAnswer;
    playerState.isCorrect = isCorrect;

    if (isCorrect) {
      // Correct answer: add points to player's team
      playerState.pointsEarned = question.points;
      if (player.team === 'A') {
        session.scoreA += question.points;
      } else {
        session.scoreB += question.points;
      }
    } else {
      // Incorrect answer: add points to opposite team
      playerState.pointsEarned = 0;
      if (player.team === 'A') {
        session.scoreB += question.points;
      } else {
        session.scoreA += question.points;
      }
    }
  });
}

function broadcastResults(session: GameSession): void {
  session.playerStates.forEach((playerState, playerWs) => {
    if (playerWs.readyState !== WebSocket.OPEN) return;

    let result: 'correct' | 'incorrect' | 'not_attempted';
    if (playerState.isCorrect === null) {
      result = 'not_attempted';
    } else if (playerState.isCorrect) {
      result = 'correct';
    } else {
      result = 'incorrect';
    }

    playerWs.send(JSON.stringify({
      type: 'game_state',
      state: 'SHOWING_RESULT',
      result: result,
      correctAnswer: playerState.assignedQuestion?.correctAnswer || null,
      pointsEarned: playerState.pointsEarned,
      scoreA: session.scoreA,
      scoreB: session.scoreB,
      timestamp: Date.now()
    }));
  });
}

// ===== STATE TRANSITION FUNCTIONS =====

function transitionToLevelSelection(session: GameSession): void {
  // Guard: Can only transition from WAITING, SHOWING_RESULT, SHOWING_POPUP
  if (![GameState.WAITING, GameState.SHOWING_RESULT, GameState.SHOWING_POPUP].includes(session.currentState)) {
    console.warn(`Invalid transition to LEVEL_SELECTION from ${session.currentState}`);
    return;
  }

  clearTimers(session);

  // Update state
  session.currentState = GameState.LEVEL_SELECTION;
  session.currentTurn = session.currentTurn + 1;
  session.turnStartTimestamp = Date.now();

  // Initialize player states
  session.playerStates = new Map();
  [...session.teamA, ...session.teamB].forEach(player => {
    session.playerStates.set(player.ws, {
      playerId: player.id,
      team: player.team,
      hasSelectedLevel: false,
      selectedLevel: null,
      levelSelectionTimestamp: null,
      assignedQuestion: null,
      hasSubmittedAnswer: false,
      submittedAnswer: null,
      answerSubmissionTimestamp: null,
      isCorrect: null,
      pointsEarned: 0
    });
  });

  // Send game state to all players
  [...session.teamA, ...session.teamB].forEach(player => {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify({
        type: 'game_state',
        state: 'LEVEL_SELECTION',
        gameCode: session.gameCode,
        scoreA: session.scoreA,
        scoreB: session.scoreB,
        turnNumber: session.currentTurn,
        turnStartTimestamp: session.turnStartTimestamp,
        totalTurnDuration: session.totalTurnDuration,
        timestamp: Date.now()
      }));
    }
  });

  // Start timer broadcast
  startTimerBroadcast(session);

  console.log(`Turn ${session.currentTurn}: Transitioned to LEVEL_SELECTION`);
}

function transitionToShowingResult(session: GameSession): void {
  // Guard: Can transition from LEVEL_SELECTION or ANSWERING_QUESTION
  if (![GameState.LEVEL_SELECTION, GameState.ANSWERING_QUESTION].includes(session.currentState)) {
    console.warn(`Invalid transition to SHOWING_RESULT from ${session.currentState}`);
    return;
  }

  clearTimers(session);

  // Update state
  session.currentState = GameState.SHOWING_RESULT;

  // Process results for all players
  processPlayerResults(session);

  // Broadcast results to all players
  broadcastResults(session);

  // Schedule transition to popup after 3 seconds
  setTimeout(() => {
    if (session.currentState === GameState.SHOWING_RESULT && session.isActive) {
      transitionToShowingPopup(session);
    }
  }, 3000);

  console.log(`Turn ${session.currentTurn}: Transitioned to SHOWING_RESULT`);
}

function transitionToShowingPopup(session: GameSession): void {
  // Guard: Can only transition from SHOWING_RESULT
  if (session.currentState !== GameState.SHOWING_RESULT) {
    console.warn(`Invalid transition to SHOWING_POPUP from ${session.currentState}`);
    return;
  }

  // Update state
  session.currentState = GameState.SHOWING_POPUP;

  // Broadcast popup state to all players
  [...session.teamA, ...session.teamB].forEach(player => {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify({
        type: 'game_state',
        state: 'SHOWING_POPUP',
        scoreA: session.scoreA,
        scoreB: session.scoreB,
        timestamp: Date.now()
      }));
    }
  });

  console.log(`Turn ${session.currentTurn}: Transitioned to SHOWING_POPUP (waiting for continue signal)`);
}

function transitionToGameOver(session: GameSession): void {
  clearTimers(session);

  // Update state
  session.currentState = GameState.GAME_OVER;
  session.isActive = false;

  // Broadcast final state
  [...session.teamA, ...session.teamB].forEach(player => {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify({
        type: 'game_state',
        state: 'GAME_OVER',
        finalScoreA: session.scoreA,
        finalScoreB: session.scoreB,
        timestamp: Date.now()
      }));
    }
  });

  console.log(`Game ${session.gameCode} ended: Team A ${session.scoreA}, Team B ${session.scoreB}`);
}

wss.on('connection', (ws: WebSocket) => {
  console.log('New WebSocket connection');

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data);

      switch (data.type) {
        case 'create_game': {
          // Host creates a new game session
          let gameCode: string;
          do {
            gameCode = generateGameCode();
          } while (gameSessions.has(gameCode));

          const session: GameSession = {
            gameCode,
            teamA: [],
            teamB: [],
            hostWs: ws,
            createdAt: new Date(),
            scoreA: 0,
            scoreB: 0,
            isActive: false,
            currentState: GameState.WAITING,
            turnStartTimestamp: null,
            totalTurnDuration: 15000, // 15 seconds
            turnTimerInterval: null,
            currentTurn: 0,
            playerStates: new Map(),
          };

          gameSessions.set(gameCode, session);

          // Send game code to host
          ws.send(JSON.stringify({
            type: 'game_created',
            gameCode,
          }));

          console.log(`Game session created: ${gameCode}`);
          break;
        }

        case 'join': {
          const { gameCode, playerName } = data;

          if (!gameCode || !playerName) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Game code and player name are required',
            }));
            return;
          }

          // Validate game code
          const session = gameSessions.get(gameCode);
          if (!session) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid game code',
            }));
            return;
          }

          // Check if max players reached (2 players: 1 per team)
          const totalPlayers = session.teamA.length + session.teamB.length;
          if (totalPlayers >= 2) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Game is full',
            }));
            return;
          }

          // Check if player name already exists
          const allPlayers = [...session.teamA, ...session.teamB];
          if (allPlayers.some(p => p.name === playerName)) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Player name already taken',
            }));
            return;
          }

          // Assign team using round-robin
          const team = assignTeam(session);
          const playerId = `player-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

          const player: Player = {
            id: playerId,
            name: playerName,
            ws,
            team,
          };

          if (team === 'A') {
            session.teamA.push(player);
          } else {
            session.teamB.push(player);
          }

          // Send success to joining player with current game state
          ws.send(JSON.stringify({
            type: 'join_success',
            gameCode,
            team,
            playerId,
            isActive: session.isActive,
          }));

          // Also send current game state to the joining player
          ws.send(JSON.stringify({
            type: 'game_state',
            gameCode: session.gameCode,
            teamA: session.teamA.map(p => ({ id: p.id, name: p.name })),
            teamB: session.teamB.map(p => ({ id: p.id, name: p.name })),
            scoreA: session.scoreA,
            scoreB: session.scoreB,
            isActive: session.isActive,
          }));

          // Broadcast updated game state to all other clients
          broadcastGameState(session);

          console.log(`Player ${playerName} joined game ${gameCode} in Team ${team}`);
          break;
        }

        case 'start_game': {
          const { gameCode } = data;
          const session = gameSessions.get(gameCode);

          if (!session) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid game code',
            }));
            return;
          }

          // Only host can start the game
          if (session.hostWs !== ws) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Only the host can start the game',
            }));
            return;
          }

          // Guard: Must be in WAITING state
          if (session.currentState !== GameState.WAITING) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Game already started',
            }));
            return;
          }

          // Check if game can be started
          if (session.teamA.length < 1 || session.teamB.length < 1) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Need at least 1 player in each team',
            }));
            return;
          }

          session.isActive = true;

          // Broadcast game started to all players with their team info
          session.teamA.forEach(player => {
            if (player.ws.readyState === WebSocket.OPEN) {
              player.ws.send(JSON.stringify({
                type: 'game_started',
                gameCode: session.gameCode,
                team: 'A',
                scoreA: session.scoreA,
                scoreB: session.scoreB,
              }));
              console.log(`Sent game_started to Team A player: ${player.name}`);
            }
          });

          session.teamB.forEach(player => {
            if (player.ws.readyState === WebSocket.OPEN) {
              player.ws.send(JSON.stringify({
                type: 'game_started',
                gameCode: session.gameCode,
                team: 'B',
                scoreA: session.scoreA,
                scoreB: session.scoreB,
              }));
              console.log(`Sent game_started to Team B player: ${player.name}`);
            }
          });

          // Transition to level selection phase
          transitionToLevelSelection(session);

          // Also broadcast full game state
          broadcastGameState(session);
          console.log(`Game ${gameCode} started - notified all players`);
          break;
        }

        case 'end_game': {
          const { gameCode } = data;
          const session = gameSessions.get(gameCode);

          if (!session) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid game code',
            }));
            return;
          }

          // Only host can end the game
          if (session.hostWs !== ws) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Only the host can end the game',
            }));
            return;
          }

          // Transition to game over state
          transitionToGameOver(session);

          console.log(`Game ${gameCode} ended by host`);
          break;
        }

        case 'get_game_state': {
          const { gameCode, playerName } = data;
          const session = gameSessions.get(gameCode);

          if (!session) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid game code',
            }));
            return;
          }

          // If playerName provided, update WebSocket reference (reconnection)
          if (playerName) {
            let player = session.teamA.find(p => p.name === playerName);
            if (!player) {
              player = session.teamB.find(p => p.name === playerName);
            }

            if (player) {
              console.log(`Reconnecting player ${playerName} with new WebSocket`);
              player.ws = ws;  // Update WebSocket reference

              // If game is active and in LEVEL_SELECTION, re-add to playerStates
              if (session.isActive && session.currentState === GameState.LEVEL_SELECTION) {
                const existingState = Array.from(session.playerStates.values()).find(
                  ps => ps.playerId === player!.id
                );

                if (existingState) {
                  // Move the existing state to the new WebSocket key
                  session.playerStates.set(ws, existingState);
                  console.log(`Restored player state for ${playerName} in LEVEL_SELECTION`);
                } else {
                  // Create new player state
                  session.playerStates.set(ws, {
                    playerId: player.id,
                    team: player.team,
                    hasSelectedLevel: false,
                    selectedLevel: null,
                    levelSelectionTimestamp: null,
                    assignedQuestion: null,
                    hasSubmittedAnswer: false,
                    submittedAnswer: null,
                    answerSubmissionTimestamp: null,
                    isCorrect: null,
                    pointsEarned: 0
                  });
                  console.log(`Created new player state for ${playerName} in LEVEL_SELECTION`);
                }
              }
            }
          }

          // Send current game state with state machine info
          const currentTime = Date.now();
          const elapsedTime = session.turnStartTimestamp
            ? currentTime - session.turnStartTimestamp
            : 0;
          const timeRemainingMs = Math.max(0, session.totalTurnDuration - elapsedTime);
          const timeRemaining = Math.ceil(timeRemainingMs / 1000);

          const gameState: any = {
            type: 'game_state',
            state: session.currentState,
            gameCode: session.gameCode,
            teamA: session.teamA.map(p => ({ id: p.id, name: p.name })),
            teamB: session.teamB.map(p => ({ id: p.id, name: p.name })),
            scoreA: session.scoreA,
            scoreB: session.scoreB,
            isActive: session.isActive,
            timestamp: currentTime,
          };

          // Add state-specific info
          if (session.currentState === GameState.LEVEL_SELECTION) {
            gameState.turnStartTimestamp = session.turnStartTimestamp;
            gameState.totalTurnDuration = session.totalTurnDuration;
            gameState.turnNumber = session.currentTurn;
          }

          ws.send(JSON.stringify(gameState));
          break;
        }

        case 'select_level': {
          const { gameCode, level } = data;
          const session = gameSessions.get(gameCode);

          if (!session) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid game code',
            }));
            return;
          }

          // Guard: Only valid in LEVEL_SELECTION state
          if (session.currentState !== GameState.LEVEL_SELECTION) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Level selection not allowed in current state',
            }));
            return;
          }

          // Guard: Check if timer has expired
          const currentTime = Date.now();
          const elapsedTime = currentTime - session.turnStartTimestamp!;
          if (elapsedTime >= session.totalTurnDuration) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Time has expired for level selection',
            }));
            return;
          }

          const playerState = session.playerStates.get(ws);
          if (!playerState) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Player not found',
            }));
            return;
          }

          // Guard: Check if already selected
          if (playerState.hasSelectedLevel) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Level already selected',
            }));
            return;
          }

          console.log(`Player ${playerState.playerId} selected level ${level} for game ${gameCode}`);

          // Get a random question from the selected level
          const levelQuestions = questionsData.questions.filter((q: any) => q.level === level);
          if (levelQuestions.length === 0) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'No questions available for this level',
            }));
            return;
          }

          const randomQuestion = levelQuestions[Math.floor(Math.random() * levelQuestions.length)];

          // Update player state
          playerState.hasSelectedLevel = true;
          playerState.selectedLevel = level;
          playerState.levelSelectionTimestamp = currentTime;
          playerState.assignedQuestion = randomQuestion;

          // Calculate remaining time
          const timeRemainingMs = Math.max(0, session.totalTurnDuration - elapsedTime);
          const timeRemaining = Math.ceil(timeRemainingMs / 1000);

          // Send question to the player
          ws.send(JSON.stringify({
            type: 'question_assigned',
            state: 'ANSWERING_QUESTION',
            question: randomQuestion,
            timeRemaining: timeRemaining,
            timestamp: currentTime
          }));

          console.log(`Sent question ${randomQuestion.id} (${level}) to player ${playerState.playerId} with ${timeRemaining}s remaining`);
          break;
        }

        case 'submit_answer': {
          const { gameCode, answerIndex } = data;
          const session = gameSessions.get(gameCode);

          if (!session) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid game code',
            }));
            return;
          }

          // Guard: Must have selected level first
          const playerState = session.playerStates.get(ws);
          if (!playerState || !playerState.hasSelectedLevel) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Must select level before submitting answer',
            }));
            return;
          }

          // Guard: Check if already submitted
          if (playerState.hasSubmittedAnswer) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Answer already submitted',
            }));
            return;
          }

          // Guard: Check if timer has expired
          const currentTime = Date.now();
          const elapsedTime = currentTime - session.turnStartTimestamp!;
          if (elapsedTime >= session.totalTurnDuration) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Time has expired',
            }));
            return;
          }

          // Update player state
          playerState.hasSubmittedAnswer = true;
          playerState.submittedAnswer = answerIndex;
          playerState.answerSubmissionTimestamp = currentTime;

          console.log(`Player ${playerState.playerId} submitted answer ${answerIndex} at ${elapsedTime}ms`);

          // Send acknowledgment
          ws.send(JSON.stringify({
            type: 'answer_submitted',
            timestamp: currentTime
          }));

          break;
        }

        case 'popup_continue': {
          const { gameCode } = data;
          const session = gameSessions.get(gameCode);

          if (!session) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid game code',
            }));
            return;
          }

          // Guard: Must be in SHOWING_POPUP state
          if (session.currentState !== GameState.SHOWING_POPUP) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Not in popup state',
            }));
            return;
          }

          console.log(`Popup continue signal received for game ${gameCode}, starting next turn`);

          // Transition to next turn
          transitionToLevelSelection(session);

          break;
        }

        case 'level_selection_timeout': {
          const { gameCode } = data;
          const session = gameSessions.get(gameCode);

          if (!session) {
            return;
          }

          console.log(`Level selection timeout for game ${gameCode}`);
          // Handle timeout - treat as not attempted
          break;
        }

        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type',
          }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    // Clean up player from sessions
    for (const [gameCode, session] of gameSessions.entries()) {
      // Don't remove players during active game (they might be reconnecting)
      // Only mark the WebSocket reference as stale
      if (session.isActive) {
        // Just clean up from playerStates map if present
        session.playerStates.delete(ws);
        console.log('Player WebSocket closed during active game (might reconnect)');
        continue;
      }

      // Remove from teamA if game not active
      const indexA = session.teamA.findIndex(p => p.ws === ws);
      if (indexA !== -1) {
        session.teamA.splice(indexA, 1);
        broadcastGameState(session);
        break;
      }

      // Remove from teamB if game not active
      const indexB = session.teamB.findIndex(p => p.ws === ws);
      if (indexB !== -1) {
        session.teamB.splice(indexB, 1);
        broadcastGameState(session);
        break;
      }

      // Check if host disconnected
      if (session.hostWs === ws) {
        session.hostWs = null;
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(WS_PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
});
