/**
 * UI Configuration
 * 
 * Contains all user interface-related parameters including HUD positions,
 * font sizes, colors, shadows, and container dimensions.
 */

export interface UIConfig {
  /** HUD overlay positions */
  hud: {
    /** Top-left HUD position */
    topLeft: {
      top: string
      left: string
    }
    /** Top-right HUD position */
    topRight: {
      top: string
      right: string
    }
  }
  
  /** Font configuration */
  fonts: {
    /** Title font size */
    titleSize: string
    /** Subtitle font size */
    subtitleSize: string
    /** Instruction font size */
    instructionSize: string
    /** Standard font size */
    standardSize: string
    /** Font weight for titles */
    titleWeight: string
    /** Font family */
    family: string
  }
  
  /** Text styling */
  text: {
    /** Text color */
    color: string
    /** Text shadow */
    shadow: string
    /** Alternative text shadow */
    shadowAlternative: string
  }
  
  /** Container dimensions */
  container: {
    /** Main container width percentage */
    width: string
    /** Main container height percentage */
    height: string
    /** Alternative container width */
    widthAlternative: string
    /** Alternative container height */
    heightAlternative: string
    /** Border radius */
    borderRadius: string
    /** Box shadow */
    boxShadow: string
  }
  
  /** Background colors */
  background: {
    /** Main background color */
    main: string
    /** Container background color */
    container: string
  }
}

/**
 * Default UI configuration
 * All values are mutable and can be changed at runtime
 */
export const uiConfig: UIConfig = {
  hud: {
    topLeft: {
      top: '20px',
      left: '20px'
    },
    topRight: {
      top: '20px',
      right: '20px'
    }
  },
  fonts: {
    titleSize: '24px',
    subtitleSize: '18px',
    instructionSize: '14px',
    standardSize: '16px',
    titleWeight: 'bold',
    family: 'monospace'
  },
  text: {
    color: 'white',
    shadow: '2px 2px 4px rgba(0,0,0,0.8)',
    shadowAlternative: '2px 2px 4px rgba(0,0,0,0.5)'
  },
  container: {
    width: '85%',
    height: '85%',
    widthAlternative: '75%',
    heightAlternative: '75%',
    borderRadius: '10px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
  },
  background: {
    main: '#2a2a2a',
    container: '#87CEEB'
  }
}
