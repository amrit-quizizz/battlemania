import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
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

// WebSocket URL
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002'

interface Player {
  id: string
  name: string
}

type ViewState = 'form' | 'creating' | 'lobby'

export default function BattleMode() {
  const navigate = useNavigate()
  
  // Debug log
  useEffect(() => {
    console.log('BattleMode component mounted')
  }, [])
  
  // View state
  const [viewState, setViewState] = useState<ViewState>('form')
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Form state
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [numberOfQuestions, setNumberOfQuestions] = useState('10')
  const [additionalDetails, setAdditionalDetails] = useState('')
  
  // Game state
  const [gameCode, setGameCode] = useState<string | null>(null)
  const [teamA, setTeamA] = useState<Player[]>([])
  const [teamB, setTeamB] = useState<Player[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  
  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null)

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const handleCreateQuiz = () => {
    if (!subject || !topic || !gradeLevel) {
      setError('Please fill in all required fields')
      return
    }

    setError(null)
    setIsAnimating(true)
    setViewState('creating')
    setIsConnecting(true)

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close()
          setError('Connection timeout. Make sure the server is running.')
          setIsConnecting(false)
          setViewState('form')
          setIsAnimating(false)
        }
      }, 5000)

      ws.onopen = () => {
        clearTimeout(connectionTimeout)
        setIsConnecting(false)
        ws.send(JSON.stringify({ type: 'create_game' }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          switch (data.type) {
            case 'game_created':
              setGameCode(data.gameCode)
              setTeamA([])
              setTeamB([])
              setError(null)
              setTimeout(() => {
                setViewState('lobby')
                setIsAnimating(false)
              }, 500)
              break

            case 'game_state':
              setTeamA(data.teamA || [])
              setTeamB(data.teamB || [])
              break

            case 'error':
              setError(data.message)
              setIsConnecting(false)
              break
          }
        } catch (err) {
          console.error('Error parsing message:', err)
        }
      }

      ws.onerror = () => {
        clearTimeout(connectionTimeout)
        setError('Failed to connect to server. Make sure the server is running.')
        setIsConnecting(false)
        setViewState('form')
        setIsAnimating(false)
      }

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout)
        setIsConnecting(false)
        if (event.code !== 1000 && !gameCode) {
          setError('Connection closed. Please try again.')
          setViewState('form')
          setIsAnimating(false)
        }
      }
    } catch (err) {
      console.error('Error creating WebSocket:', err)
      setError('Failed to create connection.')
      setIsConnecting(false)
      setViewState('form')
      setIsAnimating(false)
    }
  }

  const canStartGame = teamA.length >= 1 && teamB.length >= 1

  const handleStartGame = () => {
    if (canStartGame && gameCode && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'start_game',
        gameCode
      }))
      navigate('/quiz/game', { state: { gameCode } })
    }
  }

  const handleBackToAdmin = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    navigate('/admin')
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
        {/* Back button */}
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

        {/* Close button */}
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

        {/* Battle Mode Icon */}
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

        {/* Title */}
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

      {/* Content Area */}
      <div style={{ padding: `${SPACING[6]} ${SPACING[10]} ${SPACING[16]}` }}>
        
        {/* Form View */}
        {viewState === 'form' && (
          <div
            style={{
              maxWidth: COMPONENT_SIZES.formCard.maxWidth,
              margin: '0 auto',
            }}
          >
            {/* Error Message */}
            {error && (
              <div
                style={{
                  padding: SPACING[3],
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: BORDER_RADIUS.md,
                  color: 'rgb(239, 68, 68)',
                  fontSize: FONT_SIZES.sm,
                  marginBottom: SPACING[4],
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            {/* Upload Section */}
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

            {/* Quiz Configuration Form */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: SPACING[4],
                marginBottom: SPACING[6],
              }}
            >
              {/* Subject */}
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

              {/* Grade Level */}
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

              {/* Number of Questions */}
              <div>
                <label style={labelStyle}>Number of Questions</label>
                <select
                  value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(e.target.value)}
                  style={selectStyle}
                >
                  {[5, 10, 15, 20, 25, 30].map((n) => (
                    <option key={n} value={n}>{n} questions</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Topic Input */}
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

            {/* Additional Details */}
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

            {/* Create Button */}
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
              Creating your battle...
            </p>
          </div>
        )}

        {/* Lobby View */}
        {viewState === 'lobby' && gameCode && (
          <div
            style={{
              maxWidth: COMPONENT_SIZES.formCard.maxWidth,
              margin: '0 auto',
            }}
          >
            {/* Game Code Display */}
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
                Students can join at <strong>quizizz.com/join</strong>
              </p>
            </div>

            {/* Teams Display */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: SPACING[6],
                marginBottom: SPACING[8],
              }}
            >
              {/* Team A */}
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

              {/* Team B */}
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

            {/* Action Buttons */}
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
                Need at least 1 player in each team to start
              </p>
            )}
          </div>
        )}
      </div>

      {/* Help Button */}
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

      {/* CSS Animation for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
