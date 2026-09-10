import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
} from 'react-native';

export default function SettingsScreen() {
  const [autoSave, setAutoSave] = useState(true);
  const [lineNumbers, setLineNumbers] = useState(true);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Paramètres</Text>

        <Text style={styles.section}>
          ÉDITEUR
        </Text>

        <Setting
          title="Auto-save"
          value={autoSave}
          onChange={setAutoSave}
        />

        <Setting
          title="Numéros de lignes"
          value={lineNumbers}
          onChange={setLineNumbers}
        />

        <Text style={styles.section}>
          APPARENCE
        </Text>

        <Row title="Thème" value="Sombre" />
        <Row title="Police" value="Monospace" />
        <Row title="Taille du texte" value="14" />

        <Text style={styles.section}>
          IA
        </Text>

        <Row title="Modèle IA" value="Non connecté" />
        <Row title="API" value="À configurer" />

        <Text style={styles.version}>
          GCODE Mobile V3.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

function Setting({ title, value, onChange }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>

      <Switch
        value={value}
        onValueChange={onChange}
      />
    </View>
  );
}

function Row({ title, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070914',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 25,
  },

  section: {
    color: '#8d70ff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
  },

  row: {
    minHeight: 58,
    backgroundColor: '#0d1020',
    borderBottomWidth: 1,
    borderBottomColor: '#242943',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  rowTitle: {
    color: '#fff',
    fontSize: 14,
  },

  value: {
    color: '#8189a6',
    fontSize: 13,
  },

  version: {
    color: '#626a86',
    textAlign: 'center',
    marginTop: 35,
  },
});
