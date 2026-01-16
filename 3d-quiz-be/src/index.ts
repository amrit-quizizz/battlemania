import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Types
interface Question {
  id: number;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizResponse {
  topic: string;
  subject: string;
  gradeLevel: string;
  totalQuestions: number;
  questions: Question[];
}

interface GenerateQuizRequest {
  subject: string;
  gradeLevel: string;
  numberOfQuestions: number;
  topic: string;
  additionalDetails?: string;
}

interface Player {
  id: string;
  name: string;
  visitorId?: string;
  score: number;
  ws: WebSocket;
}

interface GameRoom {
  code: string;
  hostWs: WebSocket | null;
  players: Map<string, Player>;
  teamA: string[]; // player ids
  teamB: string[]; // player ids
  questions: Question[];
  quizMeta: {
    subject: string;
    gradeLevel: string;
    topic: string;
    totalQuestions: number;
  };
  status: 'waiting' | 'playing' | 'finished';
  currentQuestionIndex: number;
  createdAt: Date;
  // Battle mode additions
  teamAHealth: number;
  teamBHealth: number;
  usedQuestionIds: Set<number>; // Track which questions have been used
  playerCurrentQuestion: Map<string, number>; // playerId -> questionId currently answering
}

// Room storage
const rooms = new Map<string, GameRoom>();

// Generate unique 4-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, 1, I
  let code: string;
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms.has(code));
  return code;
}

// Claude client
function getClaudeClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// Build system prompt based on inputs
function buildSystemPrompt(questionsPerDifficulty: number): string {
  const totalQuestions = questionsPerDifficulty * 3;

  return `You are an expert educational content creator.

Your task is to generate a multiple choice quiz based on the given subject, grade level, topic, and any additional instructions.

Rules:
1. Generate exactly ${totalQuestions} questions (${questionsPerDifficulty} per difficulty level).
2. Divide questions into 3 difficulty levels:
   - easy: ${questionsPerDifficulty} questions (basic facts, definitions, simple recall)
   - medium: ${questionsPerDifficulty} questions (explanations, comparisons, application)
   - hard: ${questionsPerDifficulty} questions (analysis, reasoning, complex problem-solving)
3. Each question MUST have:
   - id (number from 1-${totalQuestions})
   - difficulty ("easy" | "medium" | "hard")
   - question (string - the question text)
   - options (array of exactly 4 strings - the answer choices)
   - correctAnswer (number 0-3 - index of the correct option)
4. Make sure:
   - Questions are appropriate for the specified grade level
   - All 4 options are plausible
   - Only ONE option is correct
   - Options are randomized (correct answer not always in same position)
   - Questions are clear and unambiguous
5. You MUST respond ONLY with valid JSON in the following format (no markdown, no extra text):

{
  "topic": "<topic>",
  "subject": "<subject>",
  "gradeLevel": "<gradeLevel>",
  "totalQuestions": ${totalQuestions},
  "questions": [
    {
      "id": 1,
      "difficulty": "easy",
      "question": "What is...?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 2
    }
  ]
}`;
}

// Generate quiz using Claude
async function generateQuiz(params: GenerateQuizRequest): Promise<QuizResponse> {
  const client = getClaudeClient();
  const questionsPerDifficulty = params.numberOfQuestions;

  let userPrompt = `Generate a quiz with the following parameters:
- Subject: ${params.subject}
- Grade Level: ${params.gradeLevel}
- Topic: ${params.topic}
- Questions per difficulty level: ${questionsPerDifficulty} (Total: ${questionsPerDifficulty * 3} questions)`;

  if (params.additionalDetails) {
    userPrompt += `\n- Additional Instructions: ${params.additionalDetails}`;
  }

  userPrompt += `\n\nRemember: Respond ONLY with the JSON object, no markdown formatting, no explanations.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    temperature: 0.4,
    system: buildSystemPrompt(questionsPerDifficulty),
    messages: [{ role: 'user', content: userPrompt }]
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Expected text response from Claude');
  }

  let jsonText = content.text.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  return JSON.parse(jsonText);
}

// Validate quiz response
function validateQuiz(quiz: QuizResponse, expectedPerDifficulty: number): boolean {
  const expectedTotal = expectedPerDifficulty * 3;
  const questions = quiz.questions || [];

  if (questions.length !== expectedTotal) {
    console.log(`Validation failed: Expected ${expectedTotal} questions, got ${questions.length}`);
    return false;
  }

  const counts: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
  for (const q of questions) {
    counts[q.difficulty] = (counts[q.difficulty] || 0) + 1;

    if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) {
      console.log(`Validation failed: Question ${q.id} has invalid structure`);
      return false;
    }

    if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
      console.log(`Validation failed: Question ${q.id} has invalid correctAnswer`);
      return false;
    }
  }

  if (counts.easy !== expectedPerDifficulty || counts.medium !== expectedPerDifficulty || counts.hard !== expectedPerDifficulty) {
    console.log(`Validation failed: Expected ${expectedPerDifficulty} per difficulty`);
    return false;
  }

  return true;
}

// Generate with retry
async function generateQuizWithRetry(params: GenerateQuizRequest, retries = 2): Promise<QuizResponse> {
  for (let i = 0; i < retries; i++) {
    try {
      const quiz = await generateQuiz(params);
      if (validateQuiz(quiz, params.numberOfQuestions)) {
        return quiz;
      }
      console.log(`Quiz validation failed on attempt ${i + 1}, retrying...`);
    } catch (error) {
      console.error(`Quiz generation attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
    }
  }
  throw new Error('Quiz generation failed after retries');
}

// ============ REST API ============

// Generate quiz and create room
app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { subject, gradeLevel, numberOfQuestions = 10, topic, additionalDetails } = req.body as GenerateQuizRequest;

    if (!subject || !gradeLevel || !topic) {
      return res.status(400).json({
        error: 'Missing required fields: subject, gradeLevel, and topic are required'
      });
    }

    if (numberOfQuestions < 1 || numberOfQuestions > 20) {
      return res.status(400).json({
        error: 'numberOfQuestions must be between 1 and 20'
      });
    }

    console.log(`Generating quiz: ${subject} - ${topic} for ${gradeLevel} (${numberOfQuestions * 3} questions)`);

    const quiz = await generateQuizWithRetry({
      subject,
      gradeLevel,
      numberOfQuestions,
      topic,
      additionalDetails
    });

    // Create room with generated quiz
    const roomCode = generateRoomCode();
    const room: GameRoom = {
      code: roomCode,
      hostWs: null,
      players: new Map(),
      teamA: [],
      teamB: [],
      questions: quiz.questions,
      quizMeta: {
        subject: quiz.subject,
        gradeLevel: quiz.gradeLevel,
        topic: quiz.topic,
        totalQuestions: quiz.totalQuestions,
      },
      status: 'waiting',
      currentQuestionIndex: 0,
      createdAt: new Date(),
      // Battle mode - health starts at 100 for each team
      teamAHealth: 100,
      teamBHealth: 100,
      usedQuestionIds: new Set(),
      playerCurrentQuestion: new Map(),
    };
    rooms.set(roomCode, room);

    console.log(`Room created: ${roomCode}`);

    res.json({
      ...quiz,
      roomCode,
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({
      error: 'Failed to generate quiz',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get room info (for checking if room exists)
app.get('/api/room/:code', (req, res) => {
  const room = rooms.get(req.params.code.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json({
    code: room.code,
    status: room.status,
    quizMeta: room.quizMeta,
    playerCount: room.players.size,
    teamA: room.teamA.map(id => {
      const p = room.players.get(id);
      return p ? { id: p.id, name: p.name } : null;
    }).filter(Boolean),
    teamB: room.teamB.map(id => {
      const p = room.players.get(id);
      return p ? { id: p.id, name: p.name } : null;
    }).filter(Boolean),
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

// ============ WebSocket Server ============

const server = http.createServer(app);
const wss = new WebSocketServer({ 
  server,
  // Allow connections from any origin (development)
  verifyClient: (info) => {
    console.log('WebSocket connection attempt from origin:', info.origin);
    return true; // Accept all connections in development
  }
});

function broadcastToRoom(room: GameRoom, message: object, excludeWs?: WebSocket) {
  const data = JSON.stringify(message);

  // Send to host
  if (room.hostWs && room.hostWs !== excludeWs && room.hostWs.readyState === WebSocket.OPEN) {
    room.hostWs.send(data);
  }

  // Send to all players
  room.players.forEach((player) => {
    if (player.ws !== excludeWs && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(data);
    }
  });
}

function getTeamsList(room: GameRoom) {
  return {
    teamA: room.teamA.map(id => {
      const p = room.players.get(id);
      return p ? { id: p.id, name: p.name, score: p.score } : null;
    }).filter(Boolean),
    teamB: room.teamB.map(id => {
      const p = room.players.get(id);
      return p ? { id: p.id, name: p.name, score: p.score } : null;
    }).filter(Boolean),
  };
}

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection from:', req.socket.remoteAddress);
  console.log('Request headers:', req.headers);

  let currentRoom: GameRoom | null = null;
  let playerId: string | null = null;
  let isHost = false;
  
  // Send ping to keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 30000); // Ping every 30 seconds

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message:', message.type, 'from:', playerId || 'new connection');
      console.log('Message details:', JSON.stringify(message, null, 2));

      switch (message.type) {
        // Teacher joins as host
        case 'host_join': {
          const room = rooms.get(message.roomCode?.toUpperCase());
          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
            return;
          }

          room.hostWs = ws;
          currentRoom = room;
          isHost = true;

          ws.send(JSON.stringify({
            type: 'host_joined',
            roomCode: room.code,
            quizMeta: room.quizMeta,
            teamAHealth: room.teamAHealth,
            teamBHealth: room.teamBHealth,
            ...getTeamsList(room),
          }));
          break;
        }

        // Student joins room
        case 'player_join': {
          const room = rooms.get(message.roomCode?.toUpperCase());
          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
            return;
          }

          if (room.status === 'finished') {
            ws.send(JSON.stringify({ type: 'error', message: 'Game has ended' }));
            return;
          }

          // Check if this is a reconnection (player with same ID trying to reconnect)
          let existingPlayer: Player | undefined;
          if (message.playerId) {
            existingPlayer = room.players.get(message.playerId);
          }

          let id: string;
          let player: Player;
          let team: 'A' | 'B';

          if (existingPlayer) {
            // Reconnection - update WebSocket reference
            id = existingPlayer.id;
            existingPlayer.ws = ws;
            player = existingPlayer;
            team = room.teamA.includes(id) ? 'A' : 'B';
          } else if (room.status === 'playing') {
            // New player trying to join during game - don't allow
            ws.send(JSON.stringify({ type: 'error', message: 'Game already started' }));
            return;
          } else {
            // New player joining in waiting state
            id = Math.random().toString(36).substr(2, 9);
            player = {
              id,
              name: message.name || `Player ${room.players.size + 1}`,
              visitorId: message.visitorId,
              score: 0,
              ws,
            };

            room.players.set(id, player);

            // Auto-assign to team with fewer players
            if (room.teamA.length <= room.teamB.length) {
              room.teamA.push(id);
              team = 'A';
            } else {
              room.teamB.push(id);
              team = 'B';
            }
          }

          currentRoom = room;
          playerId = id;

          ws.send(JSON.stringify({
            type: 'player_joined',
            playerId: id,
            team,
            roomCode: room.code,
            quizMeta: room.quizMeta,
            teamAHealth: room.teamAHealth,
            teamBHealth: room.teamBHealth,
            gameStatus: room.status,
          }));

          // If game is already playing, send game_started so player knows to show level selection
          if (room.status === 'playing') {
            ws.send(JSON.stringify({
              type: 'game_started',
              totalQuestions: room.questions.length,
              teamAHealth: room.teamAHealth,
              teamBHealth: room.teamBHealth,
            }));
          }

          // Broadcast updated player list
          broadcastToRoom(room, {
            type: 'room_update',
            ...getTeamsList(room),
          });
          break;
        }

        // Host starts the game
        case 'start_game': {
          if (!currentRoom || !isHost) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authorized' }));
            return;
          }

          if (currentRoom.players.size < 1) {
            ws.send(JSON.stringify({ type: 'error', message: 'Need at least 1 player to start' }));
            return;
          }

          currentRoom.status = 'playing';
          currentRoom.currentQuestionIndex = 0;

          // Broadcast game started - players will now select difficulty levels
          broadcastToRoom(currentRoom, {
            type: 'game_started',
            totalQuestions: currentRoom.questions.length,
            teamAHealth: currentRoom.teamAHealth,
            teamBHealth: currentRoom.teamBHealth,
          });
          // Don't send first question automatically - players will select difficulty
          break;
        }

        // Player selects difficulty level - get a random question from that difficulty
        case 'select_level': {
          if (!currentRoom || !playerId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not in a room' }));
            return;
          }

          if (currentRoom.status !== 'playing') {
            ws.send(JSON.stringify({ type: 'error', message: 'Game not started' }));
            return;
          }

          const difficulty = message.difficulty as 'easy' | 'medium' | 'hard';
          if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid difficulty' }));
            return;
          }

          // Find available questions of this difficulty
          const availableQuestions = currentRoom.questions.filter(
            q => q.difficulty === difficulty && !currentRoom.usedQuestionIds.has(q.id)
          );

          if (availableQuestions.length === 0) {
            // No more questions of this difficulty - use any available
            const anyAvailable = currentRoom.questions.filter(
              q => !currentRoom.usedQuestionIds.has(q.id)
            );
            
            if (anyAvailable.length === 0) {
              // No questions left - end game
              currentRoom.status = 'finished';
              const winner = currentRoom.teamAHealth > currentRoom.teamBHealth ? 'A' : 
                            currentRoom.teamBHealth > currentRoom.teamAHealth ? 'B' : 'draw';
              
              broadcastToRoom(currentRoom, {
                type: 'game_finished',
                winner,
                teamAHealth: currentRoom.teamAHealth,
                teamBHealth: currentRoom.teamBHealth,
                ...getTeamsList(currentRoom),
              });
              return;
            }
            
            // Pick a random available question
            const randomQuestion = anyAvailable[Math.floor(Math.random() * anyAvailable.length)];
            currentRoom.usedQuestionIds.add(randomQuestion.id);
            currentRoom.playerCurrentQuestion.set(playerId, randomQuestion.id);
            
            ws.send(JSON.stringify({
              type: 'question',
              questionIndex: randomQuestion.id,
              question: randomQuestion.question,
              options: randomQuestion.options,
              difficulty: randomQuestion.difficulty,
              totalQuestions: currentRoom.questions.length,
            }));
            return;
          }

          // Pick a random question from available ones
          const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
          currentRoom.usedQuestionIds.add(randomQuestion.id);
          currentRoom.playerCurrentQuestion.set(playerId, randomQuestion.id);

          ws.send(JSON.stringify({
            type: 'question',
            questionIndex: randomQuestion.id,
            question: randomQuestion.question,
            options: randomQuestion.options,
            difficulty: randomQuestion.difficulty,
            totalQuestions: currentRoom.questions.length,
          }));
          break;
        }

        // Player submits answer
        case 'submit_answer': {
          if (!currentRoom || !playerId) return;

          const player = currentRoom.players.get(playerId);
          if (!player) return;

          // Get the question the player is answering
          const questionId = currentRoom.playerCurrentQuestion.get(playerId);
          if (!questionId) return;

          const question = currentRoom.questions.find(q => q.id === questionId);
          if (!question) return;

          // Clear the current question
          currentRoom.playerCurrentQuestion.delete(playerId);

          const isCorrect = message.answer === question.correctAnswer;
          const damage = question.difficulty === 'easy' ? 10 : question.difficulty === 'medium' ? 20 : 30;
          
          if (isCorrect) {
            // Award points to player
            player.score += damage;
            
            // Determine which team to damage (enemy team)
            const playerTeam = currentRoom.teamA.includes(playerId) ? 'A' : 'B';
            const enemyTeam = playerTeam === 'A' ? 'B' : 'A';
            
            // Apply damage to enemy team
            if (enemyTeam === 'A') {
              currentRoom.teamAHealth = Math.max(0, currentRoom.teamAHealth - damage);
            } else {
              currentRoom.teamBHealth = Math.max(0, currentRoom.teamBHealth - damage);
            }

            // Send fire_ammunition event to host
            if (currentRoom.hostWs && currentRoom.hostWs.readyState === WebSocket.OPEN) {
              currentRoom.hostWs.send(JSON.stringify({
                type: 'fire_ammunition',
                fromTeam: playerTeam,
                toTeam: enemyTeam,
                damage,
                playerName: player.name,
                difficulty: question.difficulty,
                teamAHealth: currentRoom.teamAHealth,
                teamBHealth: currentRoom.teamBHealth,
              }));
            }

            // Broadcast health update to all
            broadcastToRoom(currentRoom, {
              type: 'health_update',
              teamAHealth: currentRoom.teamAHealth,
              teamBHealth: currentRoom.teamBHealth,
            });
          }

          // Send result to player
          ws.send(JSON.stringify({
            type: 'answer_result',
            correct: isCorrect,
            correctAnswer: question.correctAnswer,
            score: player.score,
            damage: isCorrect ? damage : 0,
            teamAHealth: currentRoom.teamAHealth,
            teamBHealth: currentRoom.teamBHealth,
          }));

          // Broadcast updated scores
          broadcastToRoom(currentRoom, {
            type: 'scores_update',
            ...getTeamsList(currentRoom),
          });

          // Check if game should end (a team's health reached 0)
          if (currentRoom.teamAHealth <= 0 || currentRoom.teamBHealth <= 0) {
            currentRoom.status = 'finished';
            const winner = currentRoom.teamAHealth <= 0 ? 'B' : 'A';
            
            broadcastToRoom(currentRoom, {
              type: 'game_finished',
              winner,
              teamAHealth: currentRoom.teamAHealth,
              teamBHealth: currentRoom.teamBHealth,
              ...getTeamsList(currentRoom),
            });
          }
          break;
        }

        // Host advances to next question (legacy - kept for compatibility)
        case 'next_question': {
          if (!currentRoom || !isHost) return;

          currentRoom.currentQuestionIndex++;

          if (currentRoom.currentQuestionIndex >= currentRoom.questions.length) {
            currentRoom.status = 'finished';
            const winner = currentRoom.teamAHealth > currentRoom.teamBHealth ? 'A' : 
                          currentRoom.teamBHealth > currentRoom.teamAHealth ? 'B' : 'draw';
            
            broadcastToRoom(currentRoom, {
              type: 'game_finished',
              winner,
              teamAHealth: currentRoom.teamAHealth,
              teamBHealth: currentRoom.teamBHealth,
              ...getTeamsList(currentRoom),
            });
            return;
          }

          const nextQuestion = currentRoom.questions[currentRoom.currentQuestionIndex];
          broadcastToRoom(currentRoom, {
            type: 'question',
            questionIndex: currentRoom.currentQuestionIndex,
            question: nextQuestion.question,
            options: nextQuestion.options,
            difficulty: nextQuestion.difficulty,
            totalQuestions: currentRoom.questions.length,
          });
          break;
        }

        // Host ends the game manually
        case 'end_game': {
          if (!currentRoom || !isHost) return;

          currentRoom.status = 'finished';
          const winner = currentRoom.teamAHealth > currentRoom.teamBHealth ? 'A' : 
                        currentRoom.teamBHealth > currentRoom.teamAHealth ? 'B' : 'draw';
          
          broadcastToRoom(currentRoom, {
            type: 'game_finished',
            winner,
            teamAHealth: currentRoom.teamAHealth,
            teamBHealth: currentRoom.teamBHealth,
            ...getTeamsList(currentRoom),
          });
          break;
        }
      }
    } catch (err) {
      console.error('Error processing message:', err);
      console.error('Raw data:', data.toString());
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format: ' + (err instanceof Error ? err.message : 'Unknown error')
      }));
    }
  });

  ws.on('pong', () => {
    // Connection is alive
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', (code, reason) => {
    console.log(`WebSocket disconnected - code: ${code}, reason: ${reason}`);
    
    // Clear ping interval
    clearInterval(pingInterval);

    if (currentRoom && playerId) {
      // Don't remove player immediately - allow reconnection
      // Just set WebSocket to null so they can reconnect later
      const player = currentRoom.players.get(playerId);
      if (player) {
        // Mark player as disconnected but keep them in the game
        console.log(`Player ${player.name} (${playerId}) disconnected but kept in game`);
        // We can reconnect them when they send player_join with same playerId
      }
      
      // Only broadcast room update, don't remove from teams
      // This allows the player to reconnect
    }

    if (currentRoom && isHost) {
      currentRoom.hostWs = null;
      console.log('Host disconnected');
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  Quiz API + WebSocket Server Running      ║
╠════════════════════════════════════════════╣
║  HTTP API: http://localhost:${PORT}        ║
║  WebSocket: ws://localhost:${PORT}         ║
║  Health: http://localhost:${PORT}/health   ║
╚════════════════════════════════════════════╝
  `);
  console.log('Waiting for connections...\n');
});
