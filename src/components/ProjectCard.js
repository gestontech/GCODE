import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function ProjectCard({
  project,
  onOpen,
  onDelete,
}) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => onOpen(project)}
      onLongPress={() => onDelete(project.id)}
    >
      <View style={styles.icon}>
        <Text style={styles.iconText}>
          {project.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{project.name}</Text>
        <Text style={styles.type}>{project.type}</Text>
      </View>

      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0d1020',
    borderWidth: 1,
    borderColor: '#242943',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#713cff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  iconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },

  info: {
    flex: 1,
  },

  name: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  type: {
    color: '#8189a6',
    fontSize: 12,
    marginTop: 4,
  },

  arrow: {
    color: '#8189a6',
    fontSize: 25,
  },
});
