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
  onOpenAI,
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
          style={styles.aiBox}
          onPress={onOpenAI}
        >
          <Text style={styles.aiIcon}>✦</Text>

          <View style={styles.aiInfo}>
            <Text style={styles.aiTitle}>
              Décrivez votre idée
            </Text>

            <Text style={styles.aiSubtitle}>
              Créez un projet avec GCODE AI
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Pressable
          style={styles.primary}
          onPress={onOpenAI}
        >
          <Text style={styles.primaryText}>
            ✨ Créer avec l'IA
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondary}
          onPress={onNewProject}
        >
          <Text style={styles.secondaryText}>
            ＋ Nouveau projet
          </Text>
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

  aiBox: {
    backgroundColor: '#11152a',
    borderWidth: 1,
    borderColor: '#30285b',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  aiIcon: {
    color: '#a88bff',
    fontSize: 28,
    marginRight: 14,
  },

  aiInfo: {
    flex: 1,
  },

  aiTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  aiSubtitle: {
    color: '#8189a6',
    fontSize: 12,
    marginTop: 5,
  },

  arrow: {
    color: '#8189a6',
    fontSize: 25,
  },

  primary: {
    backgroundColor: '#713cff',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },

  primaryText: {
    color: '#fff',
    fontWeight: '800',
  },

  secondary: {
    backgroundColor: '#0d1020',
    borderWidth: 1,
    borderColor: '#242943',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },

  secondaryText: {
    color: '#fff',
    fontWeight: '700',
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
