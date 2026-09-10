import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';

export default function EditorScreen({
  project,
  onChange,
  onBack,
  onPreview,
  onAI,
}) {
  const [code, setCode] = useState(project.code || '');

  function changeCode(value) {
    setCode(value);

    onChange({
      ...project,
      code: value,
      updatedAt: Date.now(),
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios' ? 'padding' : undefined
      }
    >
      <View style={styles.top}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>‹</Text>
        </Pressable>

        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>
            {project.name}
          </Text>

          <Text style={styles.fileName}>
            index.html
          </Text>
        </View>

        <Pressable onPress={onPreview}>
          <Text style={styles.preview}>▶</Text>
        </Pressable>
      </View>

      <View style={styles.editor}>
        <TextInput
          value={code}
          onChangeText={changeCode}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          textAlignVertical="top"
          style={styles.code}
        />
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.tool}>{} </Text>
        <Text style={styles.tool}>Tab</Text>
        <Text style={styles.tool}>←</Text>
        <Text style={styles.tool}>→</Text>

        <Pressable
          style={styles.ai}
          onPress={onAI}
        >
          <Text style={styles.aiText}>✦ AI</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070914',
  },

  top: {
    height: 68,
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

  projectInfo: {
    flex: 1,
  },

  projectName: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },

  fileName: {
    color: '#8189a6',
    fontSize: 11,
    marginTop: 3,
  },

  preview: {
    color: '#5fe0a0',
    fontSize: 19,
  },

  editor: {
    flex: 1,
    backgroundColor: '#080b17',
  },

  code: {
    flex: 1,
    color: '#e8eaff',
    fontSize: 14,
    lineHeight: 21,
    padding: 16,
    fontFamily: Platform.OS === 'ios'
      ? 'Menlo'
      : 'monospace',
  },

  toolbar: {
    height: 55,
    backgroundColor: '#11152a',
    borderTopWidth: 1,
    borderTopColor: '#242943',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 18,
  },

  tool: {
    color: '#c5c9dc',
    fontSize: 14,
  },

  ai: {
    marginLeft: 'auto',
    backgroundColor: '#713cff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },

  aiText: {
    color: '#fff',
    fontWeight: '800',
  },
});
