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

    if (!query) return projects;

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
          <View>
            <Text
              style={[
                styles.eyebrow,
                {
                  color: colors.muted,
                },
              ]}
            >
              WORKSPACE
            </Text>

            <Text
              style={[
                styles.title,
                {
                  color: colors.textStrong,
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
                backgroundColor: colors.purple,
                borderRadius: radius.md,
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <Text style={styles.addIcon}>+</Text>
          </Pressable>
        </View>

        {/* SEARCH */}
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.panel,
              borderColor: colors.border,
              borderRadius: radius.md,
            },
          ]}
        >
          <Text
            style={[
              styles.searchIcon,
              {
                color: colors.muted,
              },
            ]}
          >
            ⌕
          </Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un projet..."
            placeholderTextColor={colors.muted2}
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
            >
              <Text
                style={[
                  styles.clear,
                  {
                    color: colors.muted,
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
                color: colors.muted,
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
                backgroundColor: colors.panel2,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.liveDot,
                {
                  backgroundColor: colors.green,
                },
              ]}
            />

            <Text
              style={[
                styles.liveText,
                {
                  color: colors.muted,
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
                backgroundColor: colors.panel,
                borderColor: colors.border,
                borderRadius: radius.lg,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIcon,
                {
                  backgroundColor: colors.panel2,
                },
              ]}
            >
              <Text
                style={[
                  styles.codeIcon,
                  {
                    color: colors.purple,
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
                  color: colors.textStrong,
                },
              ]}
            >
              {search
                ? 'Aucun résultat'
                : 'Ton espace est vide'}
            </Text>

            <Text
              style={[
                styles.emptyDescription,
                {
                  color: colors.muted,
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
                    backgroundColor: colors.panel2,
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
                  Effacer la recherche
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={onCreateProject}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: colors.purple,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  + Créer un projet
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View>
            {filteredProjects.map((project, index) => (
              <Pressable
                key={project.id || `${getProjectName(project)}-${index}`}
                onPress={() => onOpenProject?.(project)}
                style={({ pressed }) => [
                  styles.projectCard,
                  {
                    backgroundColor: colors.panel,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    opacity: pressed ? 0.76 : 1,
                  },
                ]}
              >
                {/* PROJECT ICON */}
                <View
                  style={[
                    styles.projectIcon,
                    {
                      backgroundColor: colors.panel2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.projectIconText,
                      {
                        color: colors.purple,
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
                        color: colors.textStrong,
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
                        color: colors.muted,
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
                          backgroundColor: colors.panel2,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.languageText,
                          {
                            color: colors.muted,
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
                          color: colors.muted2,
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
                        backgroundColor: colors.panel2,
                        opacity: pressed ? 0.55 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.deleteIcon,
                        {
                          color: colors.red,
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
                        color: colors.muted,
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
                borderColor: colors.border,
                borderRadius: radius.md,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.createMoreIcon,
                {
                  backgroundColor: colors.panel2,
                },
              ]}
            >
              <Text
                style={[
                  styles.createMorePlus,
                  {
                    color: colors.purple,
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
                    color: colors.textStrong,
                  },
                ]}
              >
                Nouveau projet
              </Text>

              <Text
                style={[
                  styles.createMoreSubtitle,
                  {
                    color: colors.muted,
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
                  color: colors.muted,
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
                color: colors.muted2,
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
  },

  addIcon: {
    color: '#FFFFFF',
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

  clear: {
    fontSize: 24,
    fontWeight: '300',
    marginLeft: 8,
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
  },

  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
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
    borderRadius: 11,
  },

  primaryButtonText: {
    color: '#FFFFFF',
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
    marginBottom: 9,
  },

  projectIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '700',
    marginBottom: 4,
  },

  projectDescription: {
    fontSize: 11,
    marginBottom: 7,
  },

  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  languageBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    marginRight: 7,
  },

  languageText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  projectIndex: {
    fontSize: 8,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 7,
  },

  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },

  deleteIcon: {
    fontSize: 21,
    fontWeight: '300',
  },

  arrow: {
    fontSize: 25,
    fontWeight: '300',
  },

  createMore: {
    minHeight: 75,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 4,
  },

  createMoreIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  createMorePlus: {
    fontSize: 25,
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
    marginTop: 28,
  },

  footerText: {
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 1.1,
  },
});
