import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

export default function AIScreen({
  project,
  onBack,
}) {
  const [prompt, setPrompt] = useState('');
  const [message, setMessage] = useState('');

  function runAction(action) {
    setMessage(
      `GCODE AI : ${action}\n\n` +
      `La demande a été reçue. ` +
      `Le fournisseur IA pourra être connecté dans une prochaine étape.`
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>‹</Text>
        </Pressable>

        <Text style={styles.title}>
          GCODE AI
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>
          Assistant IA
        </Text>

        <Text style={styles.subtitle}>
          Décris ce que tu veux construire.
        </Text>

        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          multiline
          placeholder="Ex : crée une page de connexion moderne..."
          placeholderTextColor="#626a86"
          style={styles.input}
        />

        <View style={styles.actions}>
          {[
            'Générer du code',
            'Corriger une erreur',
            'Expliquer le code',
            'Optimiser',
          ].map((action) => (
            <Pressable
              key={action}
              style={styles.action}
              onPress={() => runAction(action)}
            >
              <Text style={styles.actionText}>
                ✦ {action}
              </Text>
            </Pressable>
          ))}
        </View>

        {message ? (
          <View style={styles.result}>
            <Text style={styles.resultText}>
              {message}
            </Text>
          </View>
        ) : null}

        {project && (
          <Text style={styles.project}>
            Projet actif : {project.name}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070914',
  },

  header: {
    height: 65,
    backgroundColor: '#0d1020',
    borderBottomWidth: 1,
    borderBottomColor: '#242943',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },

  back: {
    color: '#fff',
    fontSize: 35,
    width: 40,
  },

  title: {
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
  },

  content: {
    padding: 20,
  },

  heading: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
  },

  subtitle: {
    color: '#8189a6',
    marginTop: 7,
    marginBottom: 20,
  },

  input: {
    minHeight: 150,
    backgroundColor: '#0d1020',
    borderWidth: 1,
    borderColor: '#242943',
    borderRadius: 18,
    color: '#fff',
    padding: 16,
    textAlignVertical: 'top',
  },

  actions: {
    marginTop: 15,
  },

  action: {
    backgroundColor: '#11152a',
    borderWidth: 1,
    borderColor: '#242943',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },

  actionText: {
    color: '#fff',
    fontWeight: '700',
  },

  result: {
    backgroundColor: '#11152a',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
  },

  resultText: {
    color: '#cfd3e7',
    lineHeight: 21,
  },

  project: {
    color: '#8189a6',
    marginTop: 20,
  },
});
