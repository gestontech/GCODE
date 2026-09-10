import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

const tabs = [
  ['terminal', 'TERMINAL'],
  ['problems', 'PROBLÈMES'],
  ['output', 'SORTIE'],
];

export default function BottomPanel({
  active = 'terminal',
  onChange,
}) {
  const selectTab = (id) => {
    onChange?.(id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {tabs.map(([id, label]) => (
            <Pressable
              key={id}
              onPress={() => selectTab(id)}
              style={[
                styles.tab,
                active === id && styles.activeTab,
              ]}
            >
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
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer le panneau inférieur"
          onPress={() => selectTab(null)}
        >
          <Text style={styles.close}>×</Text>
        </Pressable>
      </View>

      {active && (
        <View style={styles.body}>
          {active === 'terminal' && (
            <>
              <Text style={styles.prompt}>
                GCODE Mobile Terminal
              </Text>

              <Text style={styles.line}>
                $ ready
              </Text>

              <Text style={styles.cursor}>
                $
              </Text>
            </>
          )}

          {active === 'problems' && (
            <Text style={styles.empty}>
              ✓ Aucun problème détecté
            </Text>
          )}

          {active === 'output' && (
            <Text style={styles.empty}>
              GCODE Output — prêt
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 190,
    backgroundColor: '#080b16',
    borderTopWidth: 1,
    borderTopColor: '#2a2f45',
  },

  header: {
    height: 42,
    backgroundColor: '#0d1020',
    borderBottomWidth: 1,
    borderBottomColor: '#242943',
    flexDirection: 'row',
    alignItems: 'center',
  },

  tab: {
    height: 42,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },

  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#a88bff',
  },

  label: {
    color: '#737b96',
    fontSize: 10,
    fontWeight: '800',
  },

  activeLabel: {
    color: '#ffffff',
  },

  close: {
    color: '#777f9b',
    fontSize: 21,
    paddingHorizontal: 13,
  },

  body: {
    flex: 1,
    padding: 13,
  },

  prompt: {
    color: '#9e86ff',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 7,
  },

  line: {
    color: '#9da5bd',
    fontFamily: 'monospace',
    fontSize: 12,
  },

  cursor: {
    color: '#ffffff',
    fontFamily: 'monospace',
    marginTop: 8,
  },

  empty: {
    color: '#8d96ae',
    fontSize: 12,
  },
});
