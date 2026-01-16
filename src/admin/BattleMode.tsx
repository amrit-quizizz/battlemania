import { useState, useEffect, useRef, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas, useThree } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { PerspectiveCamera } from '@react-three/drei'
import { Icon } from '@iconify/react'
import * as THREE from 'three'
import { useToast } from '../components/Toast'
import useGameStore from '../3d-game/store/gameStore'
import {
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  FONT_FAMILY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  ICON_SIZES,
  COMPONENT_SIZES,
  ASSETS,
  INPUT_COLORS,
  SUBJECTS,
  GRADE_LEVELS,
} from '../config/design'
import CleanBattleScene from '../3d-game/components/CleanBattleScene'
import { ScoreCard3D } from '../3d-game/components/ScoreCard3D'
import { HealthBarOverlay } from '../3d-game/components/HealthBarOverlay'
import { 
  cameraConfig, 
  environmentConfig, 
  physicsConfig, 
  uiConfig, 
  playerConfig 
} from '../3d-game/config/gameConfig'
import { resetHealth } from '../3d-game/utils/healthDamageSystem'

// API URL (WebSocket is on same port)
const API_URL = import.meta.env.VITE_QUIZ_API_URL || 'http://localhost:3001'
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'

interface Question {
  id: number
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  options: string[]
  correctAnswer: number
}

interface QuizResponse {
  topic: string
  subject: string
  gradeLevel: string
  totalQuestions: number
  questions: Question[]
  roomCode: string
}

interface Player {
  id: string
  name: string
  score?: number
}

interface FireEvent {
  fromTeam: 'A' | 'B'
  toTeam: 'A' | 'B'
  damage: number
  playerName: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface GameResult {
  winner: 'A' | 'B' | 'draw'
  teamAHealth: number
  teamBHealth: number
  teamA: Player[]
  teamB: Player[]
}

type ViewState = 'form' | 'creating' | 'lobby' | 'battle' | 'results'

// Component to set scene background color
function SceneBackground() {
  const { scene } = useThree()
  useEffect(() => {
    scene.background = new THREE.Color(environmentConfig.sky.primaryColor)
  }, [scene])
  return null
}

export default function BattleMode() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  // View state - now includes 'battle' and 'results'
  const [viewState, setViewState] = useState<ViewState>('form')
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Function to sync backend health to 3D scene
  const syncHealthTo3D = (teamAHealth: number, teamBHealth: number) => {
    const store = useGameStore.getState()
    // Calculate damage needed to reach target health
    const player1Damage = store.player1.health - teamAHealth
    const player2Damage = store.player2.health - teamBHealth
    
    // Apply damage if health decreased
    if (player1Damage > 0) {
      store.damagePlayer('player1', player1Damage)
    }
    if (player2Damage > 0) {
      store.damagePlayer('player2', player2Damage)
    }
  }
  
  // Form state
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [numberOfQuestions, setNumberOfQuestions] = useState('10')
  const [additionalDetails, setAdditionalDetails] = useState('')
  
  // Game state
  const [gameCode, setGameCode] = useState<string | null>(null)
  const [teamA, setTeamA] = useState<Player[]>([])
  const [teamB, setTeamB] = useState<Player[]>([])
  const [teamAHealth, setTeamAHealth] = useState(100)
  const [teamBHealth, setTeamBHealth] = useState(100)
  const [isConnecting, setIsConnecting] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([])
  const [generationStatus, setGenerationStatus] = useState<string>('')
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting')
  const [fireEvents, setFireEvents] = useState<FireEvent[]>([])
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [showControls, setShowControls] = useState(true)
  
  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null)

  // Initialize 3D health system when entering battle view
  useEffect(() => {
    if (viewState === 'battle') {
      resetHealth()
    }
  }, [viewState])

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Admin page unmounting')
      }
    }
  }, [])

  // Connect to WebSocket as host
  const connectAsHost = (roomCode: string) => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.close()
        showToast('Connection timeout. Make sure the server is running.', 'error')
      }
    }, 5000)

    ws.onopen = () => {
      clearTimeout(connectionTimeout)
      console.log('WebSocket connected - joining as host:', roomCode)
      ws.send(JSON.stringify({
        type: 'host_join',
        roomCode,
      }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('WS message:', data.type)

        switch (data.type) {
          case 'host_joined':
            setTeamA(data.teamA || [])
            setTeamB(data.teamB || [])
            setTeamAHealth(data.teamAHealth ?? 100)
            setTeamBHealth(data.teamBHealth ?? 100)
            break

          case 'room_update':
            setTeamA(data.teamA || [])
            setTeamB(data.teamB || [])
            break

          case 'game_started':
            setGameStatus('playing')
            const startTeamAHealth = data.teamAHealth ?? 100
            const startTeamBHealth = data.teamBHealth ?? 100
            setTeamAHealth(startTeamAHealth)
            setTeamBHealth(startTeamBHealth)
            // Sync 3D health at game start
            syncHealthTo3D(startTeamAHealth, startTeamBHealth)
            showToast('Battle started! Students can now answer questions.', 'success')
            break

          case 'fire_ammunition':
            const fireEvent: FireEvent = {
              fromTeam: data.fromTeam,
              toTeam: data.toTeam,
              damage: data.damage,
              playerName: data.playerName,
              difficulty: data.difficulty,
            }
            setFireEvents(prev => [...prev, fireEvent])
            
            // Update health state
            const newTeamAHealth = data.teamAHealth
            const newTeamBHealth = data.teamBHealth
            setTeamAHealth(newTeamAHealth)
            setTeamBHealth(newTeamBHealth)
            
            // Sync 3D health system
            syncHealthTo3D(newTeamAHealth, newTeamBHealth)
            
            // Trigger appropriate animation based on difficulty
            const attackingPlayer = data.fromTeam === 'A' ? 'player1' : 'player2'
            if (data.difficulty === 'hard') {
              // Hard difficulty = turret missile
              window.dispatchEvent(new CustomEvent('battle:fireTurret', { 
                detail: { player: attackingPlayer } 
              }))
            } else {
              // Easy/Medium difficulty = tank bullet
              window.dispatchEvent(new CustomEvent('battle:fireTank', { 
                detail: { player: attackingPlayer } 
              }))
            }
            
            showToast(
              `${data.playerName} hit Team ${data.toTeam} for ${data.damage} damage!`,
              'success'
            )
            
            setTimeout(() => {
              setFireEvents(prev => prev.filter(e => e !== fireEvent))
            }, 2000)
            break

          case 'health_update':
            const updatedTeamAHealth = data.teamAHealth
            const updatedTeamBHealth = data.teamBHealth
            setTeamAHealth(updatedTeamAHealth)
            setTeamBHealth(updatedTeamBHealth)
            // Sync 3D health on health update
            syncHealthTo3D(updatedTeamAHealth, updatedTeamBHealth)
            break

          case 'scores_update':
            setTeamA(data.teamA || [])
            setTeamB(data.teamB || [])
            break

          case 'game_finished':
            setGameStatus('finished')
            setGameResult({
              winner: data.winner,
              teamAHealth: data.teamAHealth,
              teamBHealth: data.teamBHealth,
              teamA: data.teamA || [],
              teamB: data.teamB || [],
            })
            setViewState('results')
            break

          case 'error':
            showToast(data.message, 'error')
            break
        }
      } catch (err) {
        console.error('Error parsing message:', err)
      }
    }

    ws.onerror = (error) => {
      clearTimeout(connectionTimeout)
      console.error('WebSocket error:', error)
      showToast('Failed to connect to game server.', 'error')
    }

    ws.onclose = (event) => {
      clearTimeout(connectionTimeout)
      console.log(`WebSocket closed - Code: ${event.code}, Reason: ${event.reason}`)
    }
  }

  const handleCreateQuiz = async () => {
    if (!subject || !topic || !gradeLevel) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    setIsAnimating(true)
    setViewState('creating')
    setIsConnecting(true)
    setGenerationStatus('Generating quiz questions with AI...')

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    try {
      const quizResponse = await fetch(`${API_URL}/api/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          gradeLevel,
          numberOfQuestions: parseInt(numberOfQuestions),
          topic,
          additionalDetails: additionalDetails || undefined,
        }),
      })

      if (!quizResponse.ok) {
        const errorData = await quizResponse.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to generate quiz')
      }

      const quizData: QuizResponse = await quizResponse.json()
      setGeneratedQuestions(quizData.questions)
      setGameCode(quizData.roomCode)
      setGenerationStatus('')
      setIsConnecting(false)

      // Move to lobby and connect as host
      setViewState('lobby')
      setIsAnimating(false)

      // Connect to WebSocket - it will stay connected through all states!
      connectAsHost(quizData.roomCode)

    } catch (err) {
      console.error('Error creating quiz:', err)
      showToast(err instanceof Error ? err.message : 'Failed to generate quiz. Please try again.', 'error')
      setIsConnecting(false)
      setViewState('form')
      setIsAnimating(false)
      setGenerationStatus('')
    }
  }

  const canStartGame = teamA.length >= 1 || teamB.length >= 1

  const handleStartGame = () => {
    if (gameCode && wsRef.current?.readyState === WebSocket.OPEN) {
      // DON'T navigate - just change view state!
      setViewState('battle')
      // Send start message
      wsRef.current.send(JSON.stringify({ type: 'start_game' }))
    }
  }

  const handleEndGame = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end_game' }))
    }
  }

  const handleBackToAdmin = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    navigate('/admin')
  }

  const handleNewBattle = () => {
    // Close WebSocket and reset to form
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    // Reset all state
    setViewState('form')
    setGameCode(null)
    setTeamA([])
    setTeamB([])
    setTeamAHealth(100)
    setTeamBHealth(100)
    setGameStatus('waiting')
    setGeneratedQuestions([])
    setGameResult(null)
    setFireEvents([])
    setSubject('')
    setTopic('')
    setGradeLevel('')
    setNumberOfQuestions('10')
    setAdditionalDetails('')
  }

  // Common input styles
  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: COMPONENT_SIZES.input.height,
    padding: `${SPACING[2]} ${SPACING[3]}`,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILY,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.highlightedText,
    backgroundColor: INPUT_COLORS.background,
    border: `1px solid ${INPUT_COLORS.border}`,
    borderRadius: BORDER_RADIUS.md,
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%236B7280' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    paddingRight: SPACING[10],
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.highlightedText,
    marginBottom: SPACING[1],
  }

  // ========== RENDER RESULTS VIEW ==========
  if (viewState === 'results' && gameResult) {
    const teamAScore = gameResult.teamA.reduce((sum, p) => sum + (p.score || 0), 0)
    const teamBScore = gameResult.teamB.reduce((sum, p) => sum + (p.score || 0), 0)
    
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#1a1a2e',
        color: 'white',
        flexDirection: 'column',
        gap: '30px',
        padding: '40px'
      }}>
        <h1 style={{ fontSize: '48px', marginBottom: '10px' }}>
          {gameResult.winner === 'draw' ? '🤝 Draw!' : 
           gameResult.winner === 'A' ? '🔵 Team Blue Wins!' : '🔴 Team Red Wins!'}
        </h1>
        
        <div style={{ display: 'flex', gap: '60px', marginBottom: '30px' }}>
          <div style={{
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            border: '2px solid #3b82f6',
            borderRadius: '16px',
            padding: '24px',
            minWidth: '250px',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#3b82f6', marginBottom: '15px' }}>Team Blue</h2>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '10px' }}>
              {gameResult.teamAHealth} HP
            </div>
            <div style={{ fontSize: '24px', color: '#22c55e', marginBottom: '20px' }}>
              {teamAScore} points
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '15px' }}>
              {gameResult.teamA.map(p => (
                <div key={p.id} style={{ padding: '5px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{p.name}</span>
                  <span>{p.score} pts</span>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '2px solid #ef4444',
            borderRadius: '16px',
            padding: '24px',
            minWidth: '250px',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#ef4444', marginBottom: '15px' }}>Team Red</h2>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '10px' }}>
              {gameResult.teamBHealth} HP
            </div>
            <div style={{ fontSize: '24px', color: '#22c55e', marginBottom: '20px' }}>
              {teamBScore} points
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '15px' }}>
              {gameResult.teamB.map(p => (
                <div key={p.id} style={{ padding: '5px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{p.name}</span>
                  <span>{p.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          <button
            onClick={handleNewBattle}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            New Battle
          </button>
          <button
            onClick={handleBackToAdmin}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              backgroundColor: 'transparent',
              color: 'white',
              border: '1px solid white',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ========== RENDER BATTLE VIEW ==========
  if (viewState === 'battle') {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: environmentConfig.sky.primaryColor,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Canvas shadows gl={{ alpha: cameraConfig.canvas.alpha, antialias: cameraConfig.canvas.antialias }}>
          <PerspectiveCamera
            makeDefault
            position={cameraConfig.perspective.position}
            fov={cameraConfig.perspective.fov}
            near={cameraConfig.perspective.near}
            far={cameraConfig.perspective.far}
          />
          <fog attach="fog" args={[environmentConfig.fog.color, environmentConfig.fog.near, environmentConfig.fog.far]} />
          <SceneBackground />
          <color attach="background" args={[environmentConfig.sky.primaryColor]} />
          
          <Physics gravity={physicsConfig.gravity} debug={false}>
            <Suspense fallback={null}>
              <CleanBattleScene />
            </Suspense>
          </Physics>
          
          <ScoreCard3D 
            position={uiConfig.scoreCard3D.player1Position} 
            player="player1" 
            playerName={`BLUE (${teamAHealth} HP)`}
            teamColor={playerConfig.player1Color}
            scale={uiConfig.scoreCard3D.scale}
          />
          <ScoreCard3D 
            position={uiConfig.scoreCard3D.player2Position} 
            player="player2" 
            playerName={`RED (${teamBHealth} HP)`}
            teamColor={playerConfig.player2Color}
            scale={uiConfig.scoreCard3D.scale}
          />
        </Canvas>
        
        <HealthBarOverlay />
        
        {/* Fire Event Notifications */}
        <div style={{
          position: 'absolute',
          top: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 100,
        }}>
          {fireEvents.map((event, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: event.fromTeam === 'A' ? 'rgba(59, 130, 246, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                animation: 'slideIn 0.3s ease-out',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              🔥 {event.playerName} - {event.damage} damage! ({event.difficulty})
            </div>
          ))}
        </div>
        
        {/* Toggle Controls Button */}
        <button
          onClick={() => setShowControls(!showControls)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 15px',
            cursor: 'pointer',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Icon icon={showControls ? 'mdi:eye-off' : 'mdi:eye'} />
          {showControls ? 'Hide' : 'Show'} Controls
        </button>
        
        {/* Floating Teacher Controls Panel */}
        {showControls && (
          <div style={{
            position: 'absolute',
            top: '70px',
            right: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            borderRadius: '16px',
            padding: '20px',
            width: '320px',
            color: 'white',
            zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{
              backgroundColor: 'rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              padding: '15px',
              textAlign: 'center',
              marginBottom: '20px',
            }}>
              <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>GAME CODE</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', letterSpacing: '4px' }}>
                {gameCode?.toUpperCase()}
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>Team Blue</span>
                <span>{teamAHealth} HP</span>
              </div>
              <div style={{
                height: '12px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '6px',
                overflow: 'hidden',
                marginBottom: '15px',
              }}>
                <div style={{
                  height: '100%',
                  width: `${teamAHealth}%`,
                  backgroundColor: '#3b82f6',
                  transition: 'width 0.5s ease',
                }} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Team Red</span>
                <span>{teamBHealth} HP</span>
              </div>
              <div style={{
                height: '12px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '6px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${teamBHealth}%`,
                  backgroundColor: '#ef4444',
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px' }}>TEAM BLUE ({teamA.length})</div>
                <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                  {teamA.map(p => (
                    <div key={p.id} style={{ 
                      fontSize: '13px', 
                      padding: '4px 8px',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>{p.name}</span>
                      <span>{p.score || 0}</span>
                    </div>
                  ))}
                  {teamA.length === 0 && (
                    <div style={{ fontSize: '12px', opacity: 0.5, fontStyle: 'italic' }}>No players</div>
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px' }}>TEAM RED ({teamB.length})</div>
                <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                  {teamB.map(p => (
                    <div key={p.id} style={{ 
                      fontSize: '13px', 
                      padding: '4px 8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>{p.name}</span>
                      <span>{p.score || 0}</span>
                    </div>
                  ))}
                  {teamB.length === 0 && (
                    <div style={{ fontSize: '12px', opacity: 0.5, fontStyle: 'italic' }}>No players</div>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {gameStatus === 'playing' && (
                <button
                  onClick={handleEndGame}
                  style={{
                    width: '100%',
                    padding: '15px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <Icon icon="mdi:stop" style={{ marginRight: '8px' }} />
                  End Battle
                </button>
              )}
              
              <button
                onClick={() => setViewState('lobby')}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  backgroundColor: 'transparent',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <Icon icon="mdi:arrow-left" style={{ marginRight: '8px' }} />
                Back to Lobby
              </button>
            </div>
            
            <div style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: gameStatus === 'playing' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '14px',
            }}>
              <span style={{ 
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: gameStatus === 'playing' ? '#22c55e' : '#f59e0b',
                marginRight: '8px',
                animation: 'pulse 1.5s infinite',
              }} />
              {gameStatus === 'playing' ? 'Battle in Progress' : 'Battle Ended'}
            </div>
          </div>
        )}
        
        <style>{`
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    )
  }

  // ========== RENDER FORM/CREATING/LOBBY VIEWS ==========
  return (
    <div
      style={{
        minHeight: '100vh',
        overflow: 'auto',
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZES.sm,
        color: COLORS.baseText,
        backgroundColor: COLORS.white,
        colorScheme: 'light',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${SPACING[8]} ${SPACING[14]} ${SPACING[6]} ${SPACING[14]}`,
          gap: SPACING[4],
          width: '100%',
          position: 'relative',
          backgroundColor: COLORS.white,
          borderBottom: `1px solid ${COLORS.borderGray}`,
          transform: isAnimating && viewState !== 'form' ? 'translateY(-20px)' : 'translateY(0)',
          opacity: isAnimating && viewState !== 'form' ? 0.8 : 1,
          transition: 'transform 0.5s ease, opacity 0.5s ease',
        }}
      >
        <button
          onClick={handleBackToAdmin}
          style={{
            position: 'absolute',
            top: SPACING[4],
            left: SPACING[6],
            display: 'flex',
            alignItems: 'center',
            gap: SPACING[1],
            fontSize: FONT_SIZES.sm,
            fontWeight: FONT_WEIGHTS.regular,
            color: COLORS.baseText,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: `${SPACING[1]} ${SPACING[2]}`,
            fontFamily: FONT_FAMILY,
          }}
        >
          <Icon icon="mdi:arrow-left" style={{ width: ICON_SIZES.md, height: ICON_SIZES.md }} />
          <span>Back</span>
        </button>

        <button
          onClick={handleBackToAdmin}
          style={{
            position: 'absolute',
            top: SPACING[4],
            right: SPACING[6],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            fontSize: FONT_SIZES.sm,
            color: COLORS.baseText,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: BORDER_RADIUS.full,
          }}
        >
          <Icon icon="mdi:close" style={{ width: ICON_SIZES.lg, height: ICON_SIZES.lg }} />
        </button>

        <div
          style={{
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={ASSETS.battleModeLogo}
            alt="Battle Mode"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        <h1 style={{ 
          fontSize: FONT_SIZES.xl, 
          fontWeight: FONT_WEIGHTS.semibold, 
          color: COLORS.highlightedText, 
          margin: 0,
          textAlign: 'center',
        }}>
          {viewState === 'lobby' ? 'Battle Mode Ready!' : 'How would you like to get started?'}
        </h1>

        {viewState === 'lobby' && gameCode && (
          <p style={{ fontSize: FONT_SIZES.sm, color: COLORS.baseText, margin: 0 }}>
            Share this code with your students to join
          </p>
        )}
      </div>

      <div style={{ padding: `${SPACING[6]} ${SPACING[10]} ${SPACING[16]}` }}>
        
        {/* Form View */}
        {viewState === 'form' && (
          <div style={{ maxWidth: COMPONENT_SIZES.formCard.maxWidth, margin: '0 auto' }}>
            <div
              style={{
                backgroundColor: COLORS.white,
                border: `1px solid ${COLORS.borderGray}`,
                borderRadius: BORDER_RADIUS.lg,
                padding: SPACING[6],
                marginBottom: SPACING[6],
              }}
            >
              <p style={{ 
                fontSize: FONT_SIZES.sm, 
                color: COLORS.baseText, 
                textAlign: 'center',
                margin: `0 0 ${SPACING[4]} 0`,
              }}>
                Upload lesson slides, worksheets or <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>any document</span>
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: SPACING[3] }}>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING[2],
                    padding: `${SPACING[2]} ${SPACING[4]}`,
                    backgroundColor: COLORS.white,
                    border: `1px solid ${COLORS.borderGray}`,
                    borderRadius: BORDER_RADIUS.md,
                    cursor: 'pointer',
                    fontFamily: FONT_FAMILY,
                    fontSize: FONT_SIZES.sm,
                    color: COLORS.highlightedText,
                  }}
                >
                  <Icon icon="mdi:cloud-upload" style={{ width: ICON_SIZES.md, height: ICON_SIZES.md }} />
                  Device
                </button>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING[2],
                    padding: `${SPACING[2]} ${SPACING[4]}`,
                    backgroundColor: COLORS.white,
                    border: `1px solid ${COLORS.borderGray}`,
                    borderRadius: BORDER_RADIUS.md,
                    cursor: 'pointer',
                    fontFamily: FONT_FAMILY,
                    fontSize: FONT_SIZES.sm,
                    color: COLORS.highlightedText,
                  }}
                >
                  <Icon icon="logos:google-drive" style={{ width: ICON_SIZES.md, height: ICON_SIZES.md }} />
                  Google Drive
                </button>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING[2],
                    padding: `${SPACING[2]} ${SPACING[4]}`,
                    backgroundColor: 'rgb(249, 250, 251)',
                    border: `1px solid ${COLORS.borderGray}`,
                    borderRadius: BORDER_RADIUS.md,
                    color: COLORS.baseText,
                    fontSize: FONT_SIZES.sm,
                  }}
                >
                  <Icon icon="mdi:link" style={{ width: ICON_SIZES.md, height: ICON_SIZES.md }} />
                  <span style={{ color: INPUT_COLORS.placeholder }}>Paste any link here...</span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: SPACING[4],
                marginBottom: SPACING[6],
              }}
            >
              <div>
                <label style={labelStyle}>Subject *</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Select subject</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Grade Level *</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Select grade</option>
                  {GRADE_LEVELS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Number of Questions</label>
                <select
                  value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(e.target.value)}
                  style={selectStyle}
                >
                  {[3, 5, 10, 15, 20, 25, 30].map((n) => (
                    <option key={n} value={n}>{n} questions</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: SPACING[4] }}>
              <label style={labelStyle}>Topic *</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Fractions, World War II, Photosynthesis..."
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: SPACING[6] }}>
              <label style={labelStyle}>Additional Details (optional)</label>
              <textarea
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="Any specific topics to focus on, concepts to avoid, or special instructions..."
                style={{
                  ...inputStyle,
                  height: '100px',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleCreateQuiz}
                disabled={isConnecting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING[2],
                  padding: `${SPACING[3]} ${SPACING[8]}`,
                  backgroundColor: COLORS.magenta,
                  color: COLORS.white,
                  border: 'none',
                  borderRadius: BORDER_RADIUS.lg,
                  fontSize: FONT_SIZES.md,
                  fontWeight: FONT_WEIGHTS.semibold,
                  fontFamily: FONT_FAMILY,
                  cursor: isConnecting ? 'not-allowed' : 'pointer',
                  opacity: isConnecting ? 0.7 : 1,
                  boxShadow: SHADOWS.magenta,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <Icon icon="mdi:sword-cross" style={{ width: ICON_SIZES.lg, height: ICON_SIZES.lg }} />
                {isConnecting ? 'Creating...' : 'Create Battle'}
              </button>
            </div>
          </div>
        )}

        {/* Creating View */}
        {viewState === 'creating' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: SPACING[16],
              gap: SPACING[4],
            }}
          >
            <Icon
              icon="mdi:loading"
              style={{
                width: '48px',
                height: '48px',
                color: COLORS.magenta,
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ fontSize: FONT_SIZES.md, color: COLORS.highlightedText }}>
              {generationStatus || 'Creating your battle...'}
            </p>
            {generatedQuestions.length > 0 && (
              <p style={{ fontSize: FONT_SIZES.sm, color: COLORS.baseText }}>
                {generatedQuestions.length} questions generated
              </p>
            )}
          </div>
        )}

        {/* Lobby View */}
        {viewState === 'lobby' && gameCode && (
          <div style={{ maxWidth: COMPONENT_SIZES.formCard.maxWidth, margin: '0 auto' }}>
            {generatedQuestions.length > 0 && (
              <div
                style={{
                  backgroundColor: 'rgb(240, 253, 244)',
                  border: '1px solid rgb(34, 197, 94)',
                  borderRadius: BORDER_RADIUS.lg,
                  padding: SPACING[4],
                  marginBottom: SPACING[4],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: SPACING[4],
                }}
              >
                <Icon icon="mdi:check-circle" style={{ width: ICON_SIZES.lg, height: ICON_SIZES.lg, color: 'rgb(34, 197, 94)' }} />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium, color: COLORS.highlightedText, margin: 0 }}>
                    {subject} - {topic}
                  </p>
                  <p style={{ fontSize: FONT_SIZES.xs, color: COLORS.baseText, margin: 0 }}>
                    {generatedQuestions.length} questions ({numberOfQuestions} easy, {numberOfQuestions} medium, {numberOfQuestions} hard)
                  </p>
                </div>
              </div>
            )}

            <div
              style={{
                backgroundColor: 'rgb(249, 250, 251)',
                border: `2px solid ${COLORS.magenta}`,
                borderRadius: BORDER_RADIUS.xl,
                padding: SPACING[8],
                textAlign: 'center',
                marginBottom: SPACING[8],
              }}
            >
              <p style={{
                fontSize: FONT_SIZES.sm,
                color: COLORS.baseText,
                margin: `0 0 ${SPACING[2]} 0`,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>
                Game Code
              </p>
              <div
                style={{
                  fontSize: COMPONENT_SIZES.gameCodeDisplay.fontSize,
                  fontWeight: FONT_WEIGHTS.bold,
                  color: COLORS.magenta,
                  letterSpacing: '0.2em',
                  fontFamily: "'Courier New', monospace",
                }}
              >
                {gameCode}
              </div>
              <p style={{
                fontSize: FONT_SIZES.xs,
                color: COLORS.baseText,
                margin: `${SPACING[3]} 0 0 0`,
              }}>
                Students can join at <strong>localhost:5173/join</strong>
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: SPACING[6],
                marginBottom: SPACING[8],
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  border: '2px solid rgb(59, 130, 246)',
                  borderRadius: BORDER_RADIUS.lg,
                  padding: SPACING[4],
                }}
              >
                <h3 style={{ 
                  fontSize: FONT_SIZES.md, 
                  fontWeight: FONT_WEIGHTS.semibold, 
                  color: 'rgb(59, 130, 246)',
                  margin: `0 0 ${SPACING[3]} 0`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING[2],
                }}>
                  <Icon icon="mdi:shield" style={{ width: ICON_SIZES.lg, height: ICON_SIZES.lg }} />
                  Team Blue
                </h3>
                <div style={{ minHeight: '120px' }}>
                  {teamA.length === 0 ? (
                    <p style={{ fontSize: FONT_SIZES.sm, color: COLORS.baseText, fontStyle: 'italic' }}>
                      Waiting for players...
                    </p>
                  ) : (
                    teamA.map((player) => (
                      <div
                        key={player.id}
                        style={{
                          padding: SPACING[2],
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          borderRadius: BORDER_RADIUS.md,
                          marginBottom: SPACING[2],
                          fontSize: FONT_SIZES.sm,
                          color: COLORS.highlightedText,
                        }}
                      >
                        {player.name}
                      </div>
                    ))
                  )}
                </div>
                <p style={{ fontSize: FONT_SIZES.xs, color: COLORS.baseText, margin: 0 }}>
                  {teamA.length} player{teamA.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  border: '2px solid rgb(239, 68, 68)',
                  borderRadius: BORDER_RADIUS.lg,
                  padding: SPACING[4],
                }}
              >
                <h3 style={{ 
                  fontSize: FONT_SIZES.md, 
                  fontWeight: FONT_WEIGHTS.semibold, 
                  color: 'rgb(239, 68, 68)',
                  margin: `0 0 ${SPACING[3]} 0`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING[2],
                }}>
                  <Icon icon="mdi:fire" style={{ width: ICON_SIZES.lg, height: ICON_SIZES.lg }} />
                  Team Red
                </h3>
                <div style={{ minHeight: '120px' }}>
                  {teamB.length === 0 ? (
                    <p style={{ fontSize: FONT_SIZES.sm, color: COLORS.baseText, fontStyle: 'italic' }}>
                      Waiting for players...
                    </p>
                  ) : (
                    teamB.map((player) => (
                      <div
                        key={player.id}
                        style={{
                          padding: SPACING[2],
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          borderRadius: BORDER_RADIUS.md,
                          marginBottom: SPACING[2],
                          fontSize: FONT_SIZES.sm,
                          color: COLORS.highlightedText,
                        }}
                      >
                        {player.name}
                      </div>
                    ))
                  )}
                </div>
                <p style={{ fontSize: FONT_SIZES.xs, color: COLORS.baseText, margin: 0 }}>
                  {teamB.length} player{teamB.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: SPACING[4] }}>
              <button
                onClick={handleBackToAdmin}
                style={{
                  padding: `${SPACING[3]} ${SPACING[6]}`,
                  backgroundColor: 'transparent',
                  color: COLORS.baseText,
                  border: `1px solid ${COLORS.borderGray}`,
                  borderRadius: BORDER_RADIUS.lg,
                  fontSize: FONT_SIZES.sm,
                  fontWeight: FONT_WEIGHTS.medium,
                  fontFamily: FONT_FAMILY,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleStartGame}
                disabled={!canStartGame}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING[2],
                  padding: `${SPACING[3]} ${SPACING[8]}`,
                  backgroundColor: canStartGame ? 'rgb(34, 197, 94)' : COLORS.borderGray,
                  color: COLORS.white,
                  border: 'none',
                  borderRadius: BORDER_RADIUS.lg,
                  fontSize: FONT_SIZES.md,
                  fontWeight: FONT_WEIGHTS.semibold,
                  fontFamily: FONT_FAMILY,
                  cursor: canStartGame ? 'pointer' : 'not-allowed',
                  boxShadow: canStartGame ? '0 4px 12px rgba(34, 197, 94, 0.4)' : 'none',
                }}
              >
                <Icon icon="mdi:play" style={{ width: ICON_SIZES.lg, height: ICON_SIZES.lg }} />
                {canStartGame ? 'Start Battle!' : 'Waiting for players...'}
              </button>
            </div>

            {!canStartGame && (
              <p style={{ 
                fontSize: FONT_SIZES.xs, 
                color: COLORS.baseText, 
                textAlign: 'center',
                marginTop: SPACING[3],
              }}>
                Need at least 1 player to start
              </p>
            )}
          </div>
        )}
      </div>

      <button
        style={{
          position: 'fixed',
          bottom: SPACING[6],
          right: SPACING[6],
          width: COMPONENT_SIZES.helpButton.size,
          height: COMPONENT_SIZES.helpButton.size,
          borderRadius: BORDER_RADIUS.full,
          backgroundColor: COLORS.magenta,
          color: COLORS.white,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: SHADOWS.magenta,
          zIndex: 100,
        }}
      >
        <Icon icon="mdi:help" style={{ width: ICON_SIZES['2xl'], height: ICON_SIZES['2xl'] }} />
      </button>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
