import React, { useMemo, useState } from 'react';

import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

function GlassPressable({
  children,
  onPress,
  accessibilityLabel,
  style,
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={5}
      style={({ pressed }) => [
        style,
        {
          opacity: pressed ? 0.72 : 1,
          transform: [
            {
              scale: pressed ? 0.975 : 1,
            },
          ],
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

function QuickAction({
  icon,
  title,
  description,
  onPress,
}) {
  const { theme } = useTheme();
  const { colors, radius, spacing } = theme;

  return (
    <GlassPressable
      onPress={onPress}
      accessibilityLabel={title}
      style={[
        styles.quickAction,
        {
          backgroundColor: colors.glass,
          borderColor: colors.border,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.sm,
        },
      ]}
    >
      <View
        style={[
          styles.quickIcon,
          {
            backgroundColor: colors.glassSoft,
            borderColor: colors.border,
            borderRadius: radius.md,
          },
        ]}
      >
        <Text
          style={[
            styles.quickIconText,
            {
              color: colors.primary,
            },
          ]}
        >
          {icon}
        </Text>
      </View>

      <View style={styles.quickContent}>
        <Text
          style={[
            styles.quickTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.quickDescription,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {description}
        </Text>
      </View>

      <Text
        style={[
          styles.quickArrow,
          {
            color: colors.textMuted,
          },
        ]}
      >
        ›
      </Text>
    </GlassPressable>
  );
}

function ProjectCard({
  project,
  onPress,
}) {
  const { theme } = useTheme();
  const { colors, radius, spacing } = theme;

  const fileCount =
    Array.isArray(project?.files)
      ? project.files.length
      : project?.files &&
          typeof project.files === 'object'
        ? Object.keys(project.files).length
        : 0;

  return (
    <GlassPressable
      onPress={() => onPress(project)}
      accessibilityLabel={`Ouvrir le projet ${
        project?.name || 'Sans nom'
      }`}
      style={[
        styles.projectCard,
        {
          backgroundColor: colors.glass,
          borderColor: colors.border,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.sm,
        },
      ]}
    >
      <View
        style={[
          styles.projectIcon,
          {
            backgroundColor: colors.primarySoft,
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
          {project?.name || 'Sans nom'}
        </Text>

        <Text
          style={[
            styles.projectMeta,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {fileCount}{' '}
          {fileCount === 1
            ? 'fichier'
            : 'fichiers'}
        </Text>
      </View>

      <Text
        style={[
          styles.arrow,
          {
            color: colors.textMuted,
          },
        ]}
      >
        ›
      </Text>
    </GlassPressable>
  );
}

export default function HomeScreen({
  projects = [],
  onCreateProject,
  onOpenProject,
  onNavigate,
  onOpenPreview,
}) {
  const { theme } = useTheme();
  const { colors, radius, spacing } = theme;

  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] =
    useState(false);
  const [projectName, setProjectName] =
    useState('');

  const filteredProjects = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return projects;
    }

    return projects.filter((project) =>
      String(project?.name || '')
        .toLowerCase()
        .includes(query)
    );
  }, [projects, search]);

  const openCreateModal = () => {
    setProjectName('');
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setProjectName('');
  };

  const handleCreateProject = async () => {
    const name =
      projectName.trim() ||
      'Nouveau projet';

    if (
      typeof onCreateProject !==
      'function'
    ) {
      closeCreateModal();
      return;
    }

    try {
      await onCreateProject(name);
      closeCreateModal();
    } catch (error) {
      console.error(
        'Erreur création projet:',
        error
      );

      Alert.alert(
        'Erreur',
        'Impossible de créer le projet.'
      );
    }
  };

  const handleOpenProject = (project) => {
    if (
      project &&
      typeof onOpenProject === 'function'
    ) {
      onOpenProject(project);
    }
  };

  const handleViewAll = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('projects');
    }
  };

  const requireProject = () => {
    if (projects.length > 0) {
      return projects[0];
    }

    Alert.alert(
      'Aucun projet',
      'Crée d’abord un projet pour utiliser cette fonction.'
    );

    return null;
  };

  const handleCommands = () => {
    const project = requireProject();

    if (!project) {
      return;
    }

    if (typeof onNavigate === 'function') {
      onNavigate('commands');
    }
  };

  const handleTerminal = () => {
    const project = requireProject();

    if (!project) {
      return;
    }

    if (typeof onNavigate === 'function') {
      onNavigate('terminal');
    }
  };

  const handleGcodeAI = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('ai');
    }
  };

  const handlePreview = () => {
    if (
      typeof onOpenPreview !==
      'function'
    ) {
      return;
    }

    const project = requireProject();

    if (project) {
      onOpenPreview(project);
    }
  };

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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: spacing.md,
            paddingTop: spacing.md,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View
          style={[
            styles.header,
            {
              marginBottom: spacing.md,
            },
          ]}
        >
          <View style={styles.headerText}>
            <Text
              style={[
                styles.brand,
                {
                  color: colors.text,
                },
              ]}
            >
              GCODE
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Votre environnement de développement
              mobile
            </Text>
          </View>

          <View
            style={[
              styles.versionBadge,
              {
                backgroundColor:
                  colors.glassStrong,
                borderColor:
                  colors.borderStrong,
                borderRadius:
                  radius.pill,
              },
            ]}
          >
            <Text
              style={[
                styles.versionText,
                {
                  color: colors.primary,
                },
              ]}
            >
              V3
            </Text>
          </View>
        </View>

        {/* SEARCH */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor:
                colors.glass,
              borderColor:
                colors.border,
              borderRadius:
                radius.lg,
              marginBottom: spacing.sm,
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
            placeholderTextColor={
              colors.textMuted
            }
            style={[
              styles.searchInput,
              {
                color: colors.text,
              },
            ]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        {/* CREATE PROJECT */}
        <GlassPressable
          onPress={openCreateModal}
          accessibilityLabel="Créer un nouveau projet"
          style={[
            styles.createButton,
            {
              backgroundColor:
                colors.primary,
              borderColor:
                colors.primary,
              borderRadius:
                radius.lg,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Text
            style={[
              styles.createIcon,
              {
                color: colors.textInverse,
              },
            ]}
          >
            +
          </Text>

          <Text
            style={[
              styles.createText,
              {
                color: colors.textInverse,
              },
            ]}
          >
            Nouveau projet
          </Text>
        </GlassPressable>

        {/* RECENT PROJECTS */}
        <View
          style={[
            styles.sectionHeader,
            {
              marginBottom: spacing.sm,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Projets récents
          </Text>

          <Pressable
            onPress={handleViewAll}
            accessibilityRole="button"
            accessibilityLabel="Voir tous les projets"
            hitSlop={8}
          >
            <Text
              style={[
                styles.viewAll,
                {
                  color: colors.primary,
                },
              ]}
            >
              Voir tout
            </Text>
          </Pressable>
        </View>

        {filteredProjects.length > 0 ? (
          <View
            style={[
              styles.projectsList,
              {
                marginBottom: spacing.lg,
              },
            ]}
          >
            {filteredProjects
              .slice(0, 5)
              .map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onPress={
                    handleOpenProject
                  }
                />
              ))}
          </View>
        ) : (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor:
                  colors.glass,
                borderColor:
                  colors.border,
                borderRadius:
                  radius.xl,
                marginBottom: spacing.lg,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIconContainer,
                {
                  backgroundColor:
                    colors.glassStrong,
                  borderColor:
                    colors.border,
                  borderRadius:
                    radius.lg,
                },
              ]}
            >
              <Text
                style={[
                  styles.emptyIcon,
                  {
                    color:
                      colors.primary,
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
              {search.trim()
                ? 'Aucun projet trouvé'
                : 'Aucun projet'}
            </Text>

            <Text
              style={[
                styles.emptyDescription,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              {search.trim()
                ? 'Essaie une autre recherche.'
                : 'Crée ton premier projet pour commencer à coder.'}
            </Text>

            {!search.trim() && (
              <GlassPressable
                onPress={openCreateModal}
                accessibilityLabel="Créer un projet"
                style={[
                  styles.emptyButton,
                  {
                    backgroundColor:
                      colors.glassStrong,
                    borderColor:
                      colors.borderStrong,
                    borderRadius:
                      radius.md,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.emptyButtonText,
                    {
                      color:
                        colors.primary,
                    },
                  ]}
                >
                  Créer un projet
                </Text>
              </GlassPressable>
            )}
          </View>
        )}

        {/* QUICK ACTIONS */}
        <View
          style={[
            styles.sectionHeader,
            {
              marginBottom: spacing.sm,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Actions rapides
          </Text>
        </View>

        <View
          style={[
            styles.quickGrid,
            {
              marginBottom: spacing.md,
            },
          ]}
        >
          <QuickAction
            icon="⌘"
            title="Commandes"
            description="Outils du projet"
            onPress={handleCommands}
          />

          <QuickAction
            icon="AI"
            title="GCODE AI"
            description="Assistant intelligent"
            onPress={handleGcodeAI}
          />

          <QuickAction
            icon="›_"
            title="Terminal"
            description="Console du projet"
            onPress={handleTerminal}
          />

          <QuickAction
            icon="▶"
            title="Preview"
            description={
              projects.length > 0
                ? 'Exécuter le projet'
                : 'Crée un projet d’abord'
            }
            onPress={handlePreview}
          />
        </View>

        {/* AI */}
        <GlassPressable
          onPress={handleGcodeAI}
          accessibilityLabel="Ouvrir GCODE AI"
          style={[
            styles.aiBanner,
            {
              backgroundColor:
                colors.glassStrong,
              borderColor:
                colors.borderStrong,
              borderRadius:
                radius.xl,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <View
            style={[
              styles.aiIcon,
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
                styles.aiIconText,
                {
                  color:
                    colors.primary,
                },
              ]}
            >
              AI
            </Text>
          </View>

          <View style={styles.aiContent}>
            <Text
              style={[
                styles.aiTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              GCODE AI
            </Text>

            <Text
              style={[
                styles.aiDescription,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Assistant de développement intelligent
            </Text>
          </View>

          <View
            style={[
              styles.comingBadge,
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
                styles.comingText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Ouvrir
            </Text>
          </View>
        </GlassPressable>

        <Text
          style={[
            styles.footer,
            {
              color:
                colors.textMuted,
            },
          ]}
        >
          GCODE Mobile V3
        </Text>
      </ScrollView>

      {/* CREATE PROJECT MODAL */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={
          closeCreateModal
        }
      >
        <View
          style={[
            styles.modalOverlay,
            {
              backgroundColor:
                colors.overlay,
            },
          ]}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor:
                  colors.glassStrong,
                borderColor:
                  colors.borderStrong,
                borderRadius:
                  radius.xl,
              },
            ]}
          >
            <View
              style={[
                styles.modalHandle,
                {
                  backgroundColor:
                    colors.borderStrong,
                },
              ]}
            />

            <Text
              style={[
                styles.modalTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Nouveau projet
            </Text>

            <Text
              style={[
                styles.modalDescription,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Donne un nom à ton nouveau projet.
            </Text>

            <TextInput
              value={projectName}
              onChangeText={setProjectName}
              placeholder="Ex. Mon site web"
              placeholderTextColor={
                colors.textMuted
              }
              autoFocus
              autoCapitalize="sentences"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={
                handleCreateProject
              }
              style={[
                styles.modalInput,
                {
                  color:
                    colors.text,
                  backgroundColor:
                    colors.glass,
                  borderColor:
                    colors.border,
                  borderRadius:
                    radius.lg,
                },
              ]}
            />

            <View
              style={[
                styles.modalActions,
                {
                  marginTop: spacing.md,
                },
              ]}
            >
              <Pressable
                onPress={closeCreateModal}
                accessibilityRole="button"
                accessibilityLabel="Annuler"
                style={({ pressed }) => [
                  styles.modalCancel,
                  {
                    backgroundColor:
                      colors.glassSoft,
                    borderColor:
                      colors.border,
                    borderRadius:
                      radius.lg,
                    opacity:
                      pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  Annuler
                </Text>
              </Pressable>

              <Pressable
                onPress={
                  handleCreateProject
                }
                accessibilityRole="button"
                accessibilityLabel="Créer"
                style={({ pressed }) => [
                  styles.modalCreate,
                  {
                    backgroundColor:
                      colors.primary,
                    borderRadius:
                      radius.lg,
                    opacity:
                      pressed ? 0.75 : 1,
                    transform: [
                      {
                        scale:
                          pressed
                            ? 0.97
                            : 1,
                      },
                    ],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modalCreateText,
                    {
                      color:
                        colors.textInverse,
                    },
                  ]}
                >
                  Créer
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  brand: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  subtitle: {
    fontSize: 12,
    marginTop: 4,
    maxWidth: 290,
    lineHeight: 18,
    fontWeight: '500',
  },

  versionBadge: {
    minWidth: 44,
    height: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    paddingHorizontal: 10,
  },

  versionText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  searchContainer: {
    minHeight: 50,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 2,
  },

  searchIcon: {
    fontSize: 24,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },

  createButton: {
    minHeight: 52,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 4,
  },

  createIcon: {
    fontSize: 25,
    fontWeight: '400',
    marginRight: 8,
  },

  createText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.1,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.1,
  },

  viewAll: {
    fontSize: 12,
    fontWeight: '800',
  },

  projectsList: {
    gap: 9,
  },

  projectCard: {
    minHeight: 70,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 1,
  },

  projectIcon: {
    width: 44,
    height: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  projectIconText: {
    fontSize: 13,
    fontWeight: '900',
  },

  projectInfo: {
    flex: 1,
    minWidth: 0,
  },

  projectName: {
    fontSize: 14,
    fontWeight: '800',
  },

  projectMeta: {
    fontSize: 11,
    marginTop: 4,
  },

  arrow: {
    fontSize: 26,
    marginLeft: 8,
  },

  emptyCard: {
    borderWidth: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },

  emptyIconContainer: {
    width: 62,
    height: 62,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  emptyIcon: {
    fontSize: 22,
    fontWeight: '900',
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  emptyDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 280,
  },

  emptyButton: {
    minHeight: 40,
    borderWidth: 1,
    paddingHorizontal: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },

  emptyButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },

  quickGrid: {
    gap: 9,
  },

  quickAction: {
    minHeight: 70,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 1,
  },

  quickIcon: {
    width: 44,
    height: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  quickIconText: {
    fontSize: 16,
    fontWeight: '900',
  },

  quickContent: {
    flex: 1,
    minWidth: 0,
  },

  quickTitle: {
    fontSize: 14,
    fontWeight: '800',
  },

  quickDescription: {
    fontSize: 11,
    marginTop: 4,
  },

  quickArrow: {
    fontSize: 25,
    marginLeft: 8,
  },

  aiBanner: {
    minHeight: 78,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 2,
  },

  aiIcon: {
    width: 46,
    height: 46,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  aiIconText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  aiContent: {
    flex: 1,
    minWidth: 0,
  },

  aiTitle: {
    fontSize: 14,
    fontWeight: '900',
  },

  aiDescription: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },

  comingBadge: {
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  comingText: {
    fontSize: 9,
    fontWeight: '800',
  },

  footer: {
    textAlign: 'center',
    fontSize: 10,
    marginTop: 4,
  },

  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    padding: 20,
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: {
      width: 0,
      height: 15,
    },
    elevation: 10,
  },

  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 18,
    opacity: 0.6,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: '900',
  },

  modalDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
    marginBottom: 16,
  },

  modalInput: {
    minHeight: 50,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },

  modalCancel: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },

  modalCreate: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCreateText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
