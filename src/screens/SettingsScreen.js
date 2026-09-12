import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  View,
  Text,
  ScrollView,
  Switch,
  Pressable,
  StyleSheet,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

import {
  loadEditorSettings,
  updateEditorSetting,
} from '../storage/editorSettings';

export default function SettingsScreen() {
  const {
    mode,
    colors,
    changeTheme,
  } = useTheme();

  const [autoSave, setAutoSave] =
    useState(true);

  const [lineNumbers, setLineNumbers] =
    useState(true);

  const [loaded, setLoaded] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const settings =
          await loadEditorSettings();

        if (!mounted) {
          return;
        }

        setAutoSave(settings.autoSave);
        setLineNumbers(settings.lineNumbers);
      } catch (error) {
        console.error(
          'Erreur de chargement des réglages:',
          error
        );
      } finally {
        if (mounted) {
          setLoaded(true);
        }
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const handleAutoSaveChange = async (
    value
  ) => {
    setAutoSave(value);

    const saved =
      await updateEditorSetting(
        'autoSave',
        value
      );

    if (!saved) {
      setAutoSave(!value);
    }
  };

  const handleLineNumbersChange = async (
    value
  ) => {
    setLineNumbers(value);

    const saved =
      await updateEditorSetting(
        'lineNumbers',
        value
      );

    if (!saved) {
      setLineNumbers(!value);
    }
  };

  if (!loaded) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            backgroundColor:
              colors.background,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={colors.purple}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          Paramètres
        </Text>

        <Text
          style={[
            styles.section,
            {
              color: colors.purple,
            },
          ]}
        >
          ÉDITEUR
        </Text>

        <Setting
          title="Auto-save"
          description="Enregistrer automatiquement les modifications"
          value={autoSave}
          onChange={
            handleAutoSaveChange
          }
          colors={colors}
        />

        <Setting
          title="Numéros de lignes"
          description="Afficher les numéros à gauche du code"
          value={lineNumbers}
          onChange={
            handleLineNumbersChange
          }
          colors={colors}
        />

        <Text
          style={[
            styles.section,
            {
              color: colors.purple,
            },
          ]}
        >
          APPARENCE
        </Text>

        <View
          style={[
            styles.themeBox,
            {
              backgroundColor:
                colors.panel,
              borderColor:
                colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.themeTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Thème
          </Text>

          <View
            style={styles.themeButtons}
          >
            <Pressable
              style={[
                styles.themeButton,
                {
                  backgroundColor:
                    mode === 'dark'
                      ? colors.purple
                      : colors.panel2,
                  borderColor:
                    colors.border,
                },
              ]}
              onPress={() =>
                changeTheme('dark')
              }
            >
              <Text
                style={[
                  styles.themeButtonText,
                  {
                    color:
                      mode === 'dark'
                        ? '#ffffff'
                        : colors.text,
                  },
                ]}
              >
                🌙 Sombre
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.themeButton,
                {
                  backgroundColor:
                    mode === 'light'
                      ? colors.purple
                      : colors.panel2,
                  borderColor:
                    colors.border,
                },
              ]}
              onPress={() =>
                changeTheme('light')
              }
            >
              <Text
                style={[
                  styles.themeButtonText,
                  {
                    color:
                      mode === 'light'
                        ? '#ffffff'
                        : colors.text,
                  },
                ]}
              >
                ☀️ Soleil
              </Text>
            </Pressable>
          </View>
        </View>

        <Row
          title="Police"
          value="Monospace"
          colors={colors}
        />

        <Row
          title="Taille du texte"
          value="14"
          colors={colors}
        />

        <Text
          style={[
            styles.section,
            {
              color: colors.purple,
            },
          ]}
        >
          IA
        </Text>

        <Row
          title="Modèle IA"
          value="Non connecté"
          colors={colors}
        />

        <Row
          title="API"
          value="À configurer"
          colors={colors}
        />

        <Text
          style={[
            styles.version,
            {
              color: colors.muted,
            },
          ]}
        >
          GCODE Mobile V3.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

function Setting({
  title,
  description,
  value,
  onChange,
  colors,
}) {
  return (
    <View
      style={[
        styles.settingBox,
        {
          backgroundColor:
            colors.panel,
          borderColor:
            colors.border,
        },
      ]}
    >
      <View
        style={styles.settingTextContainer}
      >
        <Text
          style={[
            styles.rowTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.description,
            {
              color: colors.muted,
            },
          ]}
        >
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{
          false: colors.border,
          true: colors.purple,
        }}
        thumbColor={
          value
            ? '#ffffff'
            : colors.muted
        }
      />
    </View>
  );
}

function Row({
  title,
  value,
  colors,
}) {
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor:
            colors.panel,
          borderBottomColor:
            colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.rowTitle,
          {
            color: colors.text,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.value,
          {
            color: colors.muted,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  title: {
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 25,
  },

  section: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
  },

  settingBox: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  settingTextContainer: {
    flex: 1,
    paddingRight: 15,
  },

  row: {
    minHeight: 58,
    borderBottomWidth: 1,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
  },

  description: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },

  value: {
    fontSize: 13,
  },

  themeBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  themeTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },

  themeButtons: {
    flexDirection: 'row',
    gap: 10,
  },

  themeButton: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  themeButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },

  version: {
    textAlign: 'center',
    marginTop: 35,
    fontSize: 12,
  },
});
