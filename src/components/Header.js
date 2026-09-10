import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>G</Text>
      </View>

      <View>
        <Text style={styles.title}>GCODE</Text>
        <Text style={styles.subtitle}>Code. Build. Create.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#713cff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  logoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },

  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },

  subtitle: {
    color: '#8189a6',
    fontSize: 11,
    marginTop: 2,
  },
});
