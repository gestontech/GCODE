import React, {
  useEffect,
  useState,
} from 'react';

import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import WorkbenchScreen from './src/screens/WorkbenchScreen';
import PreviewScreen from './src/screens/PreviewScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import BottomNav from './src/components/BottomNav';

import {
  loadProjects,
  saveProjects,
  createProject,
  deleteProject,
} from './src/storage/projectStorage';

import {
  ThemeProvider,
  useTheme,
} from './src/theme/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <GCodeApp />
    </ThemeProvider>
  );
}

function GCodeApp() {
  const {
    colors,
    loaded: themeLoaded,
  } = useTheme();

  const [projects, setProjects] = useState([]);
  const [screen, setScreen] = useState('home');
  const [activeProject, setActiveProject] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const items = await loadProjects();

        if (mounted) {
          setProjects(items);
        }
      } catch (error) {
        console.error(
          'Erreur lors du chargement des projets:',
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

  useEffect(() => {
    if (!loaded) {
      return;
    }

    saveProjects(projects).catch((error) => {
      console.error(
        'Erreur lors de la sauvegarde:',
        error
      );
    });
  }, [projects, loaded]);

  function openProject(project) {
    setActiveProject(project);
    setScreen('workbench');
  }

  function newProject() {
    const project = createProject(
      'Nouveau projet'
    );

    setProjects((current) => [
      project,
      ...current,
    ]);

    setActiveProject(project);
    setScreen('workbench');
  }

  function updateProject(updatedProject) {
    setProjects((current) =>
      current.map((project) =>
        project.id === updatedProject.id
          ? updatedProject
          : project
      )
    );

    setActiveProject(updatedProject);
  }

  function removeProject(id) {
    setProjects((current) =>
      deleteProject(current, id)
    );

    if (activeProject?.id === id) {
      setActiveProject(null);
      setScreen('projects');
    }
  }

  function goHome() {
    setActiveProject(null);
    setScreen('home');
  }

  function openProjects() {
    setActiveProject(null);
    setScreen('projects');
  }

  if (!themeLoaded || !loaded) {
    return (
      <View
        style={[
          styles.loading,
          {
            backgroundColor:
              colors.background,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={colors.purple}
        />
      </View>
    );
  }

  let content = null;

  if (screen === 'home') {
    content = (
      <HomeScreen
        projects={projects}
        onNewProject={newProject}
        onOpenProject={openProject}
      />
    );
  }

  if (screen === 'projects') {
    content = (
      <ProjectsScreen
        projects={projects}
        onNewProject={newProject}
        onOpenProject={openProject}
        onDeleteProject={removeProject}
      />
    );
  }

  if (
    screen === 'workbench' &&
    activeProject
  ) {
    content = (
      <WorkbenchScreen
        project={activeProject}
        onChange={updateProject}
        onBack={goHome}
        onPreview={() =>
          setScreen('preview')
        }
      />
    );
  }

  if (
    screen === 'preview' &&
    activeProject
  ) {
    content = (
      <PreviewScreen
        project={activeProject}
        onBack={() =>
          setScreen('workbench')
        }
      />
    );
  }

  if (screen === 'settings') {
    content = <SettingsScreen />;
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
      <StatusBar
        barStyle={
          colors.background === '#070914'
            ? 'light-content'
            : 'dark-content'
        }
        backgroundColor={
          colors.background
        }
      />

      {content}

      {screen !== 'workbench' &&
        screen !== 'preview' && (
          <BottomNav
            active={screen}
            onChange={(nextScreen) => {
              if (
                nextScreen === 'projects'
              ) {
                openProjects();
                return;
              }

              if (
                nextScreen === 'home'
              ) {
                goHome();
                return;
              }

              setScreen(nextScreen);
            }}
          />
        )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
