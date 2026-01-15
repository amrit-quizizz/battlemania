import { useState, useEffect } from 'react'
import { Html } from '@react-three/drei'
import { DamageType } from '../config/damageConfig'
import { damageConfig } from '../config/damageConfig'

interface DamageIndicatorProps {
  position: [number, number, number]
  damage: number
  damageType: DamageType
  visible: boolean
  onComplete: () => void
}

/**
 * Damage Indicator Component
 * 
 * Shows animated damage numbers above hit tanks with:
 * - Color-coded by damage type
 * - Fade-out and upward movement animation
 * - Auto-removal after animation completes
 */
export function DamageIndicator({
  position,
  damage,
  damageType,
  visible,
  onComplete
}: DamageIndicatorProps) {
  const [opacity, setOpacity] = useState(1)
  const [yOffset, setYOffset] = useState(0)
  
  useEffect(() => {
    if (!visible) return
    
    // Reset animation state
    setOpacity(1)
    setYOffset(0)
    
    // Animate fade-out and upward movement
    const duration = damageConfig.visualFeedback.damageIndicatorDuration
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Fade out
      setOpacity(1 - progress)
      
      // Move upward
      setYOffset(progress * 2) // Move 2 units upward
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        onComplete()
      }
    }
    
    requestAnimationFrame(animate)
  }, [visible, onComplete])
  
  if (!visible) return null
  
  // Get color based on damage type
  const getDamageColor = (type: DamageType): string => {
    if (type === DamageType.HIGH) {
      return damageConfig.visualFeedback.damageColors.high
    } else if (type === DamageType.MEDIUM) {
      return damageConfig.visualFeedback.damageColors.medium
    } else {
      return damageConfig.visualFeedback.damageColors.low
    }
  }
  
  const color = getDamageColor(damageType)
  
  return (
    <Html
      position={[position[0], position[1] + yOffset, position[2]]}
      center
      style={{
        pointerEvents: 'none',
        userSelect: 'none'
      }}
    >
      <div
        style={{
          color,
          fontSize: damageType === DamageType.HIGH ? '32px' : damageType === DamageType.MEDIUM ? '24px' : '18px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          opacity,
          transition: 'opacity 0.1s linear',
          fontFamily: 'monospace',
          transform: 'translate(-50%, -50%)'
        }}
      >
        -{damage}
      </div>
    </Html>
  )
}
