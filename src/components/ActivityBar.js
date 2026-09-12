import React from 'react';

import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

const items = [
  ['explorer', '▤', 'Explorateur'],
  ['search', '⌕', 'Recherche'],
  ['git', '⑂', 'Contrôle de source'],
  ['run', '▷', 'Exécuter'],
  ['extensions', '▦', 'Extensions'],
];

export default function ActivityBar({
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
          borderRightColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.top,
          {
            paddingTop: spacing.xs,
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
              onPress={() => onChange(id)}
              hitSlop={4}
              style={({ pressed }) => [
                styles.item,
                {
                  borderRadius: radius.lg,
                  backgroundColor: isActive
                    ? colors.primarySoft
                    : colors.glassSoft,
                  borderColor: isActive
                    ? colors.primary
                    : colors.border,
                  opacity: pressed ? 0.68 : 1,
                  transform: [
                    {
                      scale: pressed ? 0.94 : 1,
                    },
                  ],
                  marginBottom: spacing.xs,
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
                numberOfLines={2}
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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Paramètres"
        onPress={() => onChange('settings')}
        hitSlop={4}
        style={({ pressed }) => [
          styles.settings,
          {
            backgroundColor: colors.glassSoft,
            borderColor: colors.border,
            borderRadius: radius.lg,
            marginBottom: spacing.xs,
            opacity: pressed ? 0.68 : 1,
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
            styles.settingsIcon,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          ⚙
        </Text>

        <Text
          style={[
            styles.settingsLabel,
            {
              color: colors.textMuted,
            },
          ]}
        >
          Réglages
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },

  top: {
    width: '100%',
    alignItems: 'center',
  },

  item: {
    width: 62,
    minHeight: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
    paddingVertical: 7,
  },

  icon: {
    fontSize: 23,
    lineHeight: 27,
    fontWeight: '600',
  },

  label: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },

  settings: {
    width: 62,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 7,
  },

  settingsIcon: {
    fontSize: 22,
    lineHeight: 26,
  },

  settingsLabel: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'center',
  },
});
