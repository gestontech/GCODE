import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

import {
  loadEditorSettings,
  updateEditorSetting,
} from '../storage/editorSettings';

export default function SettingsScreen() {
  const {
    theme,
    themeName,
    setTheme,
  } = useTheme();

  const {
    colors,
    spacing,
    radius,
  } = theme;

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

        setAutoSave(
          settings?.autoSave ?? true
        );

        setLineNumbers(
          settings?.lineNumbers ?? true
        );
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

  const handleAutoSaveChange =
    async (value) => {
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

  const handleLineNumbersChange =
    async (value) => {
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
        <View
          style={[
            styles.loadingCard,
            {
              backgroundColor:
                colors.glassStrong,

              borderColor:
                colors.border,

              borderRadius:
                radius.xl,
            },
          ]}
        >
          <View
            style={[
              styles.loadingIcon,
              {
                backgroundColor:
                  colors.primarySoft,

                borderColor:
                  colors.border,

                borderRadius:
                  radius.pill,
              },
            ]}
          >
            <ActivityIndicator
              size="small"
              color={
                colors.primary
              }
            />
          </View>

          <Text
            style={[
              styles.loadingText,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Chargement des paramètres…
          </Text>
        </View>
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
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              spacing.xl ||
              spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* HEADER */}

        <View
          style={[
            styles.headerCard,
            {
              backgroundColor:
                colors.glass,

              borderColor:
                colors.borderStrong,

              borderRadius:
                radius.xl,
            },
          ]}
        >
          <View
            style={[
              styles.headerIcon,
              {
                backgroundColor:
                  colors.primarySoft,

                borderColor:
                  colors.border,

                borderRadius:
                  radius.pill,
              },
            ]}
          >
            <Text
              style={[
                styles.headerIconText,
                {
                  color:
                    colors.primary,
                },
              ]}
            >
              ⚙
            </Text>
          </View>

          <View
            style={
              styles.headerText
            }
          >
            <Text
              style={[
                styles.eyebrow,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              GCODE MOBILE
            </Text>

            <Text
              style={[
                styles.title,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Paramètres
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color:
                    colors.textMuted,
                },
              ]}
            >
              Personnalise ton environnement
              de développement.
            </Text>
          </View>
        </View>

        {/* ÉDITEUR */}

        <Text
          style={[
            styles.section,
            {
              color:
                colors.primary,
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
          radius={radius}
        />

        <Setting
          title="Numéros de lignes"
          description="Afficher les numéros à gauche du code"
          value={lineNumbers}
          onChange={
            handleLineNumbersChange
          }
          colors={colors}
          radius={radius}
        />

        {/* APPARENCE */}

        <Text
          style={[
            styles.section,
            {
              color:
                colors.primary,
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
                colors.glass,

              borderColor:
                colors.border,

              borderRadius:
                radius.xl,
            },
          ]}
        >
          <View
            style={
              styles.themeHeader
            }
          >
            <View>
              <Text
                style={[
                  styles.themeTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Thème
              </Text>

              <Text
                style={[
                  styles.description,
                  {
                    color:
                      colors.textMuted,
                  },
                ]}
              >
                Choisis l'apparence de GCODE
              </Text>
            </View>

            <View
              style={[
                styles.currentTheme,
                {
                  backgroundColor:
                    colors.glassStrong,

                  borderColor:
                    colors.border,

                  borderRadius:
                    radius.pill,
                },
              ]}
            >
              <Text
                style={[
                  styles.currentThemeText,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                {themeName === 'dark'
                  ? 'SOMBRE'
                  : 'CLAIR'}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.themeButtons
            }
          >
            <ThemeButton
              icon="☾"
              label="Sombre"
              active={
                themeName === 'dark'
              }
              onPress={() =>
                setTheme('dark')
              }
              colors={colors}
              radius={radius}
            />

            <ThemeButton
              icon="☀"
              label="Clair"
              active={
                themeName === 'light'
              }
              onPress={() =>
                setTheme('light')
              }
              colors={colors}
              radius={radius}
            />
          </View>
        </View>

        <Row
          icon="Aa"
          title="Police"
          value="Monospace"
          colors={colors}
          radius={radius}
        />

        <Row
          icon="T"
          title="Taille du texte"
          value="14"
          colors={colors}
          radius={radius}
        />

        {/* IA */}

        <Text
          style={[
            styles.section,
            {
              color:
                colors.primary,
            },
          ]}
        >
          IA
        </Text>

        <Row
          icon="✦"
          title="Modèle IA"
          value="Non connecté"
          colors={colors}
          radius={radius}
        />

        <Row
          icon="⌁"
          title="API"
          value="À configurer"
          colors={colors}
          radius={radius}
        />

        {/* INFORMATIONS */}

        <Text
          style={[
            styles.section,
            {
              color:
                colors.primary,
            },
          ]}
        >
          INFORMATIONS
        </Text>

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor:
                colors.glass,

              borderColor:
                colors.border,

              borderRadius:
                radius.xl,
            },
          ]}
        >
          <View
            style={[
              styles.infoIcon,
              {
                backgroundColor:
                  colors.glassStrong,

                borderColor:
                  colors.border,

                borderRadius:
                  radius.pill,
              },
            ]}
          >
            <Text
              style={[
                styles.infoIconText,
                {
                  color:
                    colors.primary,
                },
              ]}
            >
              G
            </Text>
          </View>

          <View
            style={
              styles.infoText
            }
          >
            <Text
              style={[
                styles.infoTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              GCODE Mobile
            </Text>

            <Text
              style={[
                styles.infoDescription,
                {
                  color:
                    colors.textMuted,
                },
              ]}
            >
              Éditeur de code mobile
              nouvelle génération.
            </Text>
          </View>

          <View
            style={[
              styles.versionBadge,
              {
                backgroundColor:
                  colors.primarySoft,

                borderColor:
                  colors.border,

                borderRadius:
                  radius.pill,
              },
            ]}
          >
            <Text
              style={[
                styles.versionBadgeText,
                {
                  color:
                    colors.primary,
                },
              ]}
            >
              V3
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.version,
            {
              color:
                colors.textMuted,
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
  radius,
}) {
  return (
    <View
      style={[
        styles.settingBox,
        {
          backgroundColor:
            colors.glass,

          borderColor:
            colors.border,

          borderRadius:
            radius.xl,
        },
      ]}
    >
      <View
        style={
          styles.settingTextContainer
        }
      >
        <Text
          style={[
            styles.rowTitle,
            {
              color:
                colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.description,
            {
              color:
                colors.textMuted,
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
          true: colors.primary,
        }}
        thumbColor={
          value
            ? colors.textInverse
            : colors.textMuted
        }
        ios_backgroundColor={
          colors.border
        }
      />
    </View>
  );
}

function ThemeButton({
  icon,
  label,
  active,
  onPress,
  colors,
  radius,
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{
        selected: active,
      }}
      style={({ pressed }) => [
        styles.themeButton,
        {
          backgroundColor:
            active
              ? colors.primarySoft
              : colors.glassSoft,

          borderColor:
            active
              ? colors.primary
              : colors.border,

          borderRadius:
            radius.lg,

          opacity:
            pressed ? 0.68 : 1,

          transform: [
            {
              scale:
                pressed ? 0.97 : 1,
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.themeButtonIcon,
          {
            backgroundColor:
              active
                ? colors.glassStrong
                : colors.glass,

            borderColor:
              colors.border,

            borderRadius:
              radius.pill,
          },
        ]}
      >
        <Text
          style={[
            styles.themeButtonIconText,
            {
              color:
                active
                  ? colors.primary
                  : colors.textSecondary,
            },
          ]}
        >
          {icon}
        </Text>
      </View>

      <Text
        style={[
          styles.themeButtonText,
          {
            color:
              active
                ? colors.primary
                : colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>

      {active && (
        <View
          style={[
            styles.check,
            {
              backgroundColor:
                colors.primary,
              borderRadius:
                radius.pill,
            },
          ]}
        >
          <Text
            style={[
              styles.checkText,
              {
                color:
                  colors.textInverse,
              },
            ]}
          >
            ✓
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function Row({
  icon,
  title,
  value,
  colors,
  radius,
}) {
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor:
            colors.glass,

          borderColor:
            colors.border,

          borderRadius:
            radius.xl,
        },
      ]}
    >
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor:
              colors.glassStrong,

            borderColor:
              colors.border,

            borderRadius:
              radius.pill,
          },
        ]}
      >
        <Text
          style={[
            styles.rowIconText,
            {
              color:
                colors.primary,
            },
          ]}
        >
          {icon}
        </Text>
      </View>

      <View
        style={
          styles.rowContent
        }
      >
        <Text
          style={[
            styles.rowTitle,
            {
              color:
                colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.rowDescription,
            {
              color:
                colors.textMuted,
            },
          ]}
        >
          Paramètre GCODE
        </Text>
      </View>

      <View
        style={[
          styles.valuePill,
          {
            backgroundColor:
              colors.glassSoft,

            borderColor:
              colors.border,

            borderRadius:
              radius.pill,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.value,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          {value}
        </Text>
      </View>
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
    padding: 20,
  },

  loadingCard: {
    minWidth: 210,
    paddingHorizontal: 22,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
  },

  loadingIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
    marginBottom: 11,
  },

  loadingText: {
    fontSize: 11,
    fontWeight: '750',
  },

  content: {
    padding: 16,
  },

  headerCard: {
    minHeight: 120,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
    elevation: 4,
  },

  headerIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
    marginRight: 13,
  },

  headerIconText: {
    fontSize: 25,
    fontWeight: '700',
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  title: {
    fontSize: 27,
    fontWeight: '900',
    marginTop: 3,
  },

  subtitle: {
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },

  section: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 3,
  },

  settingBox: {
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth:
      StyleSheet.hairlineWidth,
    elevation: 2,
  },

  settingTextContainer: {
    flex: 1,
    paddingRight: 12,
  },

  rowTitle: {
    fontSize: 13,
    fontWeight: '800',
  },

  description: {
    fontSize: 10,
    marginTop: 4,
    lineHeight: 15,
  },

  themeBox: {
    padding: 14,
    marginBottom: 8,
    borderWidth:
      StyleSheet.hairlineWidth,
    elevation: 2,
  },

  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  themeTitle: {
    fontSize: 14,
    fontWeight: '850',
  },

  currentTheme: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth:
      StyleSheet.hairlineWidth,
  },

  currentThemeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  themeButtons: {
    flexDirection: 'row',
    gap: 9,
  },

  themeButton: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
  },

  themeButtonIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
    marginRight: 8,
  },

  themeButtonIconText: {
    fontSize: 15,
    fontWeight: '700',
  },

  themeButtonText: {
    fontSize: 11,
    fontWeight: '800',
  },

  check: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },

  checkText: {
    fontSize: 11,
    fontWeight: '900',
  },

  row: {
    minHeight: 68,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
    elevation: 2,
  },

  rowIcon: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
    marginRight: 10,
  },

  rowIconText: {
    fontSize: 13,
    fontWeight: '900',
  },

  rowContent: {
    flex: 1,
    minWidth: 0,
  },

  rowDescription: {
    fontSize: 9,
    marginTop: 3,
  },

  valuePill: {
    maxWidth: 120,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth:
      StyleSheet.hairlineWidth,
    marginLeft: 8,
  },

  value: {
    fontSize: 9,
    fontWeight: '700',
  },

  infoCard: {
    minHeight: 76,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
    elevation: 3,
  },

  infoIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
    marginRight: 10,
  },

  infoIconText: {
    fontSize: 20,
    fontWeight: '900',
  },

  infoText: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: '850',
  },

  infoDescription: {
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  versionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth:
      StyleSheet.hairlineWidth,
  },

  versionBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },

  version: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 10,
    fontWeight: '600',
  },
});
