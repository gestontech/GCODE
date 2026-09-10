import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

const items = [
  ['explorer', '▤', 'Explorateur'],
  ['search', '⌕', 'Recherche'],
  ['git', '⑂', 'Contrôle de source'],
  ['run', '▷', 'Exécuter'],
  ['extensions', '▦', 'Extensions'],
];

export default function ActivityBar({ active, onChange }) {
  return (
    <View style={styles.container}>
      <View style={styles.top}>
        {items.map(([id, icon, label]) => (
          <Pressable
            key={id}
            style={[
              styles.item,
              active === id && styles.activeItem,
            ]}
            onPress={() => onChange(id)}
          >
            <Text
              style={[
                styles.icon,
                active === id && styles.activeIcon,
              ]}
            >
              {icon}
            </Text>

            <Text
              style={[
                styles.label,
                active === id && styles.activeLabel,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={styles.settings}
        onPress={() => onChange('settings')}
      >
        <Text style={styles.settingsIcon}>⚙</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 68,
    backgroundColor: '#090c17',
    borderRightWidth: 1,
    borderRightColor: '#22273a',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
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
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
  },

  activeItem: {
    borderLeftColor: '#8d70ff',
    backgroundColor: '#11152a',
  },

  icon: {
    color: '#777f9b',
    fontSize: 24,
  },

  activeIcon: {
    color: '#b39aff',
  },

  label: {
    color: '#666d86',
    fontSize: 8,
    marginTop: 4,
    textAlign: 'center',
  },

  activeLabel: {
    color: '#b39aff',
  },

  settings: {
    width: 62,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingsIcon: {
    color: '#777f9b',
    fontSize: 23,
  },
});
