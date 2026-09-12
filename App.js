import React, { useCallback, useEffect, useState } from 'react';

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
  const [activeProject, setActiveProject] = useState(null);
  const [loaded, setLoaded] = useState(false);

  /*
   * Chargement initial des projets.
   */
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const storedProjects = await loadProjects();

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

  /*
   * Recharge les projets depuis le stockage local.
   */
  const refreshProjects = useCallback(async () => {
    try {
      const latestProjects = await loadProjects();

      setProjects(latestProjects);

      setActiveProject((currentActiveProject) => {
        if (!currentActiveProject) {
          return null;
        }

        const latestActiveProject =
          latestProjects.find(
            (item) =>
              item.id === currentActiveProject.id
          );

        return (
          latestActiveProject ||
          currentActiveProject
        );
      });
    } catch (error) {
      console.error(
        'Erreur de rafraîchissement des projets:',
        error
      );
    }
  }, []);

  /*
   * Synchronisation lorsque l'utilisateur revient
   * sur Accueil ou Projets.
   */
  useEffect(() => {
    if (
      screen === 'home' ||
      screen === 'projects'
    ) {
      refreshProjects();
    }
  }, [screen, refreshProjects]);

  /*
   * Création d'un projet.
   */
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

  /*
   * Ouverture d'un projet dans l'éditeur.
   */
  const handleOpenProject = (project) => {
    if (!project) {
      return;
    }

    setActiveProject(project);
    setScreen('workbench');
  };

  /*
   * Mise à jour du projet actif après une modification
   * effectuée dans Workbench.
   */
  const handleProjectUpdated = useCallback(
    (updatedProject) => {
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
    },
    []
  );

  /*
   * Suppression d'un projet.
   */
  const handleDeleteProject = async (
    projectId
  ) => {
    try {
      const updatedProjects =
        await deleteProject(projectId);

      setProjects(updatedProjects);

      setActiveProject((currentActiveProject) => {
        if (
          currentActiveProject &&
          currentActiveProject.id === projectId
        ) {
          return null;
        }

        return currentActiveProject;
      });

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

  /*
   * Ouverture de l'aperçu.
   */
  const handleOpenPreview = (project) => {
    const projectToPreview =
      project || activeProject;

    if (!projectToPreview) {
      return;
    }

    setActiveProject(projectToPreview);
    setScreen('preview');
  };

  /*
   * Retour depuis l'aperçu.
   */
  const handleBackFromPreview = () => {
    if (activeProject) {
      setScreen('workbench');
    } else {
      setScreen('home');
    }
  };

  /*
   * Navigation principale.
   */
  const handleChangeScreen = (
    nextScreen
  ) => {
    const allowedScreens = [
      'home',
      'projects',
      'settings',
    ];

    if (
      allowedScreens.includes(nextScreen)
    ) {
      setScreen(nextScreen);
    }
  };

  /*
   * Écran de chargement initial.
   */
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

  /*
   * La barre de navigation reste visible
   * uniquement sur les écrans principaux.
   */
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

        {/* ACCUEIL */}
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
          />
        )}

        {/* PROJETS */}
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

        {/* ÉDITEUR */}
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

        {/* APERÇU */}
        {screen === 'preview' &&
          activeProject && (
            <PreviewScreen
              project={activeProject}
              onBack={
                handleBackFromPreview
              }
            />
          )}

        {/* PARAMÈTRES */}
        {screen === 'settings' && (
          <SettingsScreen />
        )}

      </View>

      {/* NAVIGATION BASSE */}
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
});
