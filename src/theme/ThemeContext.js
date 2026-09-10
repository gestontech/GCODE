import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  themes,
  spacing,
  radius,
} from './theme';

const THEME_KEY = '@gcode_theme_v3';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('dark');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);

        if (
          mounted &&
          (saved === 'dark' || saved === 'light')
        ) {
          setMode(saved);
        }
      } catch (error) {
        console.error(
          'Erreur chargement thème:',
          error
        );
      } finally {
        if (mounted) {
          setLoaded(true);
        }
      }
    }

    loadTheme();

    return () => {
      mounted = false;
    };
  }, []);

  const changeTheme = async (nextMode) => {
    if (
      nextMode !== 'dark' &&
      nextMode !== 'light'
    ) {
      return;
    }

    setMode(nextMode);

    try {
      await AsyncStorage.setItem(
        THEME_KEY,
        nextMode
      );
    } catch (error) {
      console.error(
        'Erreur sauvegarde thème:',
        error
      );
    }
  };

  const toggleTheme = () => {
    changeTheme(
      mode === 'dark'
        ? 'light'
        : 'dark'
    );
  };

  const value = useMemo(() => ({
    mode,
    theme: themes[mode],
    colors: themes[mode].colors,
    spacing,
    radius,
    changeTheme,
    toggleTheme,
    loaded,
  }), [mode, loaded]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme doit être utilisé dans ThemeProvider'
    );
  }

  return context;
}
