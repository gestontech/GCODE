import React from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

const COMMANDS = [
  {
    command: 'help',
    description:
      'Affiche la liste des commandes disponibles.',
  },
  {
    command: 'ls',
    description:
      'Affiche les fichiers du projet.',
  },
  {
    command: 'pwd',
    description:
      'Affiche le chemin du projet courant.',
  },
  {
    command: 'cat fichier',
    description:
      'Affiche le contenu d’un fichier.',
  },
  {
    command: 'touch fichier',
    description:
      'Crée un nouveau fichier.',
  },
  {
    command: 'rm fichier',
    description:
      'Supprime un fichier du projet.',
  },
  {
    command: 'echo texte > fichier',
    description:
      'Écrit du texte dans un fichier.',
  },
  {
    command: 'grep texte',
    description:
      'Recherche un texte dans les fichiers.',
  },
  {
    command: 'find texte',
    description:
      'Recherche des fichiers.',
  },
  {
    command: 'head fichier',
    description:
      'Affiche le début d’un fichier.',
  },
  {
    command: 'tail fichier',
    description:
      'Affiche la fin d’un fichier.',
  },
  {
    command: 'wc fichier',
    description:
      'Compte les lignes, mots et caractères.',
  },
  {
    command: 'clear',
    description:
      'Efface l’affichage du Terminal.',
  },
];

function GlassAction({
  children,
  onPress,
  colors,
  radius,
  primary = false,
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: primary
            ? colors.primarySoft
            : colors.glassStrong,
          borderColor: primary
            ? colors.primary
            : colors.border,
          borderRadius: radius.xl,
          opacity: pressed ? 0.68 : 1,
          transform: [
            {
              scale: pressed ? 0.97 : 1,
            },
          ],
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

export default function CommandsScreen({
  onBack,
  onOpenTerminal,
  onOpenProject,
}) {
  const { theme } = useTheme();

  const {
    colors,
    radius,
  } = theme;

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
      {/* HEADER */}

      <View
        style={[
          styles.header,
          {
            backgroundColor:
              colors.glassStrong,
            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor:
                colors.glass,
              borderColor:
                colors.border,
              borderRadius:
                radius.pill,
              opacity: pressed
                ? 0.65
                : 1,
              transform: [
                {
                  scale: pressed
                    ? 0.94
                    : 1,
                },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.backText,
              {
                color:
                  colors.text,
              },
            ]}
          >
            ‹
          </Text>
        </Pressable>

        <View
          style={styles.headerContent}
        >
          <Text
            style={[
              styles.title,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Commandes
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            Outils GCODE pour gérer tes
            projets
          </Text>
        </View>

        <View
          style={[
            styles.commandBadge,
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
              styles.commandBadgeText,
              {
                color:
                  colors.primary,
              },
            ]}
          >
            {COMMANDS.length}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* INTRO */}

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
            style={styles.infoHeader}
          >
            <View
              style={[
                styles.infoIcon,
                {
                  backgroundColor:
                    colors.primarySoft,
                  borderColor:
                    colors.border,
                  borderRadius:
                    radius.lg,
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
                $
              </Text>
            </View>

            <View
              style={
                styles.infoHeaderText
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
                Commandes disponibles
              </Text>

              <Text
                style={[
                  styles.infoCaption,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                Terminal GCODE V3
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.infoText,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            Ces commandes agissent sur les
            projets et fichiers de GCODE.
            Elles ne sont pas ajoutées à
            index.html ou aux autres fichiers
            du projet.
          </Text>
        </View>

        {/* COMMANDES */}

        {COMMANDS.map(
          (item, index) => (
            <View
              key={item.command}
              style={[
                styles.commandCard,
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
                  styles.commandRow
                }
              >
                <View
                  style={[
                    styles.numberBadge,
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
                    style={[
                      styles.numberText,
                      {
                        color:
                          colors.textMuted,
                      },
                    ]}
                  >
                    {String(
                      index + 1
                    ).padStart(2, '0')}
                  </Text>
                </View>

                <View
                  style={
                    styles.commandBody
                  }
                >
                  <View
                    style={
                      styles.commandLine
                    }
                  >
                    <Text
                      style={[
                        styles.command,
                        {
                          color:
                            colors.primary,
                        },
                      ]}
                    >
                      {item.command}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.description,
                      {
                        color:
                          colors.textSecondary,
                      },
                    ]}
                  >
                    {item.description}
                  </Text>
                </View>
              </View>
            </View>
          )
        )}

        {/* ACTIONS */}

        <View
          style={styles.actions}
        >
          <GlassAction
            onPress={
              onOpenTerminal
            }
            colors={colors}
            radius={radius}
            primary
          >
            <Text
              style={[
                styles.primaryButtonText,
                {
                  color:
                    colors.primary,
                },
              ]}
            >
              Ouvrir le Terminal
            </Text>

            <Text
              style={[
                styles.actionArrow,
                {
                  color:
                    colors.primary,
                },
              ]}
            >
              →
            </Text>
          </GlassAction>

          <GlassAction
            onPress={
              onOpenProject
            }
            colors={colors}
            radius={radius}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Ouvrir un projet
            </Text>

            <Text
              style={[
                styles.actionArrow,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              →
            </Text>
          </GlassAction>
        </View>
      </ScrollView>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },

    header: {
      minHeight: 70,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth:
        StyleSheet.hairlineWidth,
    },

    backButton: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth:
        StyleSheet.hairlineWidth,
    },

    backText: {
      fontSize: 31,
      lineHeight: 34,
      fontWeight: '400',
    },

    headerContent: {
      flex: 1,
      minWidth: 0,
      marginLeft: 12,
      marginRight: 8,
    },

    title: {
      fontSize: 18,
      fontWeight: '900',
    },

    subtitle: {
      fontSize: 10,
      marginTop: 3,
      fontWeight: '600',
    },

    commandBadge: {
      minWidth: 34,
      height: 34,
      paddingHorizontal: 9,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth:
        StyleSheet.hairlineWidth,
    },

    commandBadgeText: {
      fontSize: 11,
      fontWeight: '900',
    },

    content: {
      padding: 12,
      paddingBottom: 32,
    },

    infoCard: {
      padding: 15,
      marginBottom: 10,
      borderWidth:
        StyleSheet.hairlineWidth,
      elevation: 3,
    },

    infoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },

    infoIcon: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth:
        StyleSheet.hairlineWidth,
    },

    infoIconText: {
      fontSize: 18,
      fontWeight: '900',
      fontFamily:
        Platform.OS === 'ios'
          ? 'Menlo'
          : 'monospace',
    },

    infoHeaderText: {
      flex: 1,
      marginLeft: 10,
    },

    infoTitle: {
      fontSize: 14,
      fontWeight: '900',
    },

    infoCaption: {
      fontSize: 10,
      marginTop: 2,
      fontWeight: '600',
    },

    infoText: {
      fontSize: 11,
      lineHeight: 18,
    },

    commandCard: {
      padding: 12,
      marginBottom: 7,
      borderWidth:
        StyleSheet.hairlineWidth,
      elevation: 2,
    },

    commandRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    numberBadge: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth:
        StyleSheet.hairlineWidth,
    },

    numberText: {
      fontSize: 9,
      fontWeight: '800',
    },

    commandBody: {
      flex: 1,
      marginLeft: 10,
    },

    commandLine: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    command: {
      fontFamily:
        Platform.OS === 'ios'
          ? 'Menlo'
          : 'monospace',
      fontSize: 12,
      fontWeight: '900',
    },

    description: {
      fontSize: 10,
      lineHeight: 16,
      marginTop: 4,
    },

    actions: {
      marginTop: 5,
      gap: 9,
    },

    actionButton: {
      minHeight: 54,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth:
        StyleSheet.hairlineWidth,
      elevation: 4,
    },

    primaryButtonText: {
      fontSize: 13,
      fontWeight: '900',
    },

    secondaryButtonText: {
      fontSize: 13,
      fontWeight: '800',
    },

    actionArrow: {
      fontSize: 20,
      fontWeight: '800',
    },
  });
