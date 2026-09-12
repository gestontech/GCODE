const glass = {
  blur: 18,
  opacity: 0.72,
  borderOpacity: 0.18,
};

const base = {
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 22,
    xl: 28,
    pill: 999,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
  },

  typography: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
  },

  glass,
};

export const darkTheme = {
  ...base,

  mode: 'dark',

  colors: {
    background: '#07080D',
    backgroundSecondary: '#10121A',
    surface: '#151821',
    surfaceSecondary: '#1C1F29',

    glass: 'rgba(30, 32, 42, 0.72)',
    glassStrong: 'rgba(38, 41, 53, 0.84)',
    glassSoft: 'rgba(255, 255, 255, 0.07)',

    card: 'rgba(255, 255, 255, 0.055)',
    cardStrong: 'rgba(255, 255, 255, 0.09)',

    border: 'rgba(255, 255, 255, 0.12)',
    borderStrong: 'rgba(255, 255, 255, 0.19)',

    text: '#F5F7FB',
    textSecondary: '#B8BDCA',
    textMuted: '#7D8391',
    textInverse: '#08090D',

    primary: '#FFFFFF',
    primarySoft: 'rgba(255, 255, 255, 0.12)',

    accent: '#5E9EFF',
    accentSoft: 'rgba(94, 158, 255, 0.16)',

    success: '#35D07F',
    successSoft: 'rgba(53, 208, 127, 0.14)',

    warning: '#FFCC66',
    warningSoft: 'rgba(255, 204, 102, 0.14)',

    danger: '#FF667A',
    dangerSoft: 'rgba(255, 102, 122, 0.14)',

    overlay: 'rgba(0, 0, 0, 0.45)',
    shadow: 'rgba(0, 0, 0, 0.35)',

    editorBackground: '#0A0C11',
    editorSurface: '#11141B',
    editorLine: 'rgba(255, 255, 255, 0.045)',
    editorSelection: 'rgba(94, 158, 255, 0.20)',
    editorText: '#E8EBF2',
    lineNumber: '#656B78',
  },
};

export const lightTheme = {
  ...base,

  mode: 'light',

  colors: {
    background: '#F2F4F8',
    backgroundSecondary: '#E9ECF2',
    surface: '#FFFFFF',
    surfaceSecondary: '#F8F9FC',

    glass: 'rgba(255, 255, 255, 0.72)',
    glassStrong: 'rgba(255, 255, 255, 0.88)',
    glassSoft: 'rgba(255, 255, 255, 0.52)',

    card: 'rgba(255, 255, 255, 0.64)',
    cardStrong: 'rgba(255, 255, 255, 0.82)',

    border: 'rgba(20, 25, 35, 0.10)',
    borderStrong: 'rgba(20, 25, 35, 0.16)',

    text: '#151821',
    textSecondary: '#59606E',
    textMuted: '#858C99',
    textInverse: '#FFFFFF',

    primary: '#151821',
    primarySoft: 'rgba(20, 25, 35, 0.08)',

    accent: '#3478F6',
    accentSoft: 'rgba(52, 120, 246, 0.12)',

    success: '#159A59',
    successSoft: 'rgba(21, 154, 89, 0.11)',

    warning: '#B87900',
    warningSoft: 'rgba(184, 121, 0, 0.11)',

    danger: '#D9364F',
    dangerSoft: 'rgba(217, 54, 79, 0.11)',

    overlay: 'rgba(0, 0, 0, 0.20)',
    shadow: 'rgba(20, 25, 35, 0.16)',

    editorBackground: '#F8F9FC',
    editorSurface: '#FFFFFF',
    editorLine: 'rgba(20, 25, 35, 0.055)',
    editorSelection: 'rgba(52, 120, 246, 0.16)',
    editorText: '#20242D',
    lineNumber: '#9298A4',
  },
};

export const themes = {
  dark: darkTheme,
  light: lightTheme,
};

export const defaultTheme = darkTheme;

export default {
  darkTheme,
  lightTheme,
  themes,
  defaultTheme,
};
