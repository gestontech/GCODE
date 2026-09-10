import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import ActivityBar from '../components/ActivityBar';
import FileExplorer from '../components/FileExplorer';
import EditorTabs from '../components/EditorTabs';
import BottomPanel from '../components/BottomPanel';
import StatusBar from '../components/StatusBar';
import CodeEditor from '../components/CodeEditor';

import { useTheme } from '../theme/ThemeContext';

import {
  createFile,
  createFolder,
  renameFile,
  deleteFile,
  renameFolder,
  deleteFolder,
  updateProjectFile,
} from '../storage/projectStorage';

function getCursorPosition(text, offset = 0) {
  const value = text || '';

  const safeOffset = Math.max(
    0,
    Math.min(offset ?? 0, value.length),
  );

  const beforeCursor = value.slice(
    0,
    safeOffset,
  );

  const lines = beforeCursor.split('\n');

  return {
    line: lines.length,
    column:
      (lines[lines.length - 1] || '').length + 1,
  };
}

function getLanguage(file) {
  if (!file) {
    return 'text';
  }

  if (file.language) {
    return file.language;
  }

  const name = file.name || '';
  const extension =
    name.split('.').pop()?.toLowerCase() || '';

  const languages = {
    html: 'html',
    htm: 'html',
    css: 'css',
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    md: 'markdown',
    txt: 'text',
  };

  return languages[extension] || extension || 'text';
}

export default function WorkbenchScreen({
  project,
  onChange,
  onBack,
  onPreview,
}) {
  const { colors } = useTheme();

  const files = project?.files || [];
  const folders = project?.folders || [];

  const [activeFileId, setActiveFileId] = useState(
    files[0]?.id || null,
  );

  const [activeActivity, setActiveActivity] =
    useState('explorer');

  const [bottomPanel, setBottomPanel] =
    useState('terminal');

  const [dialog, setDialog] = useState(null);

  const [dialogValue, setDialogValue] =
    useState('');

  const [cursorSelection, setCursorSelection] =
    useState({
      start: 0,
      end: 0,
    });

  const activeFile = useMemo(() => {
    return (
      files.find(
        (file) => file.id === activeFileId,
      ) || files[0] || null
    );
  }, [files, activeFileId]);

  useEffect(() => {
    if (!activeFileId && files[0]) {
      setActiveFileId(files[0].id);
      return;
    }

    const exists = files.some(
      (file) => file.id === activeFileId,
    );

    if (!exists && files[0]) {
      setActiveFileId(files[0].id);
    }
  }, [files, activeFileId]);

  useEffect(() => {
    setCursorSelection({
      start: 0,
      end: 0,
    });
  }, [activeFileId]);

  useEffect(() => {
    const content = activeFile?.content || '';

    const maxPosition = content.length;

    if (
      cursorSelection.start > maxPosition ||
      cursorSelection.end > maxPosition
    ) {
      const position = Math.min(
        cursorSelection.start,
        maxPosition,
      );

      setCursorSelection({
        start: position,
        end: position,
      });
    }
  }, [
    activeFile?.id,
    activeFile?.content,
    cursorSelection.start,
    cursorSelection.end,
  ]);

  const updateProject = (updatedProject) => {
    if (!updatedProject) {
      return;
    }

    onChange?.(updatedProject);
  };

  const updateCode = (text) => {
    if (!project || !activeFile) {
      return;
    }

    const updatedProject = updateProjectFile(
      project,
      activeFile.id,
      text,
    );

    updateProject(updatedProject);
  };

  const handleSelectionChange = (
    nextSelection,
  ) => {
    if (!nextSelection) {
      return;
    }

    setCursorSelection({
      start: nextSelection.start ?? 0,
      end: nextSelection.end ?? nextSelection.start ?? 0,
    });
  };

  const openFile = (file) => {
    if (!file) {
      return;
    }

    setActiveFileId(file.id);

    setCursorSelection({
      start: 0,
      end: 0,
    });
  };

  const openCreateDialog = (type) => {
    setDialog({
      type,
      mode: 'create',
      target: null,
    });

    setDialogValue('');
  };

  const openRenameFileDialog = (file) => {
    if (!file) {
      return;
    }

    setDialog({
      type: 'file',
      mode: 'rename',
      target: file,
    });

    setDialogValue(file.name || '');
  };

  const openRenameFolderDialog = (folder) => {
    if (!folder) {
      return;
    }

    setDialog({
      type: 'folder',
      mode: 'rename',
      target: folder,
    });

    setDialogValue(folder.name || '');
  };

  const closeDialog = () => {
    setDialog(null);
    setDialogValue('');
  };

  const submitDialog = () => {
    const value = dialogValue.trim();

    if (!value) {
      return;
    }

    if (!dialog) {
      return;
    }

    try {
      let updatedProject = project;

      if (
        dialog.mode === 'create' &&
        dialog.type === 'file'
      ) {
        const exists = files.some(
          (file) =>
            file.name.toLowerCase() ===
            value.toLowerCase(),
        );

        if (exists) {
          Alert.alert(
            'Fichier existant',
            `Le fichier "${value}" existe déjà.`,
          );
          return;
        }

        updatedProject = createFile(
          project,
          value,
          '',
          null,
        );
      }

      if (
        dialog.mode === 'create' &&
        dialog.type === 'folder'
      ) {
        const exists = folders.some(
          (folder) =>
            folder.name.toLowerCase() ===
            value.toLowerCase(),
        );

        if (exists) {
          Alert.alert(
            'Dossier existant',
            `Le dossier "${value}" existe déjà.`,
          );
          return;
        }

        updatedProject = createFolder(
          project,
          value,
          null,
        );
      }

      if (
        dialog.mode === 'rename' &&
        dialog.type === 'file'
      ) {
        updatedProject = renameFile(
          project,
          dialog.target.id,
          value,
        );
      }

      if (
        dialog.mode === 'rename' &&
        dialog.type === 'folder'
      ) {
        updatedProject = renameFolder(
          project,
          dialog.target.id,
          value,
        );
      }

      updateProject(updatedProject);
      closeDialog();
    } catch (error) {
      Alert.alert(
        'Erreur',
        error?.message ||
          'Impossible de modifier le projet.',
      );
    }
  };

  const handleDeleteFile = (file) => {
    if (!file) {
      return;
    }

    if (file.name === 'index.html') {
      Alert.alert(
        'Fichier protégé',
        'index.html est nécessaire au fonctionnement du projet et ne peut pas être supprimé.',
      );
      return;
    }

    Alert.alert(
      'Supprimer le fichier',
      `Voulez-vous supprimer "${file.name}" ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            try {
              const updatedProject = deleteFile(
                project,
                file.id,
              );

              updateProject(updatedProject);

              if (file.id === activeFileId) {
                const remainingFiles =
                  updatedProject?.files || [];

                setActiveFileId(
                  remainingFiles[0]?.id || null,
                );
              }
            } catch (error) {
              Alert.alert(
                'Erreur',
                error?.message ||
                  'Impossible de supprimer le fichier.',
              );
            }
          },
        },
      ],
    );
  };

  const handleDeleteFolder = (folder) => {
    if (!folder) {
      return;
    }

    Alert.alert(
      'Supprimer le dossier',
      `Voulez-vous supprimer "${folder.name}" et son contenu ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            try {
              const updatedProject =
                deleteFolder(
                  project,
                  folder.id,
                );

              updateProject(updatedProject);

              const remainingFiles =
                updatedProject?.files || [];

              const activeStillExists =
                remainingFiles.some(
                  (file) =>
                    file.id === activeFileId,
                );

              if (!activeStillExists) {
                setActiveFileId(
                  remainingFiles[0]?.id || null,
                );
              }
            } catch (error) {
              Alert.alert(
                'Erreur',
                error?.message ||
                  'Impossible de supprimer le dossier.',
              );
            }
          },
        },
      ],
    );
  };

  const cursor = getCursorPosition(
    activeFile?.content || '',
    cursorSelection.start,
  );

  const language = getLanguage(activeFile);

  const projectName =
    project?.name || 'Projet sans nom';

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.panel,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.headerButton,
            {
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.headerButtonText,
              { color: colors.text },
            ]}
          >
            ‹
          </Text>
        </Pressable>

        <View style={styles.headerTitleArea}>
          <Text
            numberOfLines={1}
            style={[
              styles.projectName,
              { color: colors.text },
            ]}
          >
            {projectName}
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.fileName,
              { color: colors.muted },
            ]}
          >
            {activeFile?.name || 'Aucun fichier'}
          </Text>
        </View>

        <Pressable
          onPress={() => openCreateDialog('file')}
          style={({ pressed }) => [
            styles.headerAction,
            {
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.actionText,
              { color: colors.text },
            ]}
          >
            +
          </Text>
        </Pressable>

        <Pressable
          onPress={() => openCreateDialog('folder')}
          style={({ pressed }) => [
            styles.headerAction,
            {
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.actionText,
              { color: colors.text },
            ]}
          >
            ▱
          </Text>
        </Pressable>

        <Pressable
          onPress={onPreview}
          style={({ pressed }) => [
            styles.previewButton,
            {
              backgroundColor: colors.purple,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.previewText,
              { color: '#ffffff' },
            ]}
          >
            ▶
          </Text>
        </Pressable>
      </View>

      {/* CORPS */}
      <View style={styles.body}>
        {/* ACTIVITY BAR */}
        <ActivityBar
          active={activeActivity}
          onChange={setActiveActivity}
        />

        {/* SIDEBAR */}
        {activeActivity === 'explorer' && (
          <View
            style={[
              styles.sidebar,
              {
                backgroundColor: colors.panel,
                borderRightColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.sidebarHeader,
                {
                  borderBottomColor:
                    colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sidebarTitle,
                  { color: colors.text },
                ]}
              >
                EXPLORATEUR
              </Text>

              <View style={styles.sidebarActions}>
                <Pressable
                  onPress={() =>
                    openCreateDialog('file')
                  }
                  style={styles.smallButton}
                >
                  <Text
                    style={[
                      styles.smallButtonText,
                      { color: colors.text },
                    ]}
                  >
                    +
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    openCreateDialog('folder')
                  }
                  style={styles.smallButton}
                >
                  <Text
                    style={[
                      styles.smallButtonText,
                      { color: colors.text },
                    ]}
                  >
                    ▱
                  </Text>
                </Pressable>
              </View>
            </View>

            <FileExplorer
              project={project}
              activeFile={activeFile}
              onOpenFile={openFile}
              onCreateFile={() =>
                openCreateDialog('file')
              }
              onCreateFolder={() =>
                openCreateDialog('folder')
              }
              onRenameFile={
                openRenameFileDialog
              }
              onDeleteFile={
                handleDeleteFile
              }
              onRenameFolder={
                openRenameFolderDialog
              }
              onDeleteFolder={
                handleDeleteFolder
              }
            />
          </View>
        )}

        {/* AUTRES OUTILS */}
        {activeActivity !== 'explorer' && (
          <View
            style={[
              styles.toolSidebar,
              {
                backgroundColor: colors.panel,
                borderRightColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.toolSidebarTitle,
                { color: colors.text },
              ]}
            >
              {activeActivity === 'search'
                ? 'RECHERCHE'
                : activeActivity === 'git'
                  ? 'GIT'
                  : activeActivity === 'run'
                    ? 'EXÉCUTER'
                    : activeActivity ===
                        'extensions'
                      ? 'EXTENSIONS'
                      : 'PARAMÈTRES'}
            </Text>

            <Text
              style={[
                styles.toolSidebarText,
                { color: colors.muted },
              ]}
            >
              Cette section est prête pour les fonctions
              correspondantes de GCODE Mobile.
            </Text>
          </View>
        )}

        {/* ÉDITEUR */}
        <View style={styles.editorColumn}>
          <EditorTabs
            files={files}
            activeFile={activeFile}
            onSelect={openFile}
          />

          {activeFile ? (
            <CodeEditor
              value={activeFile.content || ''}
              language={language}
              onChangeText={updateCode}
              onSelectionChange={
                handleSelectionChange
              }
            />
          ) : (
            <View
              style={[
                styles.emptyEditor,
                {
                  backgroundColor:
                    colors.editor,
                },
              ]}
            >
              <Text
                style={[
                  styles.emptyTitle,
                  { color: colors.text },
                ]}
              >
                Aucun fichier ouvert
              </Text>

              <Text
                style={[
                  styles.emptyText,
                  { color: colors.muted },
                ]}
              >
                Crée un fichier pour commencer.
              </Text>
            </View>
          )}

          {/* BOTTOM PANEL */}
          <View
            style={[
              styles.bottomPanel,
              {
                borderTopColor: colors.border,
              },
            ]}
          >
            <BottomPanel
              active={bottomPanel}
              onChange={setBottomPanel}
              project={project}
            />
          </View>

          {/* STATUS BAR */}
          <StatusBar
            language={language}
            line={cursor.line}
            column={cursor.column}
            branch="main"
            encoding="UTF-8"
            spaces={2}
          />
        </View>
      </View>

      {/* DIALOGUE */}
      {dialog && (
        <View
          style={[
            styles.modalOverlay,
            {
              backgroundColor:
                'rgba(0,0,0,0.65)',
            },
          ]}
        >
          <View
            style={[
              styles.modal,
              {
                backgroundColor: colors.panel,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: colors.text },
              ]}
            >
              {dialog.mode === 'create'
                ? dialog.type === 'file'
                  ? 'Nouveau fichier'
                  : 'Nouveau dossier'
                : dialog.type === 'file'
                  ? 'Renommer le fichier'
                  : 'Renommer le dossier'}
            </Text>

            <TextInput
              value={dialogValue}
              onChangeText={setDialogValue}
              autoFocus
              placeholder={
                dialog.type === 'file'
                  ? 'nom-du-fichier'
                  : 'nom-du-dossier'
              }
              placeholderTextColor={
                colors.muted
              }
              style={[
                styles.modalInput,
                {
                  backgroundColor:
                    colors.panel2,
                  borderColor:
                    colors.border,
                  color: colors.text,
                },
              ]}
              onSubmitEditing={
                submitDialog
              }
              returnKeyType="done"
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeDialog}
                style={({ pressed }) => [
                  styles.modalButton,
                  {
                    backgroundColor:
                      colors.panel2,
                    borderColor:
                      colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: colors.text },
                  ]}
                >
                  Annuler
                </Text>
              </Pressable>

              <Pressable
                onPress={submitDialog}
                style={({ pressed }) => [
                  styles.modalButton,
                  {
                    backgroundColor:
                      colors.purple,
                    borderColor:
                      colors.purple,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: '#ffffff' },
                  ]}
                >
                  Valider
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: 6,
  },

  headerButton: {
    width: 42,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerButtonText: {
    fontSize: 34,
    fontWeight: '300',
    lineHeight: 38,
  },

  headerTitleArea: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 5,
  },

  projectName: {
    fontSize: 13,
    fontWeight: '700',
  },

  fileName: {
    fontSize: 10,
    marginTop: 2,
  },

  headerAction: {
    width: 38,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionText: {
    fontSize: 22,
    fontWeight: '600',
  },

  previewButton: {
    width: 42,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 3,
  },

  previewText: {
    fontSize: 14,
    fontWeight: '800',
  },

  body: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
  },

  sidebar: {
    width: 220,
    minWidth: 180,
    maxWidth: 260,
    borderRightWidth: 1,
  },

  sidebarHeader: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 9,
    borderBottomWidth: 1,
  },

  sidebarTitle: {
    fontSize: 10,
    fontWeight: '800',
  },

  sidebarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  smallButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  smallButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },

  toolSidebar: {
    width: 220,
    padding: 16,
    borderRightWidth: 1,
  },

  toolSidebarTitle: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 16,
  },

  toolSidebarText: {
    fontSize: 11,
    lineHeight: 18,
  },

  editorColumn: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },

  bottomPanel: {
    minHeight: 115,
    maxHeight: 190,
    borderTopWidth: 1,
  },

  emptyEditor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 12,
  },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 100,
  },

  modal: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },

  modalInput: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 12,
    fontSize: 13,
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
  },

  modalButton: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  modalButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
