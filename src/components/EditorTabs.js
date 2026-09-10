import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

function getIcon(name = '') {
  const lower = name.toLowerCase();

  if (lower.endsWith('.html') || lower.endsWith('.htm')) {
    return '◇';
  }

  if (lower.endsWith('.css')) {
    return '#';
  }

  if (
    lower.endsWith('.js') ||
    lower.endsWith('.jsx') ||
    lower.endsWith('.ts') ||
    lower.endsWith('.tsx')
  ) {
    return 'JS';
  }

  if (lower.endsWith('.json')) {
    return '{}';
  }

  if (lower.endsWith('.md')) {
    return 'M';
  }

  return '•';
}

export default function EditorTabs({
  files = [],
  activeFile,
  onSelect,
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.panel,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {files.map((file) => {
          const active =
            activeFile?.id === file.id;

          return (
            <Pressable
              key={file.id}
              onPress={() => onSelect?.(file)}
              style={({ pressed }) => [
                styles.tab,
                {
                  backgroundColor: active
                    ? colors.panel2
                    : colors.panel,
                  borderRightColor:
                    colors.border,
                  borderTopColor:
                    active
                      ? colors.purple
                      : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.icon,
                  {
                    color: active
                      ? colors.purple
                      : colors.muted,
                  },
                ]}
              >
                {getIcon(file.name)}
              </Text>

              <Text
                numberOfLines={1}
                style={[
                  styles.name,
                  {
                    color: active
                      ? colors.text
                      : colors.muted,
                  },
                ]}
              >
                {file.name}
              </Text>

              {active && (
                <Text
                  style={[
                    styles.close,
                    {
                      color: colors.muted,
                    },
                  ]}
                >
                  ×
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 46,
    borderBottomWidth: 1,
  },

  tab: {
    minWidth: 125,
    maxWidth: 190,
    height: 46,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRightWidth: 1,
    borderTopWidth: 2,
  },

  icon: {
    fontSize: 12,
    fontWeight: '800',
    marginRight: 8,
  },

  name: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },

  close: {
    fontSize: 18,
    marginLeft: 8,
    lineHeight: 20,
  },
});
