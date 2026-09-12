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

import {
  ThemeProvider,
  useTheme,
} from './src/theme/ThemeContext';

function GcodeApp() {
  const { theme } = useTheme();
  const { colors, radius, spacing } = theme;

  const [screen, setScreen] = useState('home');
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] =
    useState(null);
  const [loading, setLoading] = useState(true);

  const activeProject =
    projects.find(
      (project) =>
        project.id === activeProjectId
    ) || null;

  const refreshProjects = useCallback(async () => {
    try {
      const storedProjects =
        await loadProjects();

      setProjects(storedProjects);

      setActiveProjectId((currentId) => {
        if (
          currentId &&
          storedProjects.some(
            (project) =>
              project.id === currentId
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
        const storedProjects =
          await loadProjects();

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
        const project =
          await createProject(name);

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

  const handleDeleteProject =
    useCallback(
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

            return (
              remainingProjects[0]?.id ||
              null
            );
          });

          if (
            remainingProjects.length === 0
          ) {
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

  const handleProjectUpdated =
    useCallback(
      async (updatedProject) => {
        if (!updatedProject?.id) {
          return;
        }

        await refreshProjects();

        setActiveProjectId(
          updatedProject.id
        );
      },
      [refreshProjects]
    );

  if (loading) {
    return (
      <SafeAreaView
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
            styles.loadingGlass,
            {
              backgroundColor: colors.glass,
              borderColor: colors.border,
              borderRadius: radius.xl,
              padding: spacing.lg,
            },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text
            style={[
              styles.loadingText,
              {
                color: colors.textSecondary,
                marginTop: spacing.sm,
              },
            ]}
          >
            Chargement de GCODE...
          </Text>
        </View>
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
        onCreateProject={
          handleCreateProject
        }
        onDeleteProject={
          handleDeleteProject
        }
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
        onCreateProject={
          handleCreateProject
        }
        onDeleteProject={
          handleDeleteProject
        }
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
          onProjectUpdated={
            handleProjectUpdated
          }
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
        onProjectUpdated={
          handleProjectUpdated
        }
      />
    );
  }

  /*
   * GCODE AI
   */
  if (screen === 'ai') {
    content = (
      <SafeAreaView
        style={[
          styles.aiContainer,
          {
            backgroundColor:
              colors.background,
          },
        ]}
      >
        <View
          style={[
            styles.aiHeader,
            {
              backgroundColor: colors.glass,
              borderBottomColor:
                colors.border,
              paddingHorizontal:
                spacing.sm,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={goHome}
            hitSlop={6}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor:
                  colors.glassSoft,
                borderColor:
                  colors.border,
                borderRadius:
                  radius.pill,
                opacity: pressed
                  ? 0.68
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
                styles.backButtonText,
                {
                  color: colors.text,
                },
              ]}
            >
              ‹
            </Text>
          </Pressable>

          <View>
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
                styles.aiSubtitle,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Assistant de développement
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.aiCard,
            {
              backgroundColor:
                colors.glass,
              borderColor:
                colors.border,
              borderRadius:
                radius.xl,
              margin: spacing.md,
              padding: spacing.lg,
            },
          ]}
        >
          <Text
            style={[
              styles.aiIcon,
              {
                color: colors.primary,
              },
            ]}
          >
            ✦
          </Text>

          <Text
            style={[
              styles.aiCardTitle,
              {
                color: colors.text,
              },
            ]}
          >
            GCODE AI
          </Text>

          <Text
            style={[
              styles.aiCardText,
              {
                color:
                  colors.textSecondary,
                marginTop: spacing.sm,
              },
            ]}
          >
            L'espace IA est prêt à être
            intégré ultérieurement. Les
            fonctions principales de GCODE
            restent entièrement utilisables
            sans API externe.
          </Text>

          <View
            style={[
              styles.aiStatus,
              {
                marginTop: spacing.md,
              },
            ]}
          >
            <View
              style={[
                styles.aiStatusDot,
                {
                  backgroundColor:
                    colors.success,
                },
              ]}
            />

            <Text
              style={[
                styles.aiStatusText,
                {
                  color: colors.success,
                },
              ]}
            >
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

  let bottomActive = 'files';

  if (screen === 'workbench') {
    bottomActive = 'editor';
  }

  if (screen === 'settings') {
    bottomActive = 'files';
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <View style={styles.content}>
        {content}
      </View>

      {showBottomNav ? (
        <BottomNav
          active={bottomActive}
          onChange={(id) => {
            if (id === 'files') {
              goProjects();
              return;
            }

            if (id === 'editor') {
              goWorkbench();
              return;
            }

            if (id === 'preview') {
              goPreview();
              return;
            }

            if (id === 'terminal') {
              goTerminal();
            }
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function EmptyState({
  title,
  message,
  onPress,
  buttonText,
}) {
  const { theme } = useTheme();
  const { colors, radius, spacing } = theme;

  return (
    <SafeAreaView
      style={[
        styles.emptyContainer,
        {
          backgroundColor:
            colors.background,
          padding: spacing.lg,
        },
      ]}
    >
      <View
        style={[
          styles.emptyGlass,
          {
            backgroundColor: colors.glass,
            borderColor: colors.border,
            borderRadius: radius.xl,
            padding: spacing.lg,
          },
        ]}
      >
        <Text
          style={[
            styles.emptyTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.emptyMessage,
            {
              color: colors.textSecondary,
              marginTop: spacing.sm,
              marginBottom: spacing.md,
            },
          ]}
        >
          {message}
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          hitSlop={4}
          style={({ pressed }) => [
            styles.emptyButton,
            {
              backgroundColor:
                colors.primarySoft,
              borderColor:
                colors.primary,
              borderRadius: radius.lg,
              opacity: pressed ? 0.68 : 1,
              transform: [
                {
                  scale: pressed ? 0.97 : 1,
                },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.emptyButtonText,
              {
                color: colors.primary,
              },
            ]}
          >
            {buttonText}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <GcodeApp />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingGlass: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
  },

  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyGlass: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyMessage: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },

  emptyButton: {
    minHeight: 48,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
  },

  emptyButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },

  aiContainer: {
    flex: 1,
  },

  aiHeader: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  backButton: {
    width: 42,
    height: 42,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
  },

  backButtonText: {
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '300',
  },

  aiTitle: {
    fontSize: 18,
    fontWeight: '900',
  },

  aiSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  aiCard: {
    borderWidth:
      StyleSheet.hairlineWidth,
  },

  aiIcon: {
    fontSize: 32,
    marginBottom: 10,
  },

  aiCardTitle: {
    fontSize: 22,
    fontWeight: '900',
  },

  aiCardText: {
    fontSize: 14,
    lineHeight: 22,
  },

  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  aiStatusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 8,
  },

  aiStatusText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
