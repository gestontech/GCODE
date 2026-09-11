import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

import {
  addProjectFile,
  deleteProjectFile,
  getProject,
  renameProjectFile,
  saveProjectFile,
} from '../storage/projectStorage';

export default function WorkbenchScreen({
  project,
  onBack,
  onPreview,
  onProjectUpdated,
}) {
  const { colors, spacing, radius } = useTheme();

  const [files, setFiles] = useState({});
  const [activeFile, setActiveFile] = useState(null);
  const [code, setCode] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [showExplorer, setShowExplorer] = useState(true);

  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameFileName, setRenameFileName] = useState('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },

        header: {
          minHeight: 62,
          paddingHorizontal: spacing.md,
          paddingTop: Platform.OS === 'ios' ? 8 : 4,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.backgroundElevated,
        },

        headerButton: {
          width: 40,
          height: 40,
          borderRadius: radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.panel2,
          borderWidth: 1,
          borderColor: colors.border,
        },

        headerButtonText: {
          color: colors.text,
          fontSize: 20,
          fontWeight: '600',
        },

        headerCenter: {
          flex: 1,
          paddingHorizontal: spacing.sm,
        },

        projectTitle: {
          color: colors.textStrong,
          fontSize: 16,
          fontWeight: '700',
        },

        fileTitle: {
          marginTop: 2,
          color: colors.muted,
          fontSize: 12,
        },

        previewButton: {
          minWidth: 76,
          height: 40,
          paddingHorizontal: 12,
          borderRadius: radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.purple,
        },

        previewButtonText: {
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: '700',
        },

        toolbar: {
          minHeight: 48,
          paddingHorizontal: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.panel,
        },

        toolbarButton: {
          minWidth: 38,
          height: 36,
          marginRight: 6,
          paddingHorizontal: 9,
          borderRadius: radius.xs,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.panel2,
          borderWidth: 1,
          borderColor: colors.border,
        },

        toolbarButtonText: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '600',
        },

        statusText: {
          marginLeft: 'auto',
          color: dirty ? colors.yellow : colors.green,
          fontSize: 11,
          fontWeight: '600',
        },

        workspace: {
          flex: 1,
          flexDirection: 'row',
        },

        explorer: {
          width: showExplorer ? 190 : 0,
          overflow: 'hidden',
          backgroundColor: colors.panel,
          borderRightWidth: showExplorer ? 1 : 0,
          borderRightColor: colors.border,
        },

        explorerHeader: {
          height: 48,
          paddingHorizontal: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },

        explorerTitle: {
          flex: 1,
          color: colors.textStrong,
          fontSize: 12,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.7,
        },

        addButton: {
          width: 32,
          height: 32,
          borderRadius: radius.xs,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.panel2,
        },

        addButtonText: {
          color: colors.purpleLight,
          fontSize: 20,
          fontWeight: '500',
        },

        fileList: {
          padding: spacing.xs,
        },

        fileItem: {
          minHeight: 42,
          paddingHorizontal: 10,
          marginBottom: 4,
          borderRadius: radius.xs,
          flexDirection: 'row',
          alignItems: 'center',
        },

        activeFileItem: {
          backgroundColor: colors.editorSelection,
          borderWidth: 1,
          borderColor: colors.purpleDark,
        },

        fileIcon: {
          width: 24,
          color: colors.blue,
          fontSize: 12,
          fontWeight: '700',
        },

        fileName: {
          flex: 1,
          color: colors.text,
          fontSize: 12,
        },

        activeFileName: {
          color: colors.textStrong,
          fontWeight: '700',
        },

        editorArea: {
          flex: 1,
          backgroundColor: colors.editor,
        },

        editorHeader: {
          minHeight: 36,
          paddingHorizontal: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.editorActiveLine,
          borderBottomWidth: 1,
          borderBottomColor: colors.editorLine,
        },

        editorHeaderText: {
          color: colors.muted,
          fontSize: 11,
        },

        editor: {
          flex: 1,
          flexDirection: 'row',
        },

        lineNumbers: {
          width: 48,
          paddingTop: 12,
          paddingRight: 8,
          backgroundColor: colors.editor,
          borderRightWidth: 1,
          borderRightColor: colors.editorLine,
        },

        lineNumber: {
          height: 22,
          color: colors.muted2,
          fontSize: 12,
          lineHeight: 22,
          textAlign: 'right',
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        },

        codeInput: {
          flex: 1,
          minHeight: '100%',
          paddingHorizontal: 12,
          paddingTop: 12,
          paddingBottom: 40,
          color: colors.editorText,
          backgroundColor: colors.editor,
          fontSize: 13,
          lineHeight: 22,
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
          textAlignVertical: 'top',
        },

        emptyEditor: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.xl,
        },

        emptyEditorTitle: {
          color: colors.textStrong,
          fontSize: 18,
          fontWeight: '700',
          marginBottom: 8,
        },

        emptyEditorText: {
          color: colors.muted,
          fontSize: 13,
          textAlign: 'center',
        },

        modalOverlay: {
          flex: 1,
          backgroundColor: colors.overlay,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.lg,
        },

        modalCard: {
          width: '100%',
          maxWidth: 420,
          backgroundColor: colors.panel,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          padding: spacing.md,
        },

        modalTitle: {
          color: colors.textStrong,
          fontSize: 18,
          fontWeight: '700',
          marginBottom: 6,
        },

        modalSubtitle: {
          color: colors.muted,
          fontSize: 12,
          lineHeight: 18,
          marginBottom: spacing.md,
        },

        input: {
          height: 48,
          paddingHorizontal: 14,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          backgroundColor: colors.editor,
          color: colors.text,
          fontSize: 14,
        },

        modalActions: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: spacing.md,
        },

        modalButton: {
          minWidth: 92,
          height: 44,
          paddingHorizontal: 14,
          marginLeft: 8,
          borderRadius: radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
        },

        cancelButton: {
          backgroundColor: colors.panel2,
          borderWidth: 1,
          borderColor: colors.border,
        },

        confirmButton: {
          backgroundColor: colors.purple,
        },

        cancelButtonText: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '600',
        },

        confirmButtonText: {
          color: '#FFFFFF',
          fontSize: 13,
          fontWeight: '700',
        },
      }),
    [colors, spacing, radius, dirty, showExplorer]
  );

  useEffect(() => {
    let mounted = true;

    async function loadProject() {
      if (!project?.id) {
        if (mounted) {
          setFiles({});
          setActiveFile(null);
          setCode('');
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      const storedProject = await getProject(project.id);

      if (!mounted) {
        return;
      }

      const projectFiles = storedProject?.files || project?.files || {};

      const names = Object.keys(projectFiles);

      const initialFile =
        storedProject?.activeFile ||
        project?.activeFile ||
        names[0] ||
        null;

      setFiles(projectFiles);
      setActiveFile(initialFile);
      setCode(
        initialFile
          ? projectFiles[initialFile] || ''
          : ''
      );
      setDirty(false);
      setLoading(false);
    }

    loadProject();

    return () => {
      mounted = false;
    };
  }, [project?.id]);

  const lineCount = Math.max(
    code.split('\n').length,
    1
  );

  const lineNumbers = Array.from(
    { length: lineCount },
    (_, index) => index + 1
  );

  const notifyProjectUpdated = (updatedProject) => {
    if (typeof onProjectUpdated === 'function') {
      onProjectUpdated(updatedProject);
    }
  };

  const performSave = async (
    fileName = activeFile,
    content = code
  ) => {
    if (!project?.id || !fileName) {
      return null;
    }

    setSaving(true);

    const updatedProject = await saveProjectFile(
      project.id,
      fileName,
      content
    );

    setSaving(false);

    if (updatedProject) {
      setFiles(updatedProject.files || {});
      setDirty(false);
      notifyProjectUpdated(updatedProject);
    }

    return updatedProject;
  };

  const handleCodeChange = (value) => {
    setCode(value);
    setFiles((previous) => ({
      ...previous,
      [activeFile]: value,
    }));
    setDirty(true);
  };

  const handleSelectFile = async (fileName) => {
    if (!fileName || fileName === activeFile) {
      return;
    }

    if (dirty) {
      await performSave(activeFile, code);
    }

    setActiveFile(fileName);
    setCode(files[fileName] || '');
    setDirty(false);
  };

  const handleAddFile = async () => {
    const name = newFileName.trim();

    if (!name) {
      Alert.alert(
        'Nom requis',
        'Entre un nom de fichier.'
      );
      return;
    }

    if (Object.prototype.hasOwnProperty.call(files, name)) {
      Alert.alert(
        'Fichier existant',
        'Un fichier avec ce nom existe déjà.'
      );
      return;
    }

    const updatedProject = await addProjectFile(
      project.id,
      name,
      ''
    );

    if (!updatedProject) {
      Alert.alert(
        'Erreur',
        'Impossible de créer le fichier.'
      );
      return;
    }

    setFiles(updatedProject.files || {});
    setActiveFile(name);
    setCode('');
    setDirty(false);
    setNewFileName('');
    setShowNewFileModal(false);

    notifyProjectUpdated(updatedProject);
  };

  const handleDeleteFile = (fileName) => {
    if (!fileName) {
      return;
    }

    const fileNames = Object.keys(files);

    if (fileNames.length <= 1) {
      Alert.alert(
        'Action impossible',
        'Un projet doit conserver au moins un fichier.'
      );
      return;
    }

    Alert.alert(
      'Supprimer le fichier',
      `Supprimer « ${fileName} » ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const updatedProject =
              await deleteProjectFile(
                project.id,
                fileName
              );

            if (!updatedProject) {
              return;
            }

            const updatedFiles =
              updatedProject.files || {};

            const nextFile =
              updatedProject.activeFile ||
              Object.keys(updatedFiles)[0] ||
              null;

            setFiles(updatedFiles);
            setActiveFile(nextFile);
            setCode(
              nextFile
                ? updatedFiles[nextFile] || ''
                : ''
            );
            setDirty(false);

            notifyProjectUpdated(updatedProject);
          },
        },
      ]
    );
  };

  const openRenameModal = (fileName) => {
    setRenameTarget(fileName);
    setRenameFileName(fileName);
    setShowRenameModal(true);
  };

  const handleRenameFile = async () => {
    const oldName = renameTarget;
    const newName = renameFileName.trim();

    if (!oldName) {
      return;
    }

    if (!newName) {
      Alert.alert(
        'Nom requis',
        'Entre un nouveau nom de fichier.'
      );
      return;
    }

    if (
      newName !== oldName &&
      Object.prototype.hasOwnProperty.call(files, newName)
    ) {
      Alert.alert(
        'Fichier existant',
        'Un fichier avec ce nom existe déjà.'
      );
      return;
    }

    const updatedProject =
      await renameProjectFile(
        project.id,
        oldName,
        newName
      );

    if (!updatedProject) {
      Alert.alert(
        'Erreur',
        'Impossible de renommer le fichier.'
      );
      return;
    }

    const updatedFiles =
      updatedProject.files || {};

    const nextActiveFile =
      updatedProject.activeFile ||
      activeFile;

    setFiles(updatedFiles);
    setActiveFile(nextActiveFile);
    setCode(
      nextActiveFile
        ? updatedFiles[nextActiveFile] || ''
        : ''
    );
    setDirty(false);

    setRenameTarget(null);
    setRenameFileName('');
    setShowRenameModal(false);

    notifyProjectUpdated(updatedProject);
  };

  const insertAtEnd = (text) => {
    const nextCode =
      code.length > 0
        ? `${code}${text}`
        : text;

    handleCodeChange(nextCode);
  };

  const insertTemplate = (template) => {
    insertAtEnd(template);
  };

  const handleBack = async () => {
    if (dirty) {
      await performSave(activeFile, code);
    }

    if (typeof onBack === 'function') {
      onBack();
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Text
          style={{
            color: colors.muted,
            fontSize: 13,
          }}
        >
          Chargement de l’éditeur…
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
          onPress={handleBack}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>
            ‹
          </Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text
            style={styles.projectTitle}
            numberOfLines={1}
          >
            {project?.name || 'Projet GCODE'}
          </Text>

          <Text
            style={styles.fileTitle}
            numberOfLines={1}
          >
            {activeFile || 'Aucun fichier'}
          </Text>
        </View>

        <Pressable
          onPress={async () => {
            await performSave();
            if (typeof onPreview === 'function') {
              onPreview();
            }
          }}
          style={styles.previewButton}
        >
          <Text style={styles.previewButtonText}>
            Preview
          </Text>
        </Pressable>
      </View>

      <View style={styles.toolbar}>
        <Pressable
          onPress={() =>
            setShowExplorer((value) => !value)
          }
          style={styles.toolbarButton}
        >
          <Text style={styles.toolbarButtonText}>
            ☰
          </Text>
        </Pressable>

        <Pressable
          onPress={() => insertTemplate('  ')}
          style={styles.toolbarButton}
        >
          <Text style={styles.toolbarButtonText}>
            Tab
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            insertTemplate('// ')
          }
          style={styles.toolbarButton}
        >
          <Text style={styles.toolbarButtonText}>
            //
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            insertTemplate('console.log();')
          }
          style={styles.toolbarButton}
        >
          <Text style={styles.toolbarButtonText}>
            log
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            insertTemplate(
              '\n\nfunction main() {\n  \n}\n'
            )
          }
          style={styles.toolbarButton}
        >
          <Text style={styles.toolbarButtonText}>
            fn
          </Text>
        </Pressable>

        <Text style={styles.statusText}>
          {saving
            ? 'Enregistrement…'
            : dirty
              ? 'Modifié'
              : 'Enregistré'}
        </Text>
      </View>

      <View style={styles.workspace}>
        <View style={styles.explorer}>
          <View style={styles.explorerHeader}>
            <Text style={styles.explorerTitle}>
              Explorer
            </Text>

            <Pressable
              onPress={() =>
                setShowNewFileModal(true)
              }
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>
                +
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.fileList}
          >
            {Object.keys(files).map((fileName) => (
              <Pressable
                key={fileName}
                onPress={() =>
                  handleSelectFile(fileName)
                }
                onLongPress={() =>
                  openRenameModal(fileName)
                }
                style={[
                  styles.fileItem,
                  activeFile === fileName &&
                    styles.activeFileItem,
                ]}
              >
                <Text style={styles.fileIcon}>
                  {fileName.endsWith('.js')
                    ? 'JS'
                    : fileName.endsWith('.json')
                      ? '{}'
                      : fileName.endsWith('.md')
                        ? 'MD'
                        : '•'}
                </Text>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.fileName,
                    activeFile === fileName &&
                      styles.activeFileName,
                  ]}
                >
                  {fileName}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.editorArea}>
          {activeFile ? (
            <>
              <View style={styles.editorHeader}>
                <Text
                  style={styles.editorHeaderText}
                >
                  {activeFile} · local
                </Text>
              </View>

              <View style={styles.editor}>
                <ScrollView
                  style={styles.lineNumbers}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                >
                  {lineNumbers.map((number) => (
                    <Text
                      key={number}
                      style={styles.lineNumber}
                    >
                      {number}
                    </Text>
                  ))}
                </ScrollView>

                <TextInput
                  value={code}
                  onChangeText={handleCodeChange}
                  style={styles.codeInput}
                  multiline
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  textAlignVertical="top"
                  selectionColor={colors.purpleLight}
                  placeholder="Commence à coder…"
                  placeholderTextColor={colors.muted2}
                />
              </View>
            </>
          ) : (
            <View style={styles.emptyEditor}>
              <Text
                style={styles.emptyEditorTitle}
              >
                Aucun fichier
              </Text>

              <Text style={styles.emptyEditorText}>
                Crée un fichier pour commencer à
                coder dans GCODE.
              </Text>
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={showNewFileModal}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowNewFileModal(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Nouveau fichier
            </Text>

            <Text style={styles.modalSubtitle}>
              Donne un nom au nouveau fichier.
            </Text>

            <TextInput
              value={newFileName}
              onChangeText={setNewFileName}
              style={styles.input}
              placeholder="ex. app.js"
              placeholderTextColor={colors.muted2}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setNewFileName('');
                  setShowNewFileModal(false);
                }}
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                ]}
              >
                <Text
                  style={styles.cancelButtonText}
                >
                  Annuler
                </Text>
              </Pressable>

              <Pressable
                onPress={handleAddFile}
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                ]}
              >
                <Text
                  style={styles.confirmButtonText}
                >
                  Créer
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowRenameModal(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Renommer le fichier
            </Text>

            <Text style={styles.modalSubtitle}>
              Modifie le nom puis appuie sur
              « Renommer ».
            </Text>

            <TextInput
              value={renameFileName}
              onChangeText={setRenameFileName}
              style={styles.input}
              placeholder="Nom du fichier"
              placeholderTextColor={colors.muted2}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              selectTextOnFocus
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setRenameTarget(null);
                  setRenameFileName('');
                  setShowRenameModal(false);
                }}
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                ]}
              >
                <Text
                  style={styles.cancelButtonText}
                >
                  Annuler
                </Text>
              </Pressable>

              <Pressable
                onPress={handleRenameFile}
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                ]}
              >
                <Text
                  style={styles.confirmButtonText}
                >
                  Renommer
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
