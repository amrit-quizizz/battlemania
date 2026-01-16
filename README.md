# 🎮 BattleMania Quiz Game

A real-time multiplayer quiz game with AI-powered question generation. Teams compete by answering questions of varying difficulty levels for points.

## ✨ Features

- **Real-time Multiplayer**: WebSocket-based gameplay with instant updates
- **Team-Based Competition**: Two teams battle for the highest score
- **Dynamic Difficulty**: Players choose between Easy (50pts), Medium (75pts), and Hard (100pts) questions
- **AI-Powered Questions**: Claude AI generates custom quiz questions on any topic
- **Mock Mode**: Pre-defined questions for testing without API costs
- **Battle Theme**: Engaging military/battle-inspired UI design
- **Admin Controls**: Host can manage games, view scores, and end games
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/amrit-quizizz/battlemania.git
cd battlemania

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and configure QUIZ_MODE (mock or ai)

# Start the servers
npm run dev          # Web app on http://localhost:5173
npm run dev:server   # WebSocket server on ws://localhost:3002
```

📖 **For detailed setup instructions, see [SETUP.md](./SETUP.md)**

## 🎯 How to Play

### Admin (Host)
1. Navigate to the home screen
2. Click "Start New Game"
3. Enter a quiz topic (or leave blank for default)
4. Share the 6-character game code with players
5. Wait for players to join (minimum 1 per team)
6. Click "Start Game" to begin

### Players
1. Click "Join Game" from home screen
2. Enter your name and the game code
3. Get assigned to Team A or Team B
4. Select difficulty level when your turn starts
5. Answer the question before time runs out
6. Watch scores update after each round

### Game Rules
- **15-second timer** for each turn (shared between level selection and answering)
- **Early selection** = more time to answer the question
- **No selection** = random difficulty assigned
- **Points**: Easy (50), Medium (75), Hard (100)
- **Winner**: Team with highest score when host ends game

## 🤖 Quiz Modes

### Mock Mode (Default)
```env
QUIZ_MODE=mock
```
- Uses pre-defined questions from `server/questions.json`
- No API key required
- Perfect for development and testing
- Topic input is ignored

### AI Mode
```env
QUIZ_MODE=ai
ANTHROPIC_API_KEY=sk-ant-api03-...
```
- Generates custom questions using Claude AI
- Requires Anthropic API key
- Creates topic-specific questions
- 5 questions per difficulty level

[Get your Claude API key →](https://console.anthropic.com/settings/keys)

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Node.js, WebSocket (ws)
- **AI**: Anthropic Claude API (Sonnet 4)
- **Styling**: CSS with battle-themed design

## 📁 Project Structure

```
battlemania/
├── src/
│   ├── quiz/
│   │   ├── StartGame.tsx    # Admin game creation
│   │   ├── JoinGame.tsx     # Player join screen
│   │   ├── QuizGame.tsx     # Admin game view
│   │   └── PlayerGame.tsx   # Player game view
│   └── App.tsx
├── server/
│   ├── index.ts             # WebSocket server & game logic
│   ├── quizGenerator.ts     # AI quiz generation
│   └── questions.json       # Default questions (mock mode)
├── .env.example             # Environment template
├── SETUP.md                 # Detailed setup guide
└── package.json
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `QUIZ_MODE` | No | `mock` | `mock` or `ai` |
| `ANTHROPIC_API_KEY` | For AI mode | - | Claude API key |
| `WS_PORT` | No | `3002` | WebSocket server port |

### Customizing Questions (Mock Mode)

Edit `server/questions.json`:
```json
{
  "questions": [
    {
      "id": 1,
      "difficulty": "low",
      "question": "What is 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": 1
    }
  ]
}
```

## 🐛 Troubleshooting

**WebSocket connection fails**
```bash
# Check if server is running
lsof -ti:3002

# Restart the server
npm run dev:server
```

**AI mode not working**
- Verify `ANTHROPIC_API_KEY` in `.env`
- Check API credits at https://console.anthropic.com
- System falls back to mock mode on error

**Players can't join**
- Confirm WebSocket server is running on port 3002
- Check game code is correct (case-sensitive)
- Try refreshing the page

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test both mock and AI modes
5. Commit: `git commit -m "Add my feature"`
6. Push: `git push origin feature/my-feature`
7. Open a Pull Request

**Important**: Never commit `.env` files with API keys!

## 📜 License

MIT License - see LICENSE file for details

## 🙋 Support

For issues and questions:
- Create an issue on GitHub
- Check [SETUP.md](./SETUP.md) for detailed documentation

## 🎨 Credits

Built with ⚡ using React, TypeScript, and Claude AI
