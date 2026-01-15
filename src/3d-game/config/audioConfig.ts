/**
 * Audio Configuration
 *
 * Contains all sound effect paths and audio settings for the game.
 */

export interface AudioConfig {
  /** Sound effect file paths */
  sounds: {
    /** Tank cannon firing sound */
    tankFire: string
    /** Turret/missile firing sound */
    turretFire: string
    /** Distant tank shots sound */
    distantShots: string
    /** Semi-auto rifle sound for rapid fire */
    rapidFire: string
    /** Tank movement/tracks sound */
    tankMovement: string
    /** Crowd cheering in stadium */
    crowdCheering: string
    /** Crowd clapping and cheering */
    crowdClapping: string
    /** Crowd shouting */
    crowdShouting: string
  }

  /** Volume levels (0-1) */
  volumes: {
    /** Master volume */
    master: number
    /** Sound effects volume */
    sfx: number
    /** Ambient/background volume */
    ambient: number
    /** Tank fire volume */
    tankFire: number
    /** Turret fire volume */
    turretFire: number
    /** Hit/damage volume */
    hit: number
    /** Movement sounds volume */
    movement: number
    /** Crowd sounds volume */
    crowd: number
  }

  /** Audio playback settings */
  settings: {
    /** Whether audio is enabled */
    enabled: boolean
    /** Whether to loop ambient sounds */
    loopAmbient: boolean
    /** Delay between repeated sounds (ms) */
    repeatDelay: number
  }
}

/**
 * Default audio configuration
 */
export const audioConfig: AudioConfig = {
  sounds: {
    tankFire: '/src/3d-game/assets/sound-effects/cannon-shot-14799.mp3',
    turretFire: '/src/3d-game/assets/sound-effects/powerful-cannon-shot-352459.mp3',
    distantShots: '/src/3d-game/assets/sound-effects/distant-tank-shots-33735.mp3',
    rapidFire: '/src/3d-game/assets/sound-effects/semiautorifle3-101256.mp3',
    tankMovement: '/src/3d-game/assets/sound-effects/tank-track-ratteling-197409.mp3',
    crowdCheering: '/src/3d-game/assets/sound-effects/crowd-cheering-in-stadium-435357.mp3',
    crowdClapping: '/src/3d-game/assets/sound-effects/crowd-clapping-and-cheering-effect-272056.mp3',
    crowdShouting: '/src/3d-game/assets/sound-effects/crowd-shouting-hey-hey-hey-272059.mp3'
  },
  volumes: {
    master: 0.7,
    sfx: 0.8,
    ambient: 0.3,
    tankFire: 0.6,
    turretFire: 0.7,
    hit: 0.8,
    movement: 0.3,
    crowd: 0.25
  },
  settings: {
    enabled: true,
    loopAmbient: true,
    repeatDelay: 100
  }
}
