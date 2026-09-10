import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import ActivityBar from '../components/ActivityBar';
import FileExplorer from '../components/FileExplorer';
import EditorTabs from '../components/EditorTabs';
import BottomPanel from '../components/BottomPanel';
import StatusBar from '../components/StatusBar';

export default function WorkbenchScreen({
  project,
  onChange,
  onBack,
  onPreview,
}) {
  const files = project?.files || [];

  const firstFile = files[0] || {
    id: 'index.html',
    name: 'index.html',
    language: 'html',
    content: project?.code || '',
  };

  const [activeActivity, setActiveActivity] = useState('explorer');
  const [activeFileId, setActiveFileId] = useState(firstFile.id);
  const [bottomPanel, setBottomPanel] = useState('terminal');
  const [cursorPosition, setCursorPosition] = useState({
    line: 1,
    column: 1,
  });

  const activeFile = useMemo(() => {
    return (
      files.find((file) => file.id === activeFileId) ||
      firstFile
    );
  }, [files, activeFileId, firstFile]);

  const code = activeFile.content || '';

  function updateCode(value) {
    const updatedFiles = files.map((file) =>
      file.id === activeFile.id
        ? {
            ...file,
            content: value,
          }
        : file
    );

    onChange({
      ...project,
      files: updatedFiles,
      code:
        activeFile.name === 'index.html'
          ? value
          : project.code,
      updatedAt: Date.now(),
    });
  }

  function handleSelectionChange(event) {
    const position = event.nativeEvent.selection;
    const beforeCursor = code.slice(0, position.start);

    const lines = beforeCursor.split('\n');

    setCursorPosition({
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
    });
  }

  function selectFile(file) {
    setActiveFileId(file.id);
  }

  function renderActivityPanel() {
    if (activeActivity === 'explorer') {
      return (
        <FileExplorer
          project={project}
          activeFile={activeFileId}
          onSelectFile={selectFile}
        />
      );
    }

    if (activeActivity === 'search') {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>
            Recherche
          </Text>
          <Text style={styles.placeholderText}>
            La recherche globale sera disponible ici.
          </Text>
        </View>
      );
    }

    if (activeActivity === 'git') {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>
            Contrôle de version
          </Text>
          <Text style={styles.placeholderText}>
            Git et GitHub seront intégrés dans cette section.
          </Text>
        </View>
      );
    }

    if (activeActivity === 'run') {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>
            Exécution
          </Text>
          <Text style={styles.placeholderText}>
            Utilisez le bouton ▶ pour ouvrir l'aperçu.
          </Text>

          <Pressable
            style={styles.runButton}
            onPress={onPreview}
          >
            <Text style={styles.runButtonText}>
              ▶ Lancer l'aperçu
            </Text>
          </Pressable>
        </View>
      );
    }

    if (activeActivity === 'extensions') {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>
            Extensions
          </Text>
          <Text style={styles.placeholderText}>
            Le système d'extensions sera ajouté ici.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderTitle}>
          GCODE
        </Text>
        <Text style={styles.placeholderText}>
          Outil de développement mobile.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.headerInfo}>
          <Text
            style={styles.projectName}
            numberOfLines={1}
          >
            {project.name}
          </Text>

          <Text style={styles.workspaceText}>
            GCODE Mobile V3
          </Text>
        </View>

        <Pressable
          style={styles.previewButton}
          onPress={onPreview}
        >
          <Text style={styles.previewText}>▶</Text>
        </Pressable>
      </View>

      <View style={styles.workspace}>
        <ActivityBar
          active={activeActivity}
          onChange={setActiveActivity}
        />

        <View style={styles.mainArea}>
          {activeActivity !== 'none' && (
            <View style={styles.sidebar}>
              {renderActivityPanel()}
            </View>
          )}

          <View style={styles.editorArea}>
            <EditorTabs
              files={files}
              activeFile={activeFileId}
              onSelectFile={selectFile}
            />

            <View style={styles.editor}>
              <ScrollView
                style={styles.lineNumbers}
                showsVerticalScrollIndicator={false}
              >
                {code.split('\n').map((_, index) => (
                  <Text
                    key={index}
                    style={styles.lineNumber}
                  >
                    {index + 1}
                  </Text>
                ))}
              </ScrollView>

              <TextInput
                value={code}
                onChangeText={updateCode}
                onSelectionChange={handleSelectionChange}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                textAlignVertical="top"
                style={styles.codeInput}
                placeholder="Commencez à coder..."
                placeholderTextColor="#555b75"
              />
            </View>

            <View style={styles.editorToolbar}>
              <Pressable
                onPress={() => setBottomPanel('terminal')}
              >
                <Text style={styles.toolbarText}>
                  Terminal
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setBottomPanel('problems')}
              >
                <Text style={styles.toolbarText}>
                  Problèmes
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setBottomPanel('output')}
              >
                <Text style={styles.toolbarText}>
                  Sortie
                </Text>
              </Pressable>
            </View>

            <BottomPanel
              active={bottomPanel}
              onChange={setBottomPanel}
            />

            <StatusBar
              branch="main"
              language={activeFile.language || 'Plain Text'}
              line={cursorPosition.line}
              column={cursorPosition.column}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070914',
  },

  header: {
    height: 62,
    backgroundColor: '#0d1020',
    borderBottomWidth: 1,
    borderBottomColor: '#242943',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  backButton: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    color: '#ffffff',
    fontSize: 34,
    lineHeight: 38,
  },

  headerInfo: {
    flex: 1,
    paddingHorizontal: 5,
  },

  projectName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  workspaceText: {
    color: '#777f9e',
    fontSize: 10,
    marginTop: 2,
  },

  previewButton: {
    width: 42,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#151a2d',
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewText: {
    color: '#61e6a4',
    fontSize: 17,
  },

  workspace: {
    flex: 1,
    flexDirection: 'row',
  },

  mainArea: {
    flex: 1,
    flexDirection: 'row',
  },

  sidebar: {
    width: 205,
    backgroundColor: '#0b0e1a',
    borderRightWidth: 1,
    borderRightColor: '#242943',
  },

  editorArea: {
    flex: 1,
    minWidth: 0,
  },

  editor: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#080b17',
  },

  lineNumbers: {
    width: 42,
    paddingTop: 12,
  },

  lineNumber: {
    color: '#4e556f',
    fontFamily:
      Platform.OS === 'ios'
        ? 'Menlo'
        : 'monospace',
    fontSize: 12,
    lineHeight: 21,
    textAlign: 'right',
    paddingRight: 8,
  },

  codeInput: {
    flex: 1,
    color: '#e8eaff',
    fontSize: 13,
    lineHeight: 21,
    paddingTop: 12,
    paddingRight: 12,
    paddingBottom: 30,
    fontFamily:
      Platform.OS === 'ios'
        ? 'Menlo'
        : 'monospace',
  },

  editorToolbar: {
    height: 42,
    backgroundColor: '#11152a',
    borderTopWidth: 1,
    borderTopColor: '#242943',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 12,
  },

  toolbarText: {
    color: '#aeb4cd',
    fontSize: 11,
  },

  placeholder: {
    padding: 16,
  },

  placeholderTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },

  placeholderText: {
    color: '#777f9e',
    fontSize: 12,
    lineHeight: 18,
  },

  runButton: {
    marginTop: 18,
    backgroundColor: '#171d35',
    borderWidth: 1,
    borderColor: '#343b60',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  runButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
