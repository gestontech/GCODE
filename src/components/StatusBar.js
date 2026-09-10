import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export default function StatusBar({
  language = 'HTML',
  line = 1,
  column = 1,
  branch = 'main',
  encoding = 'UTF-8',
  spaces = 2,
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.panel2,
          borderTopColor: colors.border,
        },
      ]}
    >
      {/* GAUCHE */}
      <View style={styles.left}>
        <View style={styles.itemGroup}>
          <Text
            style={[
              styles.item,
              {
                color: colors.text,
              },
            ]}
          >
            ⑂
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.item,
              {
                color: colors.text,
              },
            ]}
          >
            {branch}
          </Text>
        </View>

        <View style={styles.itemGroup}>
          <Text
            style={[
              styles.item,
              {
                color: colors.green,
              },
            ]}
          >
            ✓
          </Text>
        </View>
      </View>

      {/* DROITE */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={
          styles.right
        }
      >
        <Text
          style={[
            styles.item,
            {
              color: colors.text,
            },
          ]}
        >
          Ln {line}, Col {column}
        </Text>

        <Text
          style={[
            styles.separator,
            {
              color: colors.border,
            },
          ]}
        >
          |
        </Text>

        <Text
          style={[
            styles.item,
            {
              color: colors.muted,
            },
          ]}
        >
          Spaces: {spaces}
        </Text>

        <Text
          style={[
            styles.separator,
            {
              color: colors.border,
            },
          ]}
        >
          |
        </Text>

        <Text
          style={[
            styles.item,
            {
              color: colors.muted,
            },
          ]}
        >
          {encoding}
        </Text>

        <Text
          style={[
            styles.separator,
            {
              color: colors.border,
            },
          ]}
        >
          |
        </Text>

        <Text
          style={[
            styles.item,
            {
              color: colors.blue,
            },
          ]}
        >
          {String(language).toUpperCase()}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 27,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },

  right: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },

  itemGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },

  item: {
    fontSize: 9,
    marginHorizontal: 3,
    fontWeight: '500',
  },

  separator: {
    fontSize: 9,
    marginHorizontal: 3,
  },
});
