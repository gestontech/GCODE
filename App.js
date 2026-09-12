import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import WorkbenchScreen from './src/screens/WorkbenchScreen';
import PreviewScreen from './src/screens/PreviewScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CommandsScreen from './src/screens/CommandsScreen';
import TerminalScreen from './src/screens/TerminalScreen';

import BottomNav from './src/components/BottomNav';

import {
  createProject,
  deleteProject,
  loadProjects,
} from './src/storage/projectStorage';

const COLORS = {
  background: '#070914',
  surface: '#0d1120',
  border: '#20283d',
  text: '#f5f7ff',
  muted: '#8f98ad',
  primary: '#7c5cff',
};

export default function App() {
  const [screen, setScreen] = useState('home');
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [loading, setLoading] = useState(true);

  const activeProject =
    projects.find(
      (project) => project.id === activeProjectId
    ) || null;

  const refreshProjects = useCallback(async () => {
    try {
      const storedProjects = await loadProjects();

      setProjects(storedProjects);

      setActiveProjectId((currentId) => {
        if (
          currentId &&
          storedProjects.some(
            (project) => project.id === currentId
          )
        ) {
          return currentId;
        }

        return storedProjects[0]?.id || null;
      });
    } catch (error) {
      console.error(
        'Erreur lors du chargement des projets :',
        error
      );
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const storedProjects = await loadProjects();

        if (!mounted) {
          return;
        }

        setProjects(storedProjects);

        setActiveProjectId(
          storedProjects[0]?.id || null
        );
      } catch (error) {
        console.error(
          'Erreur initialisation GCODE :',
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  const handleCreateProject = useCallback(
    async (name) => {
      try {
        const project = await createProject(name);

        await refreshProjects();

        if (project?.id) {
          setActiveProjectId(project.id);
        }

        setScreen('workbench');
      } catch (error) {
        console.error(
          'Erreur création projet :',
          error
        );
      }
    },
    [refreshProjects]
  );

  const handleDeleteProject = useCallback(
    async (projectId) => {
      try {
        await deleteProject(projectId);

        const remainingProjects =
          await loadProjects();

        setProjects(remainingProjects);

        setActiveProjectId((currentId) => {
          if (currentId !== projectId) {
            return currentId;
          }

          return remainingProjects[0]?.id || null;
        });

        if (remainingProjects.length === 0) {
          setScreen('home');
        }
      } catch (error) {
        console.error(
          'Erreur suppression projet :',
          error
        );
      }
    },
    []
  );

  const openProject = useCallback(
    (project) => {
      if (!project?.id) {
        return;
      }

      setActiveProjectId(project.id);
      setScreen('workbench');
    },
    []
  );

  const goHome = useCallback(() => {
    setScreen('home');
  }, []);

  const goProjects = useCallback(() => {
    setScreen('projects');
  }, []);

  const goWorkbench = useCallback(() => {
    if (activeProject) {
      setScreen('workbench');
    } else {
      setScreen('projects');
    }
  }, [activeProject]);

  const goPreview = useCallback(() => {
    if (activeProject) {
      setScreen('preview');
    } else {
      setScreen('projects');
    }
  }, [activeProject]);

  const goSettings = useCallback(() => {
    setScreen('settings');
  }, []);

  const goCommands = useCallback(() => {
    setScreen('commands');
  }, []);

  const goTerminal = useCallback(() => {
    setScreen('terminal');
  }, []);

  const goAI = useCallback(() => {
    setScreen('ai');
  }, []);

  const handleProjectUpdated = useCallback(
    async (updatedProject) => {
      if (!updatedProject?.id) {
        return;
      }

      await refreshProjects();

      setActiveProjectId(updatedProject.id);
    },
    [refreshProjects]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text style={styles.loadingText}>
          Chargement de GCODE...
        </Text>
      </SafeAreaView>
    );
  }

  let content = null;

  /*
   * HOME
   */
  if (screen === 'home') {
    content = (
      <HomeScreen
        projects={projects}
        onOpenProject={openProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}

        onOpenProjects={goProjects}
        onOpenSettings={goSettings}
        onOpenCommands={goCommands}
        onOpenTerminal={goTerminal}
        onOpenAI={goAI}
        onOpenPreview={goPreview}
      />
    );
  }

  /*
   * PROJECTS
   */
  if (screen === 'projects') {
    content = (
      <ProjectsScreen
        projects={projects}
        onOpenProject={openProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onBack={goHome}
      />
    );
  }

  /*
   * WORKBENCH
   */
  if (screen === 'workbench') {
    if (!activeProject) {
      content = (
        <EmptyState
          title="Aucun projet ouvert"
          message="Crée ou sélectionne un projet pour commencer."
          onPress={goProjects}
          buttonText="Ouvrir les projets"
        />
      );
    } else {
      content = (
        <WorkbenchScreen
          project={activeProject}
          projects={projects}

          onBack={goHome}

          onOpenProjects={goProjects}
          onOpenSettings={goSettings}
          onOpenTerminal={goTerminal}
          onOpenCommands={goCommands}
          onOpenAI={goAI}

          onOpenPreview={goPreview}
          onProjectUpdated={handleProjectUpdated}
        />
      );
    }
  }

  /*
   * PREVIEW
   */
  if (screen === 'preview') {
    if (!activeProject) {
      content = (
        <EmptyState
          title="Aucun projet à prévisualiser"
          message="Sélectionne un projet avant d'ouvrir l'aperçu."
          onPress={goProjects}
          buttonText="Ouvrir les projets"
        />
      );
    } else {
      content = (
        <PreviewScreen
          project={activeProject}
          onBack={goWorkbench}
        />
      );
    }
  }

  /*
   * SETTINGS
   */
  if (screen === 'settings') {
    content = (
      <SettingsScreen
        onBack={goHome}
      />
    );
  }

  /*
   * COMMANDS
   */
  if (screen === 'commands') {
    content = (
      <CommandsScreen
        onBack={goHome}
        onOpenTerminal={goTerminal}
        onOpenWorkbench={goWorkbench}
        onOpenProjects={goProjects}
      />
    );
  }

  /*
   * TERMINAL
   */
  if (screen === 'terminal') {
    content = (
      <TerminalScreen
        project={activeProject}
        projects={projects}
        onBack={goHome}
        onProjectUpdated={handleProjectUpdated}
      />
    );
  }

  /*
   * GCODE AI
   */
  if (screen === 'ai') {
    content = (
      <SafeAreaView style={styles.aiContainer}>
        <View style={styles.aiHeader}>
          <Pressable
            onPress={goHome}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>
              ‹
            </Text>
          </Pressable>

          <View>
            <Text style={styles.aiTitle}>
              GCODE AI
            </Text>

            <Text style={styles.aiSubtitle}>
              Assistant de développement
            </Text>
          </View>
        </View>

        <View style={styles.aiCard}>
          <Text style={styles.aiIcon}>
            ✦
          </Text>

          <Text style={styles.aiCardTitle}>
            GCODE AI
          </Text>

          <Text style={styles.aiCardText}>
            L'espace IA est prêt à être intégré
            ultérieurement. Les fonctions principales
            de GCODE restent entièrement utilisables
            sans API externe.
          </Text>

          <View style={styles.aiStatus}>
            <View style={styles.aiStatusDot} />

            <Text style={styles.aiStatusText}>
              Module prêt
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const showBottomNav = [
    'home',
    'projects',
    'workbench',
    'settings',
  ].includes(screen);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {content}
      </View>

      {showBottomNav && (
        <BottomNav
          activeTab={
            screen === 'workbench'
              ? 'editor'
              : screen
          }
          onHome={goHome}
          onProjects={goProjects}
          onEditor={goWorkbench}
          onSettings={goSettings}
        />
      )}
    </SafeAreaView>
  );
}

function EmptyState({
  title,
  message,
  onPress,
  buttonText,
}) {
  return (
    <SafeAreaView style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>
        {title}
      </Text>

      <Text style={styles.emptyMessage}>
        {message}
      </Text>

      <Pressable
        onPress={onPress}
        style={styles.emptyButton}
      >
        <Text style={styles.emptyButtonText}>
          {buttonText}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },

  loadingText: {
    marginTop: 14,
    color: COLORS.muted,
    fontSize: 14,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyMessage: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
  },

  emptyButton: {
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  aiContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  aiHeader: {
    minHeight: 76,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#151a2c',
  },

  backButtonText: {
    color: COLORS.text,
    fontSize: 30,
    lineHeight: 32,
  },

  aiTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },

  aiSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },

  aiCard: {
    margin: 20,
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },

  aiIcon: {
    color: COLORS.primary,
    fontSize: 32,
    marginBottom: 10,
  },

  aiCardTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
  },

  aiCardText: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },

  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
  },

  aiStatusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#45d483',
    marginRight: 8,
  },

  aiStatusText: {
    color: '#45d483',
    fontSize: 13,
    fontWeight: '700',
  },
});
