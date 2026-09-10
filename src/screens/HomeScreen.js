import React from 'react';

import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export default function HomeScreen({
  projects = [],
  onNewProject,
  onOpenProject,
}) {
  const { colors, spacing, radius } = useTheme();

  const recentProjects = projects.slice(0, 3);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text
              style={[
                styles.eyebrow,
                { color: colors.purple },
              ]}
            >
              GCODE MOBILE
            </Text>

            <Text
              style={[
                styles.title,
                { color: colors.text },
              ]}
            >
              Bonjour 👋
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: colors.muted },
              ]}
            >
              Construis, édite et prévisualise tes projets.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onNewProject}
          style={({ pressed }) => [
            styles.newProject,
            {
              backgroundColor: colors.purple,
              borderRadius: radius.md,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={styles.newProjectIcon}>＋</Text>

          <View style={styles.newProjectText}>
            <Text style={styles.newProjectTitle}>
              Nouveau projet
            </Text>

            <Text style={styles.newProjectSubtitle}>
              Commencer un projet depuis zéro
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text },
            ]}
          >
            Projets récents
          </Text>

          <Text
            style={[
              styles.count,
              { color: colors.muted },
            ]}
          >
            {projects.length}
          </Text>
        </View>

        {recentProjects.length === 0 ? (
          <View
            style={[
              styles.empty,
              {
                backgroundColor: colors.panel,
                borderColor: colors.border,
                borderRadius: radius.md,
              },
            ]}
          >
            <Text style={styles.emptyIcon}>📁</Text>

            <Text
              style={[
                styles.emptyTitle,
                { color: colors.text },
              ]}
            >
              Aucun projet
            </Text>

            <Text
              style={[
                styles.emptyText,
                { color: colors.muted },
              ]}
            >
              Crée ton premier projet pour commencer.
            </Text>

            <Pressable
              onPress={onNewProject}
              style={[
                styles.emptyButton,
                {
                  backgroundColor: colors.panel2,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.emptyButtonText,
                  { color: colors.text },
                ]}
              >
                Créer un projet
              </Text>
            </Pressable>
          </View>
        ) : (
          recentProjects.map((project) => (
            <Pressable
              key={project.id}
              onPress={() => onOpenProject?.(project)}
              style={({ pressed }) => [
                styles.project,
                {
                  backgroundColor: colors.panel,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.projectIcon,
                  {
                    backgroundColor: colors.panel2,
                  },
                ]}
              >
                <Text>📁</Text>
              </View>

              <View style={styles.projectInfo}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.projectName,
                    { color: colors.text },
                  ]}
                >
                  {project.name || 'Projet sans nom'}
                </Text>

                <Text
                  style={[
                    styles.projectMeta,
                    { color: colors.muted },
                  ]}
                >
                  {project.files?.length || 0} fichier(s)
                </Text>
              </View>

              <Text
                style={[
                  styles.projectArrow,
                  { color: colors.muted },
                ]}
              >
                ›
              </Text>
            </Pressable>
          ))
        )}

        <View
          style={[
            styles.info,
            {
              backgroundColor: colors.panel,
              borderColor: colors.border,
              borderRadius: radius.md,
            },
          ]}
        >
          <Text style={styles.infoIcon}>⚡</Text>

          <View style={styles.infoText}>
            <Text
              style={[
                styles.infoTitle,
                { color: colors.text },
              ]}
            >
              GCODE Mobile V3
            </Text>

            <Text
              style={[
                styles.infoDescription,
                { color: colors.muted },
              ]}
            >
              Ton environnement de développement mobile.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 20,
  },

  header: {
    marginBottom: 24,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 7,
  },

  title: {
    fontSize: 32,
    fontWeight: '900',
  },

  subtitle: {
    fontSize: 14,
    marginTop: 7,
    lineHeight: 21,
  },

  newProject: {
    minHeight: 82,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },

  newProjectIcon: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '300',
    marginRight: 14,
  },

  newProjectText: {
    flex: 1,
  },

  newProjectTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },

  newProjectSubtitle: {
    color: '#e8e4ff',
    fontSize: 12,
    marginTop: 4,
  },

  arrow: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '300',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
  },

  count: {
    fontSize: 12,
    marginLeft: 8,
  },

  project: {
    minHeight: 70,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  projectIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  projectInfo: {
    flex: 1,
    marginLeft: 12,
  },

  projectName: {
    fontSize: 14,
    fontWeight: '800',
  },

  projectMeta: {
    fontSize: 12,
    marginTop: 4,
  },

  projectArrow: {
    fontSize: 25,
    marginLeft: 8,
  },

  empty: {
    minHeight: 220,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },

  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
  },

  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },

  emptyButton: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },

  emptyButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },

  info: {
    borderWidth: 1,
    padding: 15,
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoIcon: {
    fontSize: 22,
    marginRight: 12,
  },

  infoText: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
  },

  infoDescription: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
});
