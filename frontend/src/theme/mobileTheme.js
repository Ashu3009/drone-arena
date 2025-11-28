/**
 * Mobile Theme Configuration for DroneNova
 * Color palette, spacing, typography for mobile responsive design
 */

export const mobileTheme = {
  // Primary brand colors
  colors: {
    primary: '#1e40af',        // Deep Blue
    primaryLight: '#3b82f6',   // Light Blue
    primaryDark: '#1e3a8a',    // Dark Blue

    secondary: '#f59e0b',      // Amber
    secondaryLight: '#fbbf24', // Light Amber
    secondaryDark: '#d97706',  // Dark Amber

    // Status colors
    success: '#10b981',        // Green
    successLight: '#34d399',
    warning: '#f59e0b',        // Amber
    warningLight: '#fbbf24',
    danger: '#ef4444',         // Red
    dangerLight: '#f87171',
    info: '#3b82f6',          // Blue

    // Team colors
    teamRed: '#dc2626',
    teamBlue: '#2563eb',

    // Neutrals
    white: '#ffffff',
    black: '#000000',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',

    // Background colors
    background: '#0f172a',     // Dark Navy
    backgroundLight: '#1e293b', // Lighter Navy
    surface: '#1e293b',        // Card background
    surfaceLight: '#334155',   // Lighter surface

    // Text colors
    textPrimary: '#f1f5f9',    // Light text
    textSecondary: '#cbd5e1',  // Medium text
    textTertiary: '#94a3b8',   // Subtle text

    // Border colors
    border: '#334155',
    borderLight: '#475569',
  },

  // Spacing scale (in pixels)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Typography
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'Menlo, Monaco, Consolas, "Courier New", monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    base: '0.5rem',  // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    full: '9999px',  // Fully rounded
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glow: '0 0 20px rgba(59, 130, 246, 0.5)',
  },

  // Z-index layers
  zIndex: {
    base: 1,
    dropdown: 100,
    sticky: 200,
    fixed: 300,
    modal: 400,
    popover: 500,
    toast: 600,
  },

  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    base: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  // Breakpoints
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },
};

export default mobileTheme;
