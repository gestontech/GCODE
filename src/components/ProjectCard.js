import React from 'react';

import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export default function ProjectCard({
  project,
  onPress,
  onDelete,
}) {
  const { colors, radius } = useTheme();

  if (!project) {
    return null;
  }

  const fileCount = project.files?.length || 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.panel,
          borderColor: colors.border,
          borderRadius: radius.md,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.main,
          {
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.icon,
            { backgroundColor: colors.panel2 },
          ]}
        >
          <Text style={styles.iconText}>📁</Text>
        </View>

        <View style={styles.content}>
          <Text
            numberOfLines={1}
            style={[
              styles.name,
              { color: colors.text },
            ]}
          >
            {project.name || 'Projet sans nom'}
          </Text>

          <Text
            style={[
              styles.details,
              { color: colors.muted },
            ]}
          >
            {fileCount} fichier
            {fileCount !== 1 ? 's' : ''}
          </Text>
        </View>

        <Text
          style={[
            styles.arrow,
            { color: colors.muted },
          ]}
        >
          ›
        </Text>
      </Pressable>

      {onDelete ? (
        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [
            styles.delete,
            {
              borderTopColor: colors.border,
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.deleteText,
              { color: colors.red },
            ]}
          >
            Supprimer
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },

  main: {
    minHeight: 72,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  icon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconText: {
    fontSize: 20,
  },

  content: {
    flex: 1,
    marginLeft: 12,
  },

  name: {
    fontSize: 14,
    fontWeight: '800',
  },

  details: {
    fontSize: 12,
    marginTop: 4,
  },

  arrow: {
    fontSize: 25,
    marginLeft: 8,
  },

  delete: {
    minHeight: 38,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
