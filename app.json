import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import EditorScreen from './src/screens/EditorScreen';
import PreviewScreen from './src/screens/PreviewScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import BottomNav from './src/components/BottomNav';

import {
  loadProjects,
  saveProjects,
  createProject,
  deleteProject,
} from './src/storage/projectStorage';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [screen, setScreen] = useState('home');
  const [activeProject, setActiveProject] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadProjects().then((items) => {
      setProjects(items);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      saveProjects(projects);
    }
  }, [projects, loaded]);

  function openProject(project) {
    setActiveProject(project);
    setScreen('editor');
  }

  function newProject() {
    const project = createProject('Nouveau projet');

    setProjects((current) => [project, ...current]);
    setActiveProject(project);
    setScreen('editor');
  }

  function updateProject(updated) {
    setProjects((current) =>
      current.map((project) =>
        project.id === updated.id ? updated : project
      )
    );

    setActiveProject(updated);
  }

  function removeProject(id) {
    setProjects((current) => deleteProject(current, id));

    if (activeProject?.id === id) {
      setActiveProject(null);
      setScreen('projects');
    }
  }

  function goHome() {
    setActiveProject(null);
    setScreen('home');
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

  if (screen === 'editor' && activeProject) {
    content = (
      <EditorScreen
        project={activeProject}
        onChange={updateProject}
        onBack={goHome}
        onPreview={() => setScreen('preview')}
      />
    );
  }

  if (screen === 'preview' && activeProject) {
    content = (
      <PreviewScreen
        project={activeProject}
        onBack={() => setScreen('editor')}
      />
    );
  }

  if (screen === 'settings') {
    content = <SettingsScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {content}

      {screen !== 'editor' &&
        screen !== 'preview' && (
          <BottomNav
            active={screen}
            onChange={setScreen}
          />
        )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070914',
  },
});
