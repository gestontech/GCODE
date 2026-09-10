import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';

import Header from '../components/Header';
import ProjectCard from '../components/ProjectCard';

export default function HomeScreen({
  projects,
  onNewProject,
  onOpenProject,
}) {
  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>GCODE V3</Text>

        <Text style={styles.title}>
          Bonjour 👋
        </Text>

        <Text style={styles.subtitle}>
          Que voulez-vous créer aujourd'hui ?
        </Text>

        <Pressable
          style={styles.newProject}
          onPress={onNewProject}
        >
          <Text style={styles.newProjectIcon}>＋</Text>

          <View style={styles.newProjectInfo}>
            <Text style={styles.newProjectTitle}>
              Nouveau projet
            </Text>

            <Text style={styles.newProjectSubtitle}>
              Commencez à développer votre projet
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>
          Projets récents
        </Text>

        {projects.slice(0, 5).map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onOpen={onOpenProject}
            onDelete={() => {}}
          />
        ))}

        {projects.length === 0 && (
          <Text style={styles.empty}>
            Aucun projet pour le moment.
          </Text>
        )}
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

  eyebrow: {
    color: '#8d70ff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },

  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 5,
  },

  subtitle: {
    color: '#8189a6',
    fontSize: 15,
    marginTop: 5,
    marginBottom: 20,
  },

  newProject: {
    backgroundColor: '#11152a',
    borderWidth: 1,
    borderColor: '#30285b',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  newProjectIcon: {
    color: '#a88bff',
    fontSize: 30,
    marginRight: 14,
  },

  newProjectInfo: {
    flex: 1,
  },

  newProjectTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  newProjectSubtitle: {
    color: '#8189a6',
    fontSize: 12,
    marginTop: 5,
  },

  arrow: {
    color: '#8189a6',
    fontSize: 25,
  },

  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 28,
    marginBottom: 12,
  },

  empty: {
    color: '#8189a6',
    textAlign: 'center',
    marginTop: 30,
  },
});
