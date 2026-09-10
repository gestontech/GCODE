import React from 'react';

import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export default function ProjectsScreen({
  projects = [],
  onNewProject,
  onOpenProject,
  onDeleteProject,
}) {
  const { colors, radius } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text
              style={[
                styles.title,
                { color: colors.text },
              ]}
            >
              Projets
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: colors.muted },
              ]}
            >
              {projects.length} projet
              {projects.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <Pressable
            onPress={onNewProject}
            style={({ pressed }) => [
              styles.addButton,
              {
                backgroundColor: colors.purple,
                borderRadius: radius.sm,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={styles.addText}>＋</Text>
          </Pressable>
        </View>

        {projects.length === 0 ? (
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
            <Text style={styles.emptyIcon}>📂</Text>

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
                styles.emptyDescription,
                { color: colors.muted },
              ]}
            >
              Tes projets apparaîtront ici.
            </Text>

            <Pressable
              onPress={onNewProject}
              style={[
                styles.createButton,
                { backgroundColor: colors.purple },
              ]}
            >
              <Text style={styles.createText}>
                Créer un projet
              </Text>
            </Pressable>
          </View>
        ) : (
          projects.map((project) => (
            <View
              key={project.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.panel,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Pressable
                onPress={() => onOpenProject?.(project)}
                style={({ pressed }) => [
                  styles.cardMain,
                  {
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.icon,
                    {
                      backgroundColor:
                        colors.panel2,
                    },
                  ]}
                >
                  <Text style={styles.iconText}>
                    📁
                  </Text>
                </View>

                <View style={styles.info}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.name,
                      { color: colors.text },
                    ]}
                  >
                    {project.name ||
                      'Projet sans nom'}
                  </Text>

                  <Text
                    style={[
                      styles.meta,
                      { color: colors.muted },
                    ]}
                  >
                    {project.files?.length || 0}{' '}
                    fichier(s)
                  </Text>
                </View>

                <Text
                  style={[
                    styles.chevron,
                    { color: colors.muted },
                  ]}
                >
                  ›
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  onDeleteProject?.(project.id)
                }
                style={({ pressed }) => [
                  styles.deleteButton,
                  {
                    borderColor: colors.border,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.deleteText,
                    { color: colors.red },
                  ]}
                >
                  Supprimer
                </Text>
              </Pressable>
            </View>
          ))
        )}
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
    paddingBottom: 35,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  title: {
    fontSize: 30,
    fontWeight: '900',
  },

  subtitle: {
    fontSize: 13,
    marginTop: 5,
  },

  addButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addText: {
    color: '#ffffff',
    fontSize: 27,
    fontWeight: '300',
  },

  empty: {
    minHeight: 260,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '900',
  },

  emptyDescription: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },

  createButton: {
    marginTop: 20,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  createText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },

  card: {
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },

  cardMain: {
    minHeight: 78,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  icon: {
    width: 46,
    height: 46,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconText: {
    fontSize: 21,
  },

  info: {
    flex: 1,
    marginLeft: 12,
  },

  name: {
    fontSize: 14,
    fontWeight: '800',
  },

  meta: {
    fontSize: 12,
    marginTop: 5,
  },

  chevron: {
    fontSize: 25,
    marginLeft: 8,
  },

  deleteButton: {
    minHeight: 40,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
