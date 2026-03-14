/**
 * Engraft Design System
 * Single source of truth for all visual tokens.
 * Never hardcode colors, fonts, or spacing — import from here.
 */

export const Colors = {
  /** Primary background — warm off-white like aged parchment */
  background: '#F9F7F4',
  /** Card surface — pure white for contrast */
  card: '#FFFFFF',
  /** Primary text — deep charcoal */
  text: '#1C1C1E',
  /** Secondary / muted text */
  textSecondary: '#6B6B6B',
  /** Disabled / placeholder text */
  textTertiary: '#AEAEB2',
  /** Warm amber accent — used for CTAs, active states, highlights */
  accent: '#C8892A',
  /** Lighter amber for backgrounds/badges */
  accentLight: '#FBF0DC',
  /** Border and divider lines */
  border: '#E5E0D8',
  /** Destructive action color */
  destructive: '#C0392B',
  /** Success green for mastery indicators */
  success: '#2E7D32',
  /** Warning / In-progress yellow-orange */
  warning: '#E67E22',
  /** Tab bar background */
  tabBar: '#FFFFFF',
  /** Tab bar border (top) */
  tabBarBorder: '#E5E0D8',
  /** Overlay scrim for modals */
  overlay: 'rgba(0, 0, 0, 0.45)',
  /** Blank underline color in cloze cards */
  blankUnderline: '#C8892A',
  /** Blank revealed text highlight */
  blankRevealBackground: '#FBF0DC',
  /** Success action background (light green) */
  successLight: '#EAF7EA',
} as const;

export const Fonts = {
  /** Serif font for scripture text — Georgia is available on both iOS and Android */
  serif: 'Georgia',
  /** System sans-serif for UI elements */
  sans: 'System',
  /** Display font for the app wordmark — Playfair Display Bold */
  wordmark: 'PlayfairDisplay_700Bold',
} as const;

export const FontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 28,
  display: 34,
} as const;

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  section: 64,
} as const;

export const Radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

/** Minimum touch target dimension per HIG / Material Design */
export const TouchTarget = 44;

export const MasteryColors = {
  new: Colors.textTertiary,
  learning: Colors.warning,
  mature: Colors.success,
} as const;

export type MasteryLevel = 'new' | 'learning' | 'mature';
