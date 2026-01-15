// Global Design Configuration
// All design tokens in one place - no magic values

export const COLORS = {
  // Text colors
  baseText: 'rgb(80, 87, 94)',           // Base font color - 14px
  highlightedText: 'rgb(18, 21, 23)',    // Highlighted font color - 16px
  smallText: 'rgb(18, 21, 23)',          // Small text color - 12px
  
  // Background colors
  normalBg: 'rgb(229, 231, 235)',        // Normal background color
  sidebarBg: 'rgb(249, 250, 251)',       // Sidebar background color
  mainBg: 'rgb(255, 255, 255)',          // Main content background
  white: '#ffffff',
  
  // Accent colors
  pink: 'rgb(236, 72, 153)',             // Pink accent
  magenta: 'rgb(169, 26, 143)',          // Magenta (help button)
  blue: 'rgb(59, 130, 246)',             // Blue accent
  
  // Border colors
  borderGray: 'rgb(229, 231, 235)',      // Border color
} as const

export const FONT_SIZES = {
  xs: '12px',      // Small text
  sm: '14px',      // Base text
  md: '16px',      // Highlighted text
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
} as const

export const FONT_WEIGHTS = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const

export const FONT_FAMILY = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"

export const SPACING = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
} as const

export const BORDER_RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  full: '50%',
} as const

export const SHADOWS = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 2px 8px rgba(0, 0, 0, 0.08)',
  lg: '0 4px 12px rgba(0, 0, 0, 0.1)',
  xl: '0 8px 24px rgba(0, 0, 0, 0.15)',
  magenta: '0 4px 12px rgba(169, 26, 143, 0.4)',
  blue: '0 4px 12px rgba(59, 130, 246, 0.4)',
} as const

export const GRADIENTS = {
  pinkRadial: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(252, 211, 233, 0.85) 0%, rgba(253, 232, 248, 0.5) 40%, transparent 75%)',
} as const

export const ICON_SIZES = {
  sm: '14px',
  md: '18px',
  lg: '20px',
  xl: '24px',
  '2xl': '28px',
} as const

export const COMPONENT_SIZES = {
  sidebar: {
    width: '220px',
  },
  logo: {
    height: '40px',
  },
  avatar: {
    sm: '36px',
    md: '48px',
    lg: '64px',
  },
  helpButton: {
    size: '48px',
  },
  cardIcon: {
    size: '72px',
  },
  tabButton: {
    minWidth: '120px',
  },
  input: {
    height: '44px',
  },
  formCard: {
    maxWidth: '800px',
  },
  gameCodeDisplay: {
    fontSize: '48px',
  },
} as const

// Form/Input specific colors
export const INPUT_COLORS = {
  border: 'rgb(209, 213, 219)',
  borderFocus: 'rgb(168, 85, 247)',
  placeholder: 'rgb(156, 163, 175)',
  background: 'rgb(255, 255, 255)',
} as const

// Quiz subjects
export const SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Geography',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Biology',
  'General Knowledge',
] as const

// Quiz difficulty levels
export const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy', color: 'rgb(34, 197, 94)' },
  { value: 'medium', label: 'Medium', color: 'rgb(234, 179, 8)' },
  { value: 'hard', label: 'Hard', color: 'rgb(239, 68, 68)' },
] as const

// Grade levels
export const GRADE_LEVELS = [
  'Grade 1',
  'Grade 2', 
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
] as const

// Quizizz CDN Assets
export const ASSETS = {
  logo: 'https://cf.quizizz.com/image/logo-expanded.png',
  assessment: 'https://cf.quizizz.com/image/Assessment.png',
  presentation: 'https://cf.quizizz.com/image/Presentation.png',
  video: 'https://cf.quizizz.com/image/Video.png',
  passage: 'https://cf.quizizz.com/image/Passage.png',
  flashcard: 'https://cf.quizizz.com/image/Flashcard.png',
  voyageMathIcon: 'https://cf.quizizz.com/image/vm-4.5.svg',
  voyageMathText: 'https://cf.quizizz.com/image/voyage-math-grey.svg',
  battleModeLogo: '/battle-mode-logo.png',
  userAvatar: 'https://quizizz.com/_media/users/fedac3fb-f8a5-46aa-a11d-2248aac43553-v2',
} as const
