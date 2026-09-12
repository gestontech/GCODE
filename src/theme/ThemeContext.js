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
  defaultTheme,
} from './theme';

const THEME_STORAGE_KEY = '@gcode_theme';

const ThemeContext = createContext({
  theme: defaultTheme,
  themeName: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: true,
});

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadTheme() {
      try {
        const savedTheme = await AsyncStorage.getItem(
          THEME_STORAGE_KEY
        );

        if (
          mounted &&
          savedTheme &&
          Object.prototype.hasOwnProperty.call(themes, savedTheme)
        ) {
          setThemeName(savedTheme);
        }
      } catch (error) {
        // Si le stockage échoue, GCODE conserve le thème par défaut.
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    }

    loadTheme();

    return () => {
      mounted = false;
    };
  }, []);

  const setTheme = async (nextTheme) => {
    if (!Object.prototype.hasOwnProperty.call(themes, nextTheme)) {
      return;
    }

    setThemeName(nextTheme);

    try {
      await AsyncStorage.setItem(
        THEME_STORAGE_KEY,
        nextTheme
      );
    } catch (error) {
      // Le changement visuel reste actif même si la sauvegarde échoue.
    }
  };

  const toggleTheme = () => {
    setTheme(themeName === 'dark' ? 'light' : 'dark');
  };

  const theme = themes[themeName] || defaultTheme;

  const value = useMemo(
    () => ({
      theme,
      themeName,
      setTheme,
      toggleTheme,
      isDark: themeName === 'dark',
      ready,
    }),
    [theme, themeName, ready]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
