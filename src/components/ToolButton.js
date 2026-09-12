import React from 'react';

import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export default function ToolButton({
  label,
  icon,
  onPress,
  disabled = false,
  loading = false,
  active = false,
  danger = false,
  compact = false,
  accessibilityLabel,
  style,
}) {
  const { theme } = useTheme();
  const { colors, radius, spacing } = theme;

  const isDisabled = disabled || loading;

  const backgroundColor = danger
    ? colors.dangerSoft
    : active
      ? colors.primarySoft
      : colors.glass;

  const borderColor = danger
    ? colors.danger
    : active
      ? colors.primary
      : colors.border;

  const textColor = danger
    ? colors.danger
    : active
      ? colors.primary
      : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{
        disabled: isDisabled,
        selected: active,
      }}
      disabled={isDisabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: compact ? 38 : 44,
          paddingHorizontal: compact
            ? spacing.sm
            : spacing.md,
          backgroundColor,
          borderColor,
          borderRadius: compact
            ? radius.md
            : radius.lg,
          opacity: isDisabled
            ? 0.42
            : pressed
              ? 0.7
              : 1,
          transform: [
            {
              scale:
                pressed && !isDisabled
                  ? 0.96
                  : 1,
            },
          ],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={textColor}
        />
      ) : (
        <>
          {icon ? (
            <Text
              style={[
                styles.icon,
                {
                  color: textColor,
                  marginRight: label
                    ? spacing.xs
                    : 0,
                },
              ]}
            >
              {icon}
            </Text>
          ) : null}

          {label ? (
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: textColor,
                },
              ]}
            >
              {label}
            </Text>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },

  icon: {
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '600',
  },

  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 0.05,
  },
});
