/**
 * Mobile Theme Configuration for DroneNova 🇮🇳
 * Indian Tricolor Inspired Theme
 * Saffron (#FF9933) | White (#FFFFFF) | Green (#138808)
 */

export const mobileTheme = {
  // Indian Flag Colors - Primary Brand 🇮🇳
  colors: {
    // Tricolor Theme
    saffron: '#FF9933',        // Saffron - Courage & Sacrifice
    saffronLight: '#FFB366',
    saffronDark: '#E68A00',

    white: '#FFFFFF',          // White - Peace & Truth
    ashokChakra: '#000080',    // Ashok Chakra Blue

    green: '#138808',          // Green - Growth & Prosperity
    greenLight: '#16A30B',
    greenDark: '#0F6B06',

    // Primary (Saffron-based)
    primary: '#FF9933',
    primaryLight: '#FFB366',
    primaryDark: '#E68A00',

    // Secondary (Green-based)
    secondary: '#138808',
    secondaryLight: '#16A30B',
    secondaryDark: '#0F6B06',

    // Status colors
    success: '#138808',        // Green
    successLight: '#16A30B',
    warning: '#FF9933',        // Saffron
    warningLight: '#FFB366',
    danger: '#DC143C',         // Crimson
    dangerLight: '#F08080',
    info: '#000080',          // Ashok Chakra Blue

    // Team colors
    teamRed: '#DC143C',
    teamBlue: '#000080',

    // Neutrals (Light theme)
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

    // Background colors (Light theme for Android feel)
    background: '#FFFFFF',     // Pure White
    backgroundLight: '#FFF9F0', // Warm white
    backgroundGreen: '#F0F9F0', // Cool white
    surface: '#FFFFFF',        // Card background
    surfaceLight: '#F5F5F5',   // Lighter surface

    // Text colors (Dark text on light bg)
    textPrimary: '#222222',    // Dark text
    textSecondary: '#666666',  // Medium text
    textTertiary: '#999999',   // Light text

    // Border colors
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderDark: '#D1D5DB',
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

  // Typography - Android Roboto style
  typography: {
    fontFamily: {
      primary: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
      mono: 'Roboto Mono, Menlo, Monaco, Consolas, "Courier New", monospace',
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
      black: 900,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Border radius - Material Design style
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    base: '0.5rem',  // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    full: '9999px',  // Fully rounded
  },

  // Shadows - Android Material Design Elevation
  shadows: {
    // Standard shadows
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    base: '0 4px 8px rgba(0, 0, 0, 0.12)',
    md: '0 4px 12px rgba(0, 0, 0, 0.15)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.2)',
    xl: '0 12px 32px rgba(0, 0, 0, 0.25)',

    // Material Elevation levels
    elevation1: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    elevation2: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    elevation3: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
    elevation4: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
    elevation5: '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)',

    // Tricolor glow
    saffronGlow: '0 0 20px rgba(255, 153, 51, 0.5)',
    greenGlow: '0 0 20px rgba(19, 136, 8, 0.5)',
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

  // Transitions - Material Design timing
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Breakpoints
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },

  // Gradients - Indian Theme
  gradients: {
    tricolor: 'linear-gradient(135deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)',
    saffron: 'linear-gradient(135deg, #FF9933 0%, #FFB366 100%)',
    green: 'linear-gradient(135deg, #0F6B06 0%, #138808 100%)',
    saffronGreen: 'linear-gradient(135deg, #FF9933 0%, #138808 100%)',
  },
};

export default mobileTheme;
