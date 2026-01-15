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

// Game session types
interface Player {
  id: string;
  name: string;
  ws: WebSocket;
  team: 'A' | 'B';
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
  levelSelectionTimer?: NodeJS.Timeout | null;
  questionTimer?: NodeJS.Timeout | null;
  questionTimerRemaining?: number;
  currentTurn?: number;
  playerLevelSelections?: Map<WebSocket, { level: string; question: any; answer?: number }>;
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

// Start turn phase with single 5 second timer (for level selection + question answering)
function startLevelSelectionPhase(session: GameSession) {
  console.log(`Starting level selection phase for game ${session.gameCode}`);
  
  // Clear any existing timers
  if (session.levelSelectionTimer) {
    clearInterval(session.levelSelectionTimer as any);
    session.levelSelectionTimer = null;
  }
  if (session.questionTimer) {
    clearInterval(session.questionTimer as any);
    session.questionTimer = null;
  }

  // Initialize player level selections map
  session.playerLevelSelections = new Map();
  
  let timeRemaining = 5; // Single timer for the entire turn
  session.questionTimerRemaining = timeRemaining;

  // Helper function to send timer updates to all players
  const sendTimerUpdate = () => {
    session.questionTimerRemaining = timeRemaining;
    console.log(`Sending timer update: ${timeRemaining}s to ${session.teamA.length + session.teamB.length} players`);
    [...session.teamA, ...session.teamB].forEach(player => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify({
          type: 'turn_timer',
          timeRemaining: timeRemaining,
        }));
      }
    });
  };

  // Send game state: level_selection to all players
  [...session.teamA, ...session.teamB].forEach(player => {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify({
        type: 'game_state',
        state: 'level_selection',
        gameCode: session.gameCode,
        timer: timeRemaining,
        scoreA: session.scoreA,
        scoreB: session.scoreB,
      }));
    }
  });
  
  // Send initial timer update immediately (so timer shows 5s right away)
  sendTimerUpdate();

  const turnTimerInterval = setInterval(() => {
    timeRemaining--;
    
    // Send timer update (including when it reaches 0)
    sendTimerUpdate();

    if (timeRemaining < 0) {
      clearInterval(turnTimerInterval);
      // Timer ended - calculate results and send game_state: result to all players
      [...session.teamA, ...session.teamB].forEach(player => {
        if (player.ws.readyState === WebSocket.OPEN) {
          const playerSelection = session.playerLevelSelections?.get(player.ws);
          let result = 'not_attempted';
          let points = 0;
          let correctAnswer = null;
          
          if (playerSelection && playerSelection.question) {
            // Player selected a level and got a question
            const question = playerSelection.question;
            const answer = playerSelection.answer;
            
            if (answer !== undefined && answer !== null) {
              // Check if answer is correct
              const isCorrect = answer === question.correctAnswer;
              points = question.points;
              correctAnswer = question.correctAnswer;
              
              // Update scores
              if (isCorrect) {
                result = 'correct';
                // Correct answer - points go to player's team
                if (player.team === 'A') {
                  session.scoreA += points;
                } else {
                  session.scoreB += points;
                }
              } else {
                result = 'incorrect';
                // Incorrect answer - points go to opposite team
                if (player.team === 'A') {
                  session.scoreB += points;
                } else {
                  session.scoreA += points;
                }
              }
            }
          }
          
          // Send game_state: result to player
          player.ws.send(JSON.stringify({
            type: 'game_state',
            state: 'result',
            result: result,
            points: result === 'correct' ? points : 0,
            correctAnswer: correctAnswer,
            scoreA: session.scoreA,
            scoreB: session.scoreB,
          }));
        }
      });
      
      session.levelSelectionTimer = null;
      session.questionTimer = null;
      
      // Wait 3 seconds before starting next turn (auto cycle)
      console.log(`Turn ended, waiting 3 seconds before starting next turn for game ${session.gameCode}`);
      setTimeout(() => {
        console.log(`Starting next turn for game ${session.gameCode}`);
        startLevelSelectionPhase(session);
      }, 3000);
    }
  }, 1000);

  session.levelSelectionTimer = turnTimerInterval as any;
  session.questionTimer = turnTimerInterval as any;
  session.questionTimerRemaining = timeRemaining;
}

// Question timer is now handled in startLevelSelectionPhase - no separate function needed

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

          // Check if game can be started
          if (session.teamA.length < 1 || session.teamB.length < 1) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Need at least 1 player in each team',
            }));
            return;
          }

          session.isActive = true;
          session.currentTurn = 1;
          
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

          // Start level selection phase with timer
          startLevelSelectionPhase(session);

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

          session.isActive = false;
          
          // Broadcast game ended to all clients
          const endMessage = {
            type: 'game_ended',
            gameCode: session.gameCode,
            finalScoreA: session.scoreA,
            finalScoreB: session.scoreB,
          };

          if (session.hostWs && session.hostWs.readyState === WebSocket.OPEN) {
            session.hostWs.send(JSON.stringify(endMessage));
          }

          [...session.teamA, ...session.teamB].forEach(player => {
            if (player.ws.readyState === WebSocket.OPEN) {
              player.ws.send(JSON.stringify(endMessage));
            }
          });

          console.log(`Game ${gameCode} ended`);
          break;
        }

        case 'get_game_state': {
          const { gameCode } = data;
          const session = gameSessions.get(gameCode);

          if (!session) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid game code',
            }));
            return;
          }

          // Send current game state
          const gameState = {
            type: 'game_state',
            gameCode: session.gameCode,
            teamA: session.teamA.map(p => ({ id: p.id, name: p.name })),
            teamB: session.teamB.map(p => ({ id: p.id, name: p.name })),
            scoreA: session.scoreA,
            scoreB: session.scoreB,
            isActive: session.isActive,
          };

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

          console.log(`Player selected level ${level} for game ${gameCode}`);
          
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
          
          // Store the selection
          if (!session.playerLevelSelections) {
            session.playerLevelSelections = new Map();
          }
          session.playerLevelSelections.set(ws, { level, question: randomQuestion });
          
          // Send question to the player with current timer remaining
          const currentTimer = session.questionTimerRemaining !== undefined ? session.questionTimerRemaining : 5;
          ws.send(JSON.stringify({
            type: 'question_received',
            question: randomQuestion,
            timer: currentTimer, // Use the synchronized timer
          }));
          
          console.log(`Sent question ${randomQuestion.id} (${level}) to player with timer ${currentTimer}`);
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

          // Store the answer
          const playerSelection = session.playerLevelSelections?.get(ws);
          if (playerSelection) {
            playerSelection.answer = answerIndex;
            console.log(`Player submitted answer ${answerIndex} for game ${gameCode}`);
          } else {
            console.warn(`Player tried to submit answer but no level selection found`);
          }
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
      // Remove from teamA
      const indexA = session.teamA.findIndex(p => p.ws === ws);
      if (indexA !== -1) {
        session.teamA.splice(indexA, 1);
        broadcastGameState(session);
        break;
      }

      // Remove from teamB
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
