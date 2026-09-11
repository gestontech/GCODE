export const themes = {
  dark: {
    name: 'Sombre',

    colors: {
      // Backgrounds
      background: '#070914',
      backgroundElevated: '#0A0D18',
      panel: '#0D1020',
      panel2: '#11152A',
      panel3: '#171C34',

      // Borders
      border: '#242943',
      borderStrong: '#343A5A',

      // Text
      text: '#F7F8FF',
      textStrong: '#FFFFFF',
      muted: '#8189A6',
      muted2: '#5F6682',

      // Brand
      purple: '#713CFF',
      purpleLight: '#8B63FF',
      purpleDark: '#5426D6',

      // Accent
      blue: '#11BFF5',
      cyan: '#22D3EE',

      // Status
      green: '#5FE0A0',
      yellow: '#F5C451',
      orange: '#FF9F43',
      red: '#FF647C',

      // Editor
      editor: '#080B16',
      editorText: '#D9DEEE',
      editorLine: '#171B2B',
      editorActiveLine: '#11162A',
      editorCursor: '#FFFFFF',
      editorSelection: '#33236B',

      // Code syntax
      keyword: '#C084FC',
      string: '#8FE388',
      number: '#F7C873',
      function: '#67D4FF',
      comment: '#69718F',
      variable: '#F4F6FF',

      // Terminal
      terminal: '#060810',
      terminalText: '#D8DEEF',

      // Overlay
      overlay: 'rgba(0, 0, 0, 0.55)',
      shadow: 'rgba(0, 0, 0, 0.35)',
    },
  },

  light: {
    name: 'Soleil',

    colors: {
      // Backgrounds
      background: '#F4F6FB',
      backgroundElevated: '#FFFFFF',
      panel: '#FFFFFF',
      panel2: '#EEF1F7',
      panel3: '#E7EAF2',

      // Borders
      border: '#D8DDEA',
      borderStrong: '#C3C9DA',

      // Text
      text: '#171A24',
      textStrong: '#0D0F16',
      muted: '#667085',
      muted2: '#98A0B3',

      // Brand
      purple: '#6635E8',
      purpleLight: '#8058F0',
      purpleDark: '#4E25C5',

      // Accent
      blue: '#087EA4',
      cyan: '#0891B2',

      // Status
      green: '#16845B',
      yellow: '#A86E00',
      orange: '#C86B00',
      red: '#D93655',

      // Editor
      editor: '#FFFFFF',
      editorText: '#20242E',
      editorLine: '#E9ECF3',
      editorActiveLine: '#F3F5F9',
      editorCursor: '#171A24',
      editorSelection: '#DDD3FF',

      // Code syntax
      keyword: '#7C3AED',
      string: '#16845B',
      number: '#A86E00',
      function: '#087EA4',
      comment: '#7A8298',
      variable: '#20242E',

      // Terminal
      terminal: '#F8F9FC',
      terminalText: '#20242E',

      // Overlay
      overlay: 'rgba(0, 0, 0, 0.25)',
      shadow: 'rgba(20, 25, 40, 0.12)',
    },
  },
};

export const spacing = {
  xxs: 4,
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  xxl: 40,
};

export const radius = {
  xs: 6,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const typography = {
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 30,
  },

  lineHeight: {
    xs: 14,
    sm: 18,
    md: 22,
    lg: 25,
    xl: 28,
    xxl: 32,
    display: 38,
  },

  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const shadows = {
  small: {
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 3,
  },

  medium: {
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 6,
  },

  large: {
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 10,
  },
};
