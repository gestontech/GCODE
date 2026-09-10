import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

const items = [
  ['home', '⌂', 'Accueil'],
  ['projects', '▣', 'Projets'],
  ['ai', '✦', 'IA'],
  ['settings', '⚙', 'Réglages'],
];

export default function BottomNav({ active, onChange }) {
  return (
    <View style={styles.container}>
      {items.map(([id, icon, label]) => (
        <Pressable
          key={id}
          style={styles.item}
          onPress={() => onChange(id)}
        >
          <Text
            style={[
              styles.icon,
              active === id && styles.active,
            ]}
          >
            {icon}
          </Text>

          <Text
            style={[
              styles.label,
              active === id && styles.active,
            ]}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 72,
    backgroundColor: '#0d1020',
    borderTopWidth: 1,
    borderTopColor: '#242943',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  item: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },

  icon: {
    color: '#8189a6',
    fontSize: 21,
    marginBottom: 4,
  },

  label: {
    color: '#8189a6',
    fontSize: 11,
  },

  active: {
    color: '#a88bff',
  },
});
