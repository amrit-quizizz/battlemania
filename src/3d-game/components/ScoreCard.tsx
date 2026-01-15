import useGameStore from '../store/gameStore'
import { getHealthPercentage } from '../utils/healthDamageSystem'

interface ScoreCardProps {
  side: 'left' | 'right'
  player: 'player1' | 'player2'
  teamName: string
  teamColor: string
}

/**
 * Score Card Component
 * 
 * Displays team score and health on left or right side of screen
 */
export function ScoreCard({ side, player, teamName, teamColor }: ScoreCardProps) {
  const health = useGameStore((state) => state[player].health)
  const damageDealt = useGameStore((state) => state.damageDealt[player === 'player1' ? 'teamA' : 'teamB'])
  const healthPercentage = getHealthPercentage(player)
  
  // Get health bar color (subtle, low-key)
  const getHealthColor = (percentage: number): string => {
    if (percentage > 60) return 'rgba(76, 175, 80, 0.6)' // Subtle green
    if (percentage > 30) return 'rgba(255, 193, 7, 0.6)' // Subtle yellow
    return 'rgba(244, 67, 54, 0.6)' // Subtle red
  }
  
  const positionStyle: React.CSSProperties = side === 'left' 
    ? { left: '20px', top: '20px' }
    : { right: '20px', top: '20px' }
  
  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyle,
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: '"Orbitron", "Arial Black", sans-serif',
        fontSize: '12px',
        fontWeight: '600',
        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minWidth: '160px'
      }}
    >
      {/* Team Name and Stats Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: side === 'left' ? 'flex-start' : 'flex-end',
          gap: '12px'
        }}
      >
        <div
          style={{
            fontSize: '16px',
            fontWeight: '700',
            color: teamColor,
            letterSpacing: '1px'
          }}
        >
          {teamName}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.7)'
          }}
        >
          {health} HP
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.6)'
          }}
        >
          DMG: {damageDealt}
        </div>
      </div>
      
      {/* Health Bar - Low-key style */}
      <div
        style={{
          width: '160px',
          height: '5px',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '2px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div
          style={{
            width: `${healthPercentage}%`,
            height: '100%',
            backgroundColor: getHealthColor(healthPercentage),
            transition: 'width 0.3s ease-out, background-color 0.3s ease-out',
            borderRadius: '2px'
          }}
        />
      </div>
    </div>
  )
}
