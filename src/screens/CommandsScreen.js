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

export default function CommandsScreen({
  onBack,
  onOpenTerminal,
  onOpenProject,
}) {
  const { colors } = useTheme();

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
      <View
        style={[
          styles.header,
          {
            backgroundColor:
              colors.backgroundElevated,
            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <Pressable
          onPress={onBack}
          style={[
            styles.backButton,
            {
              backgroundColor:
                colors.panel2,
              borderColor:
                colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.backText,
              {
                color: colors.text,
              },
            ]}
          >
            ‹
          </Text>
        </Pressable>

        <View style={styles.headerContent}>
          <Text
            style={[
              styles.title,
              {
                color: colors.textStrong,
              },
            ]}
          >
            Commandes
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: colors.muted,
              },
            ]}
          >
            Outils GCODE pour gérer tes projets
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
      >
        <View
          style={[
            styles.infoCard,
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
              styles.infoTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Commandes disponibles
          </Text>

          <Text
            style={[
              styles.infoText,
              {
                color: colors.muted,
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

        {COMMANDS.map((item) => (
          <View
            key={item.command}
            style={[
              styles.commandCard,
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
                styles.command,
                {
                  color: colors.purple,
                },
              ]}
            >
              {item.command}
            </Text>

            <Text
              style={[
                styles.description,
                {
                  color: colors.muted,
                },
              ]}
            >
              {item.description}
            </Text>
          </View>
        ))}

        <Pressable
          onPress={onOpenTerminal}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor:
                colors.purple,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Text style={styles.primaryButtonText}>
            Ouvrir le Terminal
          </Text>
        </Pressable>

        <Pressable
          onPress={onOpenProject}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              backgroundColor:
                colors.panel2,
              borderColor:
                colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.secondaryButtonText,
              {
                color: colors.text,
              },
            ]}
          >
            Ouvrir un projet
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    minHeight: 66,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    fontSize: 30,
    lineHeight: 32,
  },

  headerContent: {
    flex: 1,
    marginLeft: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: '900',
  },

  subtitle: {
    fontSize: 11,
    marginTop: 3,
  },

  content: {
    padding: 16,
    paddingBottom: 32,
  },

  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 7,
  },

  infoText: {
    fontSize: 12,
    lineHeight: 18,
  },

  commandCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },

  command: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '800',
  },

  description: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  secondaryButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 9,
  },

  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
