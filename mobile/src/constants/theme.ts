// CookWise AI — Design tokens: spacing, typography, radii, shadows
// Editorial Kitchen aesthetic: refined radii, restrained shadows, mature typography
import { Colors } from './colors';
export { Colors };

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const FontSize = {
  xxs: 10,
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  h2: 26,
  h1: 32,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const LineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.65,
};

// Subtle, elegant editorial shadows (whisper-soft elevation)
export const Shadows = {
  card: {
    shadowColor: '#202820',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1.5,
  },
  subtle: {
    shadowColor: '#202820',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  modal: {
    shadowColor: '#202820',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },
} as const;

// Typography helpers — editorial hierarchy
export const Typography = {
  h1: {
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: FontSize.h1 * LineHeight.tight,
    letterSpacing: -0.4,
  },
  h2: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    lineHeight: FontSize.h2 * LineHeight.tight,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    lineHeight: FontSize.xl * LineHeight.tight,
    letterSpacing: -0.2,
  },
  bodyLg: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.regular,
    color: Colors.textPrimary,
    lineHeight: FontSize.lg * LineHeight.normal,
  },
  body: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    color: Colors.textPrimary,
    lineHeight: FontSize.md * LineHeight.normal,
  },
  bodySm: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * LineHeight.normal,
  },
  caption: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
    lineHeight: FontSize.xs * LineHeight.normal,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
} as const;
