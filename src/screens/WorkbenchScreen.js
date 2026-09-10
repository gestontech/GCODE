import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
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

  const [activeFileId, setActiveFileId] = useState(
    files[0]?.id || null
  );

  const [bottomPanel, setBottomPanel] = useState('terminal');

  const [activity, setActivity] = useState('explorer');

  const activeFile = useMemo(() => {
    return (
      files.find((file) => file.id === activeFileId) ||
      files[0] ||
      null
    );
  }, [files, activeFileId]);

  const selectFile = (file) => {
    if (!file) return;
    setActiveFileId(file.id);
  };

  const updateCode = (text) => {
    if (!activeFile) return;

    const updatedFiles = files.map((file) =>
      file.id === activeFile.id
        ? {
            ...file,
            content: text,
          }
        : file
    );

    onChange?.({
      ...project,
      files: updatedFiles,
      code:
        activeFile.name === 'index.html'
          ? text
          : project?.code,
    });
  };

  const getLanguage = () => {
    if (!activeFile?.name) return 'TEXT';

    const name = activeFile.name.toLowerCase();

    if (name.endsWith('.html')) return 'HTML';
    if (name.endsWith('.css')) return 'CSS';
    if (name.endsWith('.js')) return 'JavaScript';
    if (name.endsWith('.jsx')) return 'React';
    if (name.endsWith('.json')) return 'JSON';
    if (name.endsWith('.ts')) return 'TypeScript';
    if (name.endsWith('.tsx')) return 'React TS';

    return 'TEXT';
  };

  const getCursorPosition = () => {
    const text = activeFile?.content || '';

    const lines = text.split('\n');

    return {
      line: Math.max(1, lines.length),
      column: Math.max(
        1,
        lines[lines.length - 1]?.length + 1 || 1
      ),
    };
  };

  const cursor = getCursorPosition();

  const renderActivityPanel = () => {
    if (activity === 'search') {
      return (
        <View style={styles.activityPanel}>
          <Text style={styles.panelTitle}>RECHERCHER</Text>

          <TextInput
            placeholder="Rechercher..."
            placeholderTextColor="#66708c"
            style={styles.searchInput}
          />

          <Text style={styles.panelEmpty}>
            Recherche dans le projet
          </Text>
        </View>
      );
    }

    if (activity === 'git') {
      return (
        <View style={styles.activityPanel}>
          <Text style={styles.panelTitle}>CONTRÔLE DE SOURCE</Text>

          <Text style={styles.panelEmpty}>
            Aucun changement Git détecté
          </Text>
        </View>
      );
    }

    if (activity === 'run') {
      return (
        <View style={styles.activityPanel}>
          <Text style={styles.panelTitle}>EXÉCUTER</Text>

          <Pressable
            style={styles.runButton}
            onPress={onPreview}
          >
            <Text style={styles.runButtonText}>
              ▶ Lancer le projet
            </Text>
          </Pressable>
        </View>
      );
    }

    if (activity === 'extensions') {
      return (
        <View style={styles.activityPanel}>
          <Text style={styles.panelTitle}>EXTENSIONS</Text>

          <Text style={styles.panelEmpty}>
            Aucune extension installée
          </Text>
        </View>
      );
    }

    return (
      <FileExplorer
        project={project}
        activeFile={activeFile}
        onOpenFile={selectFile}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.projectInfo}>
          <Text
            style={styles.projectName}
            numberOfLines={1}
          >
            {project?.name || 'Projet'}
          </Text>

          <Text style={styles.projectSubtitle}>
            GCODE Mobile
          </Text>
        </View>

        <Pressable
          onPress={onPreview}
          style={styles.previewButton}
        >
          <Text style={styles.previewText}>
            ▶
          </Text>
        </Pressable>
      </View>

      {/* MAIN WORKSPACE */}
      <View style={styles.workspace}>
        {/* ACTIVITY BAR */}
        <ActivityBar
          active={activity}
          onChange={setActivity}
        />

        {/* SIDEBAR */}
        <View style={styles.sidebar}>
          {renderActivityPanel()}
        </View>

        {/* EDITOR AREA */}
        <View style={styles.editorArea}>
          {/* TABS */}
          <EditorTabs
            files={files}
            activeFile={activeFile}
            onSelect={selectFile}
          />

          {/* EDITOR */}
          <View style={styles.editor}>
            {activeFile ? (
              <View style={styles.editorContent}>
                <ScrollView
                  style={styles.lineNumbers}
                  showsVerticalScrollIndicator={false}
                >
                  {(activeFile.content || '')
                    .split('\n')
                    .map((_, index) => (
                      <Text
                        key={index}
                        style={styles.lineNumber}
                      >
                        {index + 1}
                      </Text>
                    ))}
                </ScrollView>

                <TextInput
                  value={activeFile.content || ''}
                  onChangeText={updateCode}
                  multiline
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  textAlignVertical="top"
                  scrollEnabled
                  style={styles.codeInput}
                  placeholder="Commencez à écrire votre code..."
                  placeholderTextColor="#454d68"
                />
              </View>
            ) : (
              <View style={styles.emptyEditor}>
                <Text style={styles.emptyEditorTitle}>
                  Aucun fichier ouvert
                </Text>

                <Text style={styles.emptyEditorText}>
                  Sélectionnez un fichier dans l'explorateur.
                </Text>
              </View>
            )}
          </View>

          {/* EDITOR TOOLBAR */}
          <View style={styles.toolbar}>
            <Pressable
              style={styles.toolButton}
              onPress={() => setBottomPanel('terminal')}
            >
              <Text style={styles.toolText}>
                Terminal
              </Text>
            </Pressable>

            <Pressable
              style={styles.toolButton}
              onPress={() => setBottomPanel('problems')}
            >
              <Text style={styles.toolText}>
                Problèmes
              </Text>
            </Pressable>

            <Pressable
              style={styles.toolButton}
              onPress={() => setBottomPanel('output')}
            >
              <Text style={styles.toolText}>
                Sortie
              </Text>
            </Pressable>

            <View style={styles.toolbarSpacer} />

            <Pressable
              style={styles.previewSmall}
              onPress={onPreview}
            >
              <Text style={styles.previewSmallText}>
                ▶ Aperçu
              </Text>
            </Pressable>
          </View>

          {/* BOTTOM PANEL */}
          <BottomPanel
            active={bottomPanel}
            onChange={setBottomPanel}
          />

          {/* STATUS BAR */}
          <StatusBar
            language={getLanguage()}
            line={cursor.line}
            column={cursor.column}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070a13',
  },

  topBar: {
    height: 58,
    backgroundColor: '#0d1020',
    borderBottomWidth: 1,
    borderBottomColor: '#252a40',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '300',
  },

  projectInfo: {
    flex: 1,
    marginLeft: 4,
  },

  projectName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  projectSubtitle: {
    color: '#69728c',
    fontSize: 10,
    marginTop: 2,
  },

  previewButton: {
    width: 42,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#171b2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#303653',
  },

  previewText: {
    color: '#a88bff',
    fontSize: 15,
  },

  workspace: {
    flex: 1,
    flexDirection: 'row',
  },

  sidebar: {
    width: 210,
    backgroundColor: '#0b0e19',
    borderRightWidth: 1,
    borderRightColor: '#252a40',
  },

  activityPanel: {
    flex: 1,
    padding: 14,
  },

  panelTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 15,
  },

  searchInput: {
    height: 38,
    borderWidth: 1,
    borderColor: '#303650',
    borderRadius: 6,
    paddingHorizontal: 10,
    color: '#ffffff',
    backgroundColor: '#101426',
    fontSize: 12,
  },

  panelEmpty: {
    color: '#69728c',
    fontSize: 11,
    marginTop: 18,
    lineHeight: 17,
  },

  runButton: {
    backgroundColor: '#171b2e',
    borderWidth: 1,
    borderColor: '#383e5c',
    borderRadius: 7,
    paddingVertical: 11,
    paddingHorizontal: 10,
  },

  runButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  editorArea: {
    flex: 1,
    backgroundColor: '#080b16',
  },

  editor: {
    flex: 1,
    backgroundColor: '#080b16',
  },

  editorContent: {
    flex: 1,
    flexDirection: 'row',
  },

  lineNumbers: {
    width: 45,
    backgroundColor: '#080b16',
    paddingTop: 12,
  },

  lineNumber: {
    color: '#414a66',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'right',
    paddingRight: 10,
  },

  codeInput: {
    flex: 1,
    color: '#d9deee',
    backgroundColor: '#080b16',
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
    paddingTop: 12,
    paddingHorizontal: 8,
    paddingBottom: 30,
  },

  emptyEditor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  emptyEditorTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },

  emptyEditorText: {
    color: '#68718a',
    fontSize: 12,
    textAlign: 'center',
  },

  toolbar: {
    height: 44,
    backgroundColor: '#0d1020',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#252a40',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
  },

  toolButton: {
    paddingHorizontal: 9,
    height: 34,
    justifyContent: 'center',
  },

  toolText: {
    color: '#858da5',
    fontSize: 10,
    fontWeight: '700',
  },

  toolbarSpacer: {
    flex: 1,
  },

  previewSmall: {
    backgroundColor: '#171b2e',
    borderWidth: 1,
    borderColor: '#343a57',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 32,
    justifyContent: 'center',
  },

  previewSmallText: {
    color: '#a88bff',
    fontSize: 10,
    fontWeight: '800',
  },
});
