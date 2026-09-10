import React from 'react';

import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export default function Header({
  title = 'GCODE',
  subtitle,
  onBack,
  right,
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
      {onBack ? (
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            {
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.back,
              { color: colors.text },
            ]}
          >
            ‹
          </Text>
        </Pressable>
      ) : (
        <View style={styles.leftSpacer} />
      )}

      <View style={styles.center}>
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            { color: colors.text },
          ]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            numberOfLines={1}
            style={[
              styles.subtitle,
              { color: colors.muted },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 58,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  back: {
    fontSize: 34,
    fontWeight: '300',
    marginTop: -3,
  },

  leftSpacer: {
    width: 42,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 15,
    fontWeight: '900',
  },

  subtitle: {
    fontSize: 10,
    marginTop: 2,
  },

  right: {
    minWidth: 42,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
