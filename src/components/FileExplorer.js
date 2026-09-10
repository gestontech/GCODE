import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

function FileIcon({ name }) {
  const extension =
    name.split('.').pop()?.toLowerCase();

  const icons = {
    html: '◇',
    css: '#',
    js: 'JS',
    json: '{}',
    md: 'M',
  };

  return (
    <Text style={styles.fileIcon}>
      {icons[extension] || '•'}
    </Text>
  );
}

export default function FileExplorer({
  project,
  activeFile,
  onOpenFile,
}) {
  const files = project?.files || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            EXPLORATEUR
          </Text>

          <Text style={styles.projectName}>
            {project?.name || 'GCODE'}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.folder}>
          <Text style={styles.folderArrow}>
            ⌄
          </Text>

          <Text style={styles.folderIcon}>
            □
          </Text>

          <Text style={styles.folderName}>
            projet
          </Text>
        </View>

        {files.map((file) => (
          <Pressable
            key={file.id}
            onPress={() =>
              onOpenFile?.(file)
            }
            style={[
              styles.file,
              activeFile?.id === file.id &&
                styles.activeFile,
            ]}
          >
            <FileIcon name={file.name} />

            <Text
              numberOfLines={1}
              style={[
                styles.fileName,
                activeFile?.id === file.id &&
                  styles.activeFileName,
              ]}
            >
              {file.name}
            </Text>
          </Pressable>
        ))}

        {files.length === 0 && (
          <Text style={styles.empty}>
            Aucun fichier
          </Text>
        )}

        <View style={styles.folder}>
          <Text style={styles.folderArrow}>
            ›
          </Text>

          <Text style={styles.folderIcon}>
            □
          </Text>

          <Text style={styles.folderName}>
            assets
          </Text>
        </View>

        <View style={styles.folder}>
          <Text style={styles.folderArrow}>
            ›
          </Text>

          <Text style={styles.folderIcon}>
            □
          </Text>

          <Text style={styles.folderName}>
            components
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1020',
  },

  header: {
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#242943',
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    color: '#9ba3bd',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  projectName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 5,
  },

  content: {
    paddingVertical: 8,
  },

  folder: {
    height: 38,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  folderArrow: {
    color: '#858da7',
    width: 18,
    fontSize: 16,
  },

  folderIcon: {
    color: '#8d70ff',
    fontSize: 15,
    marginRight: 8,
  },

  folderName: {
    color: '#bfc4d5',
    fontSize: 13,
  },

  file: {
    height: 40,
    paddingLeft: 38,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  activeFile: {
    backgroundColor: '#1a1f35',
  },

  fileIcon: {
    width: 27,
    color: '#8d70ff',
    fontSize: 13,
    fontWeight: '800',
  },

  fileName: {
    flex: 1,
    color: '#aeb4c9',
    fontSize: 13,
  },

  activeFileName: {
    color: '#ffffff',
  },

  empty: {
    color: '#666d86',
    fontSize: 12,
    paddingHorizontal: 38,
    paddingVertical: 12,
  },
});
