import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

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
  saveProjects,
} from './src/storage/projectStorage';

function GcodeApp() {
  const { colors } = useTheme();

  const [projects, setProjects] = useState([]);
  const [screen, setScreen] = useState('home');
  const [activeProject, setActiveProject] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const storedProjects = await loadProjects();

      if (!mounted) {
        return;
      }

      setProjects(storedProjects);
      setLoaded(true);
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  const handleCreateProject = async (
    projectName = 'Nouveau projet'
  ) => {
    const newProject = await createProject(
      projectName
    );

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
  };

  const handleOpenProject = (project) => {
    if (!project) {
      return;
    }

    setActiveProject(project);
    setScreen('workbench');
  };

  const handleProjectUpdated = (
    updatedProject
  ) => {
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
  };

  const handleDeleteProject = async (
    projectId
  ) => {
    const updatedProjects =
      await deleteProject(projectId);

    setProjects(updatedProjects);

    if (
      activeProject &&
      activeProject.id === projectId
    ) {
      setActiveProject(null);
      setScreen('projects');
    }
  };

  const handleBackToHome = () => {
    setScreen('home');
  };

  const handleBackToProjects = () => {
    setScreen('projects');
  };

  const handleOpenPreview = () => {
    if (!activeProject) {
      return;
    }

    setScreen('preview');
  };

  const handleBackFromPreview = () => {
    if (activeProject) {
      setScreen('workbench');
    } else {
      setScreen('home');
    }
  };

  const handleChangeScreen = (nextScreen) => {
    if (
      nextScreen === 'home' ||
      nextScreen === 'projects' ||
      nextScreen === 'settings'
    ) {
      setScreen(nextScreen);
    }
  };

  const refreshProjects = async () => {
    const latestProjects =
      await loadProjects();

    setProjects(latestProjects);

    if (activeProject) {
      const latestActiveProject =
        latestProjects.find(
          (item) =>
            item.id === activeProject.id
        );

      if (latestActiveProject) {
        setActiveProject(
          latestActiveProject
        );
      }
    }
  };

  useEffect(() => {
    if (
      screen === 'home' ||
      screen === 'projects'
    ) {
      refreshProjects();
    }
  }, [screen]);

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
              onBack={
                handleBackToProjects
              }
              onPreview={
                handleOpenPreview
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
              onBack={
                handleBackFromPreview
              }
            />
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
});
