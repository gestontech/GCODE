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
  const { theme } = useTheme();
  const { colors, radius, spacing } = theme;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.glass,
          borderBottomColor: colors.border,
          paddingHorizontal: spacing.sm,
        },
      ]}
    >
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: colors.glassSoft,
              borderColor: colors.border,
              borderRadius: radius.pill,
              opacity: pressed ? 0.55 : 1,
              transform: [
                {
                  scale: pressed ? 0.94 : 1,
                },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.back,
              {
                color: colors.text,
              },
            ]}
          >
            ‹
          </Text>
        </Pressable>
      ) : (
        <View style={styles.leftSpacer} />
      )}

      <View
        style={[
          styles.center,
          {
            paddingHorizontal: spacing.sm,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            numberOfLines={1}
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
              },
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
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  actionButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  back: {
    fontSize: 34,
    fontWeight: '300',
    lineHeight: 38,
    marginTop: -3,
  },

  leftSpacer: {
    width: 42,
    height: 42,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },

  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.1,
  },

  subtitle: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },

  right: {
    minWidth: 42,
    minHeight: 42,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
