import React from 'react';

import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

const items = [
  {
    id: 'home',
    label: 'Accueil',
    icon: '⌂',
  },
  {
    id: 'projects',
    label: 'Projets',
    icon: '▣',
  },
  {
    id: 'settings',
    label: 'Réglages',
    icon: '⚙',
  },
];

export default function BottomNav({
  currentScreen = 'home',
  onNavigate,
}) {
  const { colors } = useTheme();

  const handleNavigate = (screen) => {
    if (typeof onNavigate === 'function') {
      onNavigate(screen);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.panel,
          borderTopColor: colors.border,
        },
      ]}
    >
      {items.map((item) => {
        const selected =
          currentScreen === item.id;

        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{
              selected,
            }}
            onPress={() =>
              handleNavigate(item.id)
            }
            style={({ pressed }) => [
              styles.item,
              {
                opacity: pressed ? 0.65 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                selected && {
                  backgroundColor:
                    colors.panel2,
                },
              ]}
            >
              <Text
                style={[
                  styles.icon,
                  {
                    color: selected
                      ? colors.purple
                      : colors.muted,
                  },
                ]}
              >
                {item.icon}
              </Text>
            </View>

            <Text
              style={[
                styles.label,
                {
                  color: selected
                    ? colors.text
                    : colors.muted,
                },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 67,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: 5,
  },

  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconContainer: {
    minWidth: 42,
    minHeight: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: 20,
  },

  label: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
