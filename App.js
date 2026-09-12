import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';

import { StatusBar } from 'expo-status-bar';

import {
  ThemeProvider,
  useTheme,
} from './src/theme/ThemeContext';

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

function GcodeApp() {
  const { colors } = useTheme();

  const [projects, setProjects] = useState([]);
  const [screen, setScreen] = useState('home');
  const [activeProject, setActiveProject] =
    useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const storedProjects =
          await loadProjects();

        if (!mounted) {
          return;
        }

        setProjects(storedProjects);
      } catch (error) {
        console.error(
          'Erreur de chargement des projets:',
          error
        );

        if (mounted) {
          setProjects([]);
        }
      } finally {
        if (mounted) {
          setLoaded(true);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshProjects =
    useCallback(async () => {
      try {
        const latestProjects =
          await loadProjects();

        setProjects(latestProjects);

        setActiveProject(
          (currentActiveProject) => {
            if (!currentActiveProject) {
              return null;
            }

            const latestActiveProject =
              latestProjects.find(
                (item) =>
                  item.id ===
                  currentActiveProject.id
              );

            return (
              latestActiveProject ||
              currentActiveProject
            );
          }
        );
      } catch (error) {
        console.error(
          'Erreur de rafraîchissement des projets:',
          error
        );
      }
    }, []);

  useEffect(() => {
    if (
      screen === 'home' ||
      screen === 'projects'
    ) {
      refreshProjects();
    }
  }, [screen, refreshProjects]);

  const handleCreateProject = async (
    projectName = 'Nouveau projet'
  ) => {
    try {
      const newProject =
        await createProject(projectName);

      if (!newProject) {
        return null;
      }

      setProjects((currentProjects) => [
        newProject,
        ...currentProjects,
      ]);

      setActiveProject(newProject);
      setScreen('workbench');

      return newProject;
    } catch (error) {
      console.error(
        'Erreur de création du projet:',
        error
      );

      return null;
    }
  };

  const handleOpenProject = (project) => {
    if (!project) {
      return;
    }

    setActiveProject(project);
    setScreen('workbench');
  };

  const handleProjectUpdated =
    useCallback((updatedProject) => {
      if (!updatedProject) {
        return;
      }

      setActiveProject(updatedProject);

      setProjects((currentProjects) =>
        currentProjects.map((item) =>
          item.id === updatedProject.id
            ? updatedProject
            : item
        )
      );
    }, []);

  const handleDeleteProject = async (
    projectId
  ) => {
    try {
      const updatedProjects =
        await deleteProject(projectId);

      setProjects(updatedProjects);

      setActiveProject(
        (currentActiveProject) => {
          if (
            currentActiveProject &&
            currentActiveProject.id ===
              projectId
          ) {
            return null;
          }

          return currentActiveProject;
        }
      );

      if (
        activeProject &&
        activeProject.id === projectId
      ) {
        setScreen('projects');
      }
    } catch (error) {
      console.error(
        'Erreur de suppression du projet:',
        error
      );
    }
  };

  const handleOpenPreview = (project) => {
    const projectToPreview =
      project || activeProject;

    if (!projectToPreview) {
      return;
    }

    setActiveProject(projectToPreview);
    setScreen('preview');
  };

  const handleOpenCommands = () => {
    setScreen('commands');
  };

  const handleOpenTerminal = () => {
    setScreen('terminal');
  };

  const handleOpenAI = () => {
    setScreen('ai');
  };

  const handleBackToHome = () => {
    setScreen('home');
  };

  const handleChangeScreen = (
    nextScreen
  ) => {
    const allowedScreens = [
      'home',
      'projects',
      'settings',
      'commands',
      'terminal',
      'ai',
    ];

    if (
      allowedScreens.includes(nextScreen)
    ) {
      setScreen(nextScreen);
    }
  };

  if (!loaded) {
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
        <StatusBar
          style={
            colors.background === '#070914'
              ? 'light'
              : 'dark'
          }
        />

        <ActivityIndicator
          size="large"
          color={colors.purple}
        />
      </SafeAreaView>
    );
  }

  const showBottomNav =
    screen === 'home' ||
    screen === 'projects' ||
    screen === 'settings';

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
      <StatusBar
        style={
          colors.background === '#070914'
            ? 'light'
            : 'dark'
        }
      />

      <View style={styles.content}>
        {screen === 'home' && (
          <HomeScreen
            projects={projects}
            onCreateProject={
              handleCreateProject
            }
            onOpenProject={
              handleOpenProject
            }
            onNavigate={
              handleChangeScreen
            }
            onOpenPreview={
              handleOpenPreview
            }
            onOpenCommands={
              handleOpenCommands
            }
            onOpenTerminal={
              handleOpenTerminal
            }
            onOpenAI={handleOpenAI}
          />
        )}

        {screen === 'projects' && (
          <ProjectsScreen
            projects={projects}
            onCreateProject={
              handleCreateProject
            }
            onOpenProject={
              handleOpenProject
            }
            onDeleteProject={
              handleDeleteProject
            }
          />
        )}

        {screen === 'workbench' &&
          activeProject && (
            <WorkbenchScreen
              project={activeProject}
              onBack={() =>
                setScreen('projects')
              }
              onPreview={() =>
                handleOpenPreview(
                  activeProject
                )
              }
              onProjectUpdated={
                handleProjectUpdated
              }
            />
          )}

        {screen === 'preview' &&
          activeProject && (
            <PreviewScreen
              project={activeProject}
              onBack={() => {
                if (activeProject) {
                  setScreen('workbench');
                } else {
                  setScreen('home');
                }
              }}
            />
          )}

        {screen === 'commands' && (
          <CommandsScreen
            onBack={handleBackToHome}
            onOpenTerminal={
              handleOpenTerminal
            }
            onOpenProject={() => {
              if (activeProject) {
                setScreen('workbench');
              } else if (
                projects.length > 0
              ) {
                setActiveProject(
                  projects[0]
                );
                setScreen('workbench');
              } else {
                setScreen('projects');
              }
            }}
          />
        )}

        {screen === 'terminal' && (
          <TerminalScreen
            project={activeProject}
            projects={projects}
            onBack={handleBackToHome}
          />
        )}

        {screen === 'ai' && (
          <View
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
                styles.aiCard,
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
                  styles.aiText,
                  {
                    color: colors.muted,
                  },
                ]}
              >
                Assistant intelligent GCODE.
                Le moteur IA sera activé dans
                une prochaine version.
              </Text>

              <Pressable
                onPress={handleBackToHome}
                style={[
                  styles.aiButton,
                  {
                    backgroundColor:
                      colors.purple,
                  },
                ]}
              >
                <Text
                  style={
                    styles.aiButtonText
                  }
                >
                  Retour à l'accueil
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {screen === 'settings' && (
          <SettingsScreen />
        )}
      </View>

      {showBottomNav && (
        <BottomNav
          currentScreen={screen}
          onNavigate={
            handleChangeScreen
          }
        />
      )}
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

  aiContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  aiCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
  },

  aiTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12,
  },

  aiText: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 22,
  },

  aiButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  aiButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
