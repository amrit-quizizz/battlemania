/**
 * Physics Configuration
 * 
 * Contains all physics-related parameters including mass, friction,
 * restitution, gravity, and collision effects.
 */

export interface PhysicsConfig {
  /** Tank mass (kg) - affects inertia and response to forces */
  tankMass: number
  
  /** Alternative tank mass used in some scenes */
  tankMassAlternative: number
  
  /** Friction coefficient (0-1) - affects sliding */
  friction: number
  
  /** Alternative friction value */
  frictionAlternative: number
  
  /** Restitution (bounciness) coefficient (0-1) - affects collision bounce */
  restitution: number
  
  /** Alternative restitution value */
  restitutionAlternative: number
  
  /** Gravity vector [x, y, z] in m/s² */
  gravity: [number, number, number]
  
  /** Recoil force magnitude applied to shooter tank when firing (units) */
  recoilForce: number
  
  /** Upward impulse applied to hit tank for shake effect (units) */
  shakeUpwardImpulse: number
  
  /** Random torque impulse range for shake effect (units) */
  shakeTorqueRange: number
  
  /** Horizontal impulse applied to hit tank in direction of bullet impact (units) */
  hitRecoilForce: number
}

/**
 * Default physics configuration
 * All values are mutable and can be changed at runtime
 */
export const physicsConfig: PhysicsConfig = {
  tankMass: 3,
  tankMassAlternative: 5,
  friction: 0.8,
  frictionAlternative: 0.7,
  restitution: 0.1,
  restitutionAlternative: 0.2,
  gravity: [0, -9.81, 0],
  recoilForce: 1, // Increased from 0.8 for more intense firing recoil
  shakeUpwardImpulse: 3.5, // Increased from 1.2 for more intense upward hit recoil
  shakeTorqueRange: 0.3, // Increased from 0.3 for more intense rotation/shake
  hitRecoilForce: 0 // Horizontal push-back force when enemy tank gets hit
}
