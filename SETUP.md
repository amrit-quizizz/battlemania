# BattleMania Quiz Game - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Then choose your quiz mode:

#### Option A: Mock Mode (No API Key Needed - Quick Start)
Edit `.env` and set:
```env
QUIZ_MODE=mock
```

This uses pre-defined questions from `server/questions.json`. Perfect for development and testing.

#### Option B: AI Mode (Requires Claude API Key)
Edit `.env` and set:
```env
QUIZ_MODE=ai
ANTHROPIC_API_KEY=your_actual_api_key_here
```

To get a Claude API key:
1. Go to https://console.anthropic.com/settings/keys
2. Create a new API key
3. Copy and paste it into `.env`

### 3. Start the Application

Run both servers (in separate terminals or use the commands below):

```bash
# Terminal 1: Start the web app
npm run dev

# Terminal 2: Start the WebSocket server
npm run dev:server
```

Or run both at once:
```bash
npm run dev & npm run dev:server
```

### 4. Access the Application

- **Web App**: http://localhost:5173
- **WebSocket Server**: ws://localhost:3002

## How to Play

### Admin (Host)
1. Go to http://localhost:5173
2. Click "Start New Game"
3. Enter a quiz topic (or leave blank for default questions)
4. Share the game code with players
5. Wait for players to join (1 player per team minimum)
6. Click "Start Game" when ready

### Players
1. Go to http://localhost:5173
2. Click "Join Game"
3. Enter your name and the game code
4. You'll be assigned to Team A or Team B
5. Wait for host to start the game

### Gameplay
- Each turn has 15 seconds
- Players select difficulty: Low (50 pts), Medium (75 pts), Hard (100 pts)
- Selecting difficulty early gives more time to answer
- If time runs out during level selection, a random difficulty is assigned
- Answer the multiple-choice question
- Results shown after each turn
- Host can end the game anytime

## Quiz Modes

### Mock Mode (`QUIZ_MODE=mock`)
- Uses questions from `server/questions.json`
- No API key required
- 15 pre-defined questions (5 easy, 5 medium, 5 hard)
- Topic input is ignored
- **Best for**: Development, testing, demos

### AI Mode (`QUIZ_MODE=ai`)
- Generates custom questions using Claude AI
- Requires valid `ANTHROPIC_API_KEY`
- Creates 15 unique questions based on admin's topic
- Questions are specific to the topic (e.g., "Indian Geography", "JavaScript")
- **Best for**: Production, dynamic content

## Troubleshooting

### WebSocket Server Won't Start
```bash
# Check if port 3002 is in use
lsof -ti:3002

# Kill the process if needed
kill -9 $(lsof -ti:3002)
```

### "ANTHROPIC_API_KEY is not set" Warning
- If using AI mode, make sure `.env` has your API key
- Or switch to mock mode: `QUIZ_MODE=mock`

### Quiz Generation Fails in AI Mode
- Verify your API key is correct
- Check you have available credits at https://console.anthropic.com
- System will automatically fall back to default questions on error

### Players Can't Join Game
- Ensure WebSocket server is running on port 3002
- Check game code is correct (6 characters, case-sensitive)
- Refresh the page and try again

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `QUIZ_MODE` | No | `mock` | Quiz generation mode: `mock` or `ai` |
| `ANTHROPIC_API_KEY` | Only for AI mode | - | Claude API key from Anthropic |
| `PORT` | No | `3001` | HTTP server port (not currently used) |
| `WS_PORT` | No | `3002` | WebSocket server port |

## Project Structure

```
battlemania/
├── src/                    # React frontend
│   ├── quiz/              # Quiz game components
│   │   ├── StartGame.tsx  # Admin game creation
│   │   ├── JoinGame.tsx   # Player join screen
│   │   ├── QuizGame.tsx   # Admin game view
│   │   └── PlayerGame.tsx # Player game view
│   └── ...
├── server/                 # Node.js backend
│   ├── index.ts           # WebSocket server
│   ├── quizGenerator.ts   # AI quiz generation
│   └── questions.json     # Default questions (mock mode)
├── .env.example           # Example environment config
└── .env                   # Your local config (not in git)
```

## Development Tips

### Adding Custom Questions (Mock Mode)
Edit `server/questions.json`:
```json
{
  "questions": [
    {
      "id": 1,
      "difficulty": "low",
      "question": "Your question here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 2
    }
  ]
}
```

### Switching Between Modes
Just update `.env` and restart the server:
```bash
# Switch to AI mode
echo "QUIZ_MODE=ai" > .env

# Switch to mock mode
echo "QUIZ_MODE=mock" > .env

# Restart server
npm run dev:server
```

### Testing AI Quiz Generation
1. Set `QUIZ_MODE=ai` with valid API key
2. Start servers
3. Create a game with a specific topic (e.g., "World War 2")
4. Check server logs for `[AI MODE] Generating AI quiz for topic: ...`
5. Questions should be relevant to your topic

## Contributing

When contributing:
1. **Never commit `.env`** - it's in `.gitignore`
2. Update `.env.example` if adding new environment variables
3. Test both mock and AI modes before submitting PR
4. Include setup instructions for new features

## License

[Your License Here]
