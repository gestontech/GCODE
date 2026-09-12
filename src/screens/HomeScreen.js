import React, { useMemo, useState } from 'react';

import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

function QuickAction({
  icon,
  title,
  description,
  onPress,
  disabled = false,
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.quickAction,
        {
          backgroundColor: colors.panel,
          borderColor: colors.border,
          opacity: disabled
            ? 0.5
            : pressed
              ? 0.7
              : 1,
        },
      ]}
    >
      <View
        style={[
          styles.quickIcon,
          {
            backgroundColor: colors.panel2,
          },
        ]}
      >
        <Text
          style={[
            styles.quickIconText,
            {
              color: colors.purple,
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
              color: colors.muted,
            },
          ]}
        >
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

function ProjectCard({
  project,
  onPress,
}) {
  const { colors } = useTheme();

  const fileCount =
    Array.isArray(project?.files)
      ? project.files.length
      : project?.files &&
          typeof project.files === 'object'
        ? Object.keys(project.files).length
        : 0;

  return (
    <Pressable
      onPress={() => onPress(project)}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir le projet ${
        project?.name || 'Sans nom'
      }`}
      style={({ pressed }) => [
        styles.projectCard,
        {
          backgroundColor: colors.panel,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
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
              color: colors.muted,
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
            color: colors.muted,
          },
        ]}
      >
        ›
      </Text>
    </Pressable>
  );
}

export default function HomeScreen({
  projects = [],
  onCreateProject,
  onOpenProject,
  onNavigate,
  onOpenPreview,
}) {
  const { colors } = useTheme();

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
      typeof onCreateProject !== 'function'
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

  const handlePreview = () => {
    if (
      typeof onOpenPreview !== 'function'
    ) {
      return;
    }

    if (!projects.length) {
      Alert.alert(
        'Aucun projet',
        'Crée d’abord un projet pour utiliser le Preview.'
      );

      return;
    }

    const project = projects[0];

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
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View>
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
                  color: colors.muted,
                },
              ]}
            >
              Votre environnement de développement mobile
            </Text>
          </View>

          <View
            style={[
              styles.versionBadge,
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
                styles.versionText,
                {
                  color: colors.purple,
                },
              ]}
            >
              V3
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.panel,
              borderColor: colors.border,
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
            placeholderTextColor={
              colors.muted
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

        <Pressable
          onPress={openCreateModal}
          accessibilityRole="button"
          accessibilityLabel="Créer un nouveau projet"
          style={({ pressed }) => [
            styles.createButton,
            {
              backgroundColor:
                colors.purple,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Text style={styles.createIcon}>
            +
          </Text>

          <Text style={styles.createText}>
            Nouveau projet
          </Text>
        </Pressable>

        <View style={styles.sectionHeader}>
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
                  color: colors.purple,
                },
              ]}
            >
              Voir tout
            </Text>
          </Pressable>
        </View>

        {filteredProjects.length > 0 ? (
          <View style={styles.projectsList}>
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
                  colors.panel,
                borderColor:
                  colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.emptyIcon,
                {
                  color: colors.purple,
                },
              ]}
            >
              {'</>'}
            </Text>

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
                  color: colors.muted,
                },
              ]}
            >
              {search.trim()
                ? 'Essaie une autre recherche.'
                : 'Crée ton premier projet pour commencer à coder.'}
            </Text>

            {!search.trim() && (
              <Pressable
                onPress={openCreateModal}
                style={({ pressed }) => [
                  styles.emptyButton,
                  {
                    borderColor:
                      colors.border,
                    opacity: pressed
                      ? 0.7
                      : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.emptyButtonText,
                    {
                      color:
                        colors.purple,
                    },
                  ]}
                >
                  Créer un projet
                </Text>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.sectionHeader}>
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

        <View style={styles.quickGrid}>
          <QuickAction
            icon="⌘"
            title="Commandes"
            description="Outils du projet"
            disabled
          />

          <QuickAction
            icon="AI"
            title="GCODE AI"
            description="Assistant intelligent"
            disabled
          />

          <QuickAction
            icon="›_"
            title="Terminal"
            description="Console du projet"
            disabled
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

        <View
          style={[
            styles.aiBanner,
            {
              backgroundColor:
                colors.panel,
              borderColor:
                colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.aiIcon,
              {
                backgroundColor:
                  colors.panel2,
              },
            ]}
          >
            <Text
              style={[
                styles.aiIconText,
                {
                  color: colors.purple,
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
                  color: colors.text,
                },
              ]}
            >
              GCODE AI
            </Text>

            <Text
              style={[
                styles.aiDescription,
                {
                  color: colors.muted,
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
                  colors.panel2,
              },
            ]}
          >
            <Text
              style={[
                styles.comingText,
                {
                  color: colors.muted,
                },
              ]}
            >
              Bientôt
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.footer,
            {
              color: colors.muted,
            },
          ]}
        >
          GCODE Mobile V3
        </Text>
      </ScrollView>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={closeCreateModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
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
                styles.modalTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Nouveau projet
            </Text>

            <Text
              style={[
                styles.modalDescription,
                {
                  color: colors.muted,
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
                colors.muted
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
                  color: colors.text,
                  backgroundColor:
                    colors.background,
                  borderColor:
                    colors.border,
                },
              ]}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeCreateModal}
                style={({ pressed }) => [
                  styles.modalCancel,
                  {
                    borderColor:
                      colors.border,
                    opacity: pressed
                      ? 0.7
                      : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Annuler
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCreateProject}
                style={({ pressed }) => [
                  styles.modalCreate,
                  {
                    backgroundColor:
                      colors.purple,
                    opacity: pressed
                      ? 0.75
                      : 1,
                  },
                ]}
              >
                <Text
                  style={styles.modalCreateText}
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
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 30,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  brand: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },

  subtitle: {
    fontSize: 12,
    marginTop: 4,
    maxWidth: 270,
    lineHeight: 18,
  },

  versionBadge: {
    minWidth: 42,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  versionText: {
    fontSize: 11,
    fontWeight: '800',
  },

  searchContainer: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 12,
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
    minHeight: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  createIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '400',
    marginRight: 8,
  },

  createText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },

  viewAll: {
    fontSize: 12,
    fontWeight: '700',
  },

  projectsList: {
    gap: 9,
    marginBottom: 26,
  },

  projectCard: {
    minHeight: 68,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  projectIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
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
    fontSize: 25,
    marginLeft: 8,
  },

  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
    marginBottom: 26,
  },

  emptyIcon: {
    fontSize: 25,
    fontWeight: '900',
    marginBottom: 10,
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
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
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
    marginBottom: 18,
  },

  quickAction: {
    minHeight: 68,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
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
  },

  quickTitle: {
    fontSize: 14,
    fontWeight: '800',
  },

  quickDescription: {
    fontSize: 11,
    marginTop: 4,
  },

  aiBanner: {
    minHeight: 76,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 25,
  },

  aiIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  aiIconText: {
    fontSize: 12,
    fontWeight: '900',
  },

  aiContent: {
    flex: 1,
  },

  aiTitle: {
    fontSize: 14,
    fontWeight: '900',
  },

  aiDescription: {
    fontSize: 11,
    marginTop: 4,
  },

  comingBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
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
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },

  modalCancel: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCreateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
