import React from 'react';

import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

const items = [
  ['files', '▤', 'Fichiers'],
  ['editor', '✎', 'Éditeur'],
  ['preview', '▷', 'Aperçu'],
  ['terminal', '⌘', 'Terminal'],
];

export default function BottomNav({
  active,
  onChange,
}) {
  const { theme } = useTheme();
  const { colors, radius, spacing } = theme;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.glass,
          borderTopColor: colors.border,
        },
      ]}
    >
      {items.map(([id, icon, label]) => {
        const isActive = active === id;

        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{
              selected: isActive,
            }}
            onPress={() => onChange?.(id)}
            hitSlop={4}
            style={({ pressed }) => [
              styles.item,
              {
                backgroundColor: isActive
                  ? colors.primarySoft
                  : colors.glassSoft,
                borderColor: isActive
                  ? colors.primary
                  : colors.border,
                borderRadius: radius.lg,
                marginHorizontal: spacing.xs,
                opacity: pressed ? 0.68 : 1,
                transform: [
                  {
                    scale: pressed ? 0.95 : 1,
                  },
                ],
              },
            ]}
          >
            <Text
              style={[
                styles.icon,
                {
                  color: isActive
                    ? colors.primary
                    : colors.textSecondary,
                },
              ]}
            >
              {icon}
            </Text>

            <Text
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: isActive
                    ? colors.primary
                    : colors.textMuted,
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    paddingVertical: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  item: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
    paddingVertical: 5,
  },

  icon: {
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '600',
  },

  label: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'center',
  },
});
