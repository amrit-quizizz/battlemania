import { useState, useEffect } from 'react'
import useGameStore from '../store/gameStore'
import { 
  getHealthPercentage, 
  getTeamHealthPercentage,
  registerHealthChangeListener,
  type HealthChangeEvent 
} from '../utils/healthDamageSystem'
import { uiConfig } from '../config/gameConfig'
import { damageConfig } from '../config/damageConfig'

interface DamageNumber {
  id: number
  playerId: 'player1' | 'player2'
  damage: number
  timestamp: number
}

/**
 * Health Bar Overlay Component
 * 
 * HTML overlay displaying team-based health bars with:
 * - Team A vs Team B health display
 * - Individual player health bars
 * - Animated damage numbers on hit
 */
export function HealthBarOverlay() {
  const player1Health = useGameStore((state) => state.player1.health)
  const player2Health = useGameStore((state) => state.player2.health)
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([])
  
  // Subscribe to health changes for damage number animations
  useEffect(() => {
    const unsubscribe = registerHealthChangeListener((event: HealthChangeEvent) => {
      const damage = event.oldHealth - event.newHealth
      if (damage > 0) {
        // Add damage number
        const newDamageNumber: DamageNumber = {
          id: Date.now() + Math.random(),
          playerId: event.playerId,
          damage,
          timestamp: Date.now()
        }
        
        setDamageNumbers((prev) => [...prev, newDamageNumber])
        
        // Remove after animation duration
        setTimeout(() => {
          setDamageNumbers((prev) => prev.filter((n) => n.id !== newDamageNumber.id))
        }, damageConfig.visualFeedback.damageIndicatorDuration)
      }
    })
    
    return unsubscribe
  }, [])
  
  const player1HealthPercentage = getHealthPercentage('player1')
  const player2HealthPercentage = getHealthPercentage('player2')
  const teamAHealthPercentage = getTeamHealthPercentage('teamA')
  const teamBHealthPercentage = getTeamHealthPercentage('teamB')
  
  // Get health bar color based on percentage
  const getHealthColor = (percentage: number): string => {
    if (percentage > 50) {
      return damageConfig.healthBar.colors.full
    } else if (percentage > 25) {
      return damageConfig.healthBar.colors.medium
    } else {
      return damageConfig.healthBar.colors.low
    }
  }
  
  return (
    <>
      {/* Low-key health bars removed - now handled by ScoreCard components */}
      
      {/* Damage Numbers Overlay */}
      {damageNumbers.map((damageNumber) => {
        const elapsed = Date.now() - damageNumber.timestamp
        const progress = Math.min(elapsed / damageConfig.visualFeedback.damageIndicatorDuration, 1)
        const opacity = 1 - progress
        const yOffset = progress * 50 // Move 50px upward
        
        // Determine position based on player
        const isPlayer1 = damageNumber.playerId === 'player1'
        const baseLeft = isPlayer1 ? '25%' : '75%'
        const baseTop = '30%'
        
        return (
          <div
            key={damageNumber.id}
            style={{
              position: 'absolute',
              left: baseLeft,
              top: `calc(${baseTop} - ${yOffset}px)`,
              color: damageNumber.damage >= 20 
                ? damageConfig.visualFeedback.damageColors.high
                : damageNumber.damage >= 10
                ? damageConfig.visualFeedback.damageColors.medium
                : damageConfig.visualFeedback.damageColors.low,
              fontSize: damageNumber.damage >= 20 ? '28px' : damageNumber.damage >= 10 ? '24px' : '20px',
              fontWeight: 'bold',
              fontFamily: uiConfig.fonts.family,
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              opacity,
              pointerEvents: 'none',
              userSelect: 'none',
              transform: 'translateX(-50%)',
              transition: 'opacity 0.1s linear'
            }}
          >
            -{damageNumber.damage}
          </div>
        )
      })}
    </>
  )
}
