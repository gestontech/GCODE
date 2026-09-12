import React, { useMemo, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export default function ProjectsScreen({
  projects = [],
  onCreateProject,
  onOpenProject,
  onDeleteProject,
}) {
  const { colors, spacing, radius } = useTheme();
  const [search, setSearch] = useState('');

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return projects;
    }

    return projects.filter((project) => {
      const name = project?.name || project?.title || '';
      const description = project?.description || '';

      return (
        name.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query)
      );
    });
  }, [projects, search]);

  const getProjectName = (project) =>
    project?.name || project?.title || 'Projet sans nom';

  const getProjectDescription = (project) =>
    project?.description || 'Projet GCODE';

  const confirmDelete = (project) => {
    Alert.alert(
      'Supprimer le projet',
      `Voulez-vous vraiment supprimer « ${getProjectName(project)} » ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => onDeleteProject?.(project.id),
        },
      ],
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.xxl,
          },
        ]}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text
              style={[
                styles.eyebrow,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              WORKSPACE
            </Text>

            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              Mes projets
            </Text>
          </View>

          <Pressable
            onPress={onCreateProject}
            style={({ pressed }) => [
              styles.addButton,
              {
                backgroundColor: colors.glassStrong,
                borderColor: colors.borderStrong,
                borderRadius: radius.lg,
                transform: [{ scale: pressed ? 0.94 : 1 }],
                opacity: pressed ? 0.82 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.addIcon,
                {
                  color: colors.primary,
                },
              ]}
            >
              +
            </Text>
          </Pressable>
        </View>

        {/* SEARCH */}
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.glass,
              borderColor: colors.border,
              borderRadius: radius.lg,
            },
          ]}
        >
          <Text
            style={[
              styles.searchIcon,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            ⌕
          </Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un projet..."
            placeholderTextColor={colors.textMuted}
            style={[
              styles.searchInput,
              {
                color: colors.text,
              },
            ]}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              hitSlop={10}
              style={({ pressed }) => [
                styles.clearButton,
                {
                  backgroundColor: colors.glassSoft,
                  borderColor: colors.border,
                  transform: [{ scale: pressed ? 0.9 : 1 }],
                },
              ]}
            >
              <Text
                style={[
                  styles.clear,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                ×
              </Text>
            </Pressable>
          )}
        </View>

        {/* SUMMARY */}
        <View style={styles.summary}>
          <Text
            style={[
              styles.summaryText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {filteredProjects.length}{' '}
            {filteredProjects.length > 1 ? 'projets' : 'projet'}
          </Text>

          <View
            style={[
              styles.liveBadge,
              {
                backgroundColor: colors.glassSoft,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.liveDot,
                {
                  backgroundColor: colors.success,
                },
              ]}
            />

            <Text
              style={[
                styles.liveText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Local
            </Text>
          </View>
        </View>

        {/* EMPTY STATE */}
        {filteredProjects.length === 0 ? (
          <View
            style={[
              styles.empty,
              {
                backgroundColor: colors.glass,
                borderColor: colors.border,
                borderRadius: radius.xl,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIcon,
                {
                  backgroundColor: colors.glassStrong,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                },
              ]}
            >
              <Text
                style={[
                  styles.codeIcon,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                {'</>'}
              </Text>
            </View>

            <Text
              style={[
                styles.emptyTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {search ? 'Aucun résultat' : 'Ton espace est vide'}
            </Text>

            <Text
              style={[
                styles.emptyDescription,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {search
                ? 'Aucun projet ne correspond à ta recherche.'
                : 'Crée ton premier projet et commence à construire avec GCODE.'}
            </Text>

            {search ? (
              <Pressable
                onPress={() => setSearch('')}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.glassStrong,
                    borderRadius: radius.md,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                    opacity: pressed ? 0.75 : 1,
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
                  Effacer la recherche
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={onCreateProject}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.borderStrong,
                    borderRadius: radius.md,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                    opacity: pressed ? 0.82 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    {
                      color: colors.textInverse,
                    },
                  ]}
                >
                  + Créer un projet
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View>
            {filteredProjects.map((project, index) => (
              <Pressable
                key={
                  project.id ||
                  `${getProjectName(project)}-${index}`
                }
                onPress={() => onOpenProject?.(project)}
                style={({ pressed }) => [
                  styles.projectCard,
                  {
                    backgroundColor: colors.glass,
                    borderColor: colors.border,
                    borderRadius: radius.lg,
                    transform: [{ scale: pressed ? 0.985 : 1 }],
                    opacity: pressed ? 0.82 : 1,
                  },
                ]}
              >
                {/* PROJECT ICON */}
                <View
                  style={[
                    styles.projectIcon,
                    {
                      backgroundColor: colors.glassStrong,
                      borderColor: colors.border,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.projectIconText,
                      {
                        color: colors.primary,
                      },
                    ]}
                  >
                    {'</>'}
                  </Text>
                </View>

                {/* PROJECT INFO */}
                <View style={styles.projectInfo}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.projectName,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    {getProjectName(project)}
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.projectDescription,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    {getProjectDescription(project)}
                  </Text>

                  <View style={styles.projectMeta}>
                    <View
                      style={[
                        styles.languageBadge,
                        {
                          backgroundColor: colors.glassSoft,
                          borderColor: colors.border,
                          borderRadius: radius.sm,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.languageText,
                          {
                            color: colors.textSecondary,
                          },
                        ]}
                      >
                        CODE
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.projectIndex,
                        {
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      #{String(index + 1).padStart(2, '0')}
                    </Text>
                  </View>
                </View>

                {/* ACTIONS */}
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => confirmDelete(project)}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.deleteButton,
                      {
                        backgroundColor: colors.glassSoft,
                        borderColor: colors.border,
                        borderRadius: radius.sm,
                        transform: [{ scale: pressed ? 0.9 : 1 }],
                        opacity: pressed ? 0.55 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.deleteIcon,
                        {
                          color: colors.danger,
                        },
                      ]}
                    >
                      ×
                    </Text>
                  </Pressable>

                  <Text
                    style={[
                      styles.arrow,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    ›
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* CREATE CARD */}
        {filteredProjects.length > 0 && !search && (
          <Pressable
            onPress={onCreateProject}
            style={({ pressed }) => [
              styles.createMore,
              {
                backgroundColor: colors.glassSoft,
                borderColor: colors.border,
                borderRadius: radius.lg,
                transform: [{ scale: pressed ? 0.985 : 1 }],
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.createMoreIcon,
                {
                  backgroundColor: colors.glassStrong,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Text
                style={[
                  styles.createMorePlus,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                +
              </Text>
            </View>

            <View style={styles.createMoreText}>
              <Text
                style={[
                  styles.createMoreTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Nouveau projet
              </Text>

              <Text
                style={[
                  styles.createMoreSubtitle,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Commencer quelque chose de nouveau
              </Text>
            </View>

            <Text
              style={[
                styles.arrow,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              ›
            </Text>
          </Pressable>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              {
                color: colors.textMuted,
              },
            ]}
          >
            GCODE WORKSPACE
          </Text>
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
    paddingTop: 18,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  addButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },

  addIcon: {
    fontSize: 27,
    fontWeight: '300',
    marginTop: -2,
  },

  searchBox: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 16,
  },

  searchIcon: {
    fontSize: 25,
    marginRight: 9,
    marginTop: -4,
  },

  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },

  clearButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  clear: {
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 22,
  },

  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  summaryText: {
    fontSize: 12,
    fontWeight: '600',
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  liveText: {
    fontSize: 9,
    fontWeight: '600',
  },

  empty: {
    minHeight: 330,
    borderWidth: 1,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },

  emptyIcon: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1,
  },

  codeIcon: {
    fontSize: 18,
    fontWeight: '800',
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '750',
    marginBottom: 8,
    textAlign: 'center',
  },

  emptyDescription: {
    maxWidth: 290,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 21,
  },

  primaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },

  primaryButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },

  secondaryButton: {
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },

  secondaryButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },

  projectCard: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },

  projectIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 12,
  },

  projectIconText: {
    fontSize: 14,
    fontWeight: '800',
  },

  projectInfo: {
    flex: 1,
    minWidth: 0,
  },

  projectName: {
    fontSize: 14,
    fontWeight: '750',
    marginBottom: 4,
  },

  projectDescription: {
    fontSize: 11,
    marginBottom: 8,
  },

  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  languageBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    marginRight: 7,
  },

  languageText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  projectIndex: {
    fontSize: 9,
    fontWeight: '600',
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },

  deleteButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  deleteIcon: {
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 21,
  },

  arrow: {
    fontSize: 25,
    fontWeight: '300',
    marginLeft: 6,
    marginTop: -2,
  },

  createMore: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    marginTop: 2,
  },

  createMoreIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 12,
  },

  createMorePlus: {
    fontSize: 24,
    fontWeight: '300',
  },

  createMoreText: {
    flex: 1,
  },

  createMoreTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },

  createMoreSubtitle: {
    fontSize: 10,
  },

  footer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 6,
  },

  footerText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
});
