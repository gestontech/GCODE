import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';

import ProjectCard from '../components/ProjectCard';

export default function ProjectsScreen({
  projects,
  onNewProject,
  onOpenProject,
  onDeleteProject,
}) {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Mes projets</Text>
            <Text style={styles.subtitle}>
              {projects.length} projet(s)
            </Text>
          </View>

          <Pressable
            style={styles.add}
            onPress={onNewProject}
          >
            <Text style={styles.addText}>＋</Text>
          </Pressable>
        </View>

        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onOpen={onOpenProject}
            onDelete={onDeleteProject}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070914',
  },

  content: {
    padding: 20,
    paddingBottom: 30,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },

  subtitle: {
    color: '#8189a6',
    marginTop: 5,
  },

  add: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#713cff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addText: {
    color: '#fff',
    fontSize: 25,
  },
});
