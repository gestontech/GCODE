import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

function getIcon(name) {
  if (name.endsWith('.html')) {
    return '◇';
  }

  if (name.endsWith('.css')) {
    return '#';
  }

  if (
    name.endsWith('.js') ||
    name.endsWith('.jsx')
  ) {
    return 'JS';
  }

  if (name.endsWith('.json')) {
    return '{}';
  }

  return '•';
}

export default function EditorTabs({
  files = [],
  activeFile,
  onSelect,
}) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {files.map((file) => (
          <Pressable
            key={file.id}
            onPress={() => onSelect?.(file)}
            style={[
              styles.tab,
              activeFile?.id === file.id &&
                styles.activeTab,
            ]}
          >
            <Text style={styles.icon}>
              {getIcon(file.name)}
            </Text>

            <Text
              numberOfLines={1}
              style={[
                styles.name,
                activeFile?.id === file.id &&
                  styles.activeName,
              ]}
            >
              {file.name}
            </Text>

            {activeFile?.id === file.id && (
              <Text style={styles.close}>
                ×
              </Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 46,
    backgroundColor: '#0b0e1a',
    borderBottomWidth: 1,
    borderBottomColor: '#242943',
  },

  tab: {
    minWidth: 125,
    maxWidth: 180,
    height: 46,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#242943',
  },

  activeTab: {
    backgroundColor: '#11152a',
    borderTopWidth: 2,
    borderTopColor: '#8d70ff',
  },

  icon: {
    color: '#8d70ff',
    fontSize: 12,
    fontWeight: '800',
    marginRight: 8,
  },

  name: {
    flex: 1,
    color: '#777f9b',
    fontSize: 12,
  },

  activeName: {
    color: '#ffffff',
  },

  close: {
    color: '#8b92aa',
    fontSize: 18,
    marginLeft: 8,
  },
});
