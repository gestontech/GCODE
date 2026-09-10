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

export default function WorkbenchScreen({
  project,
  onChange,
  onBack,
  onPreview,
}) {
  const {
    colors,
    radius,
  } = useTheme();

  const files = Array.isArray(project?.files)
    ? project.files
    : [];

  const folders = Array.isArray(project?.folders)
    ? project.folders
    : [];

  const [activeFileId, setActiveFileId] =
    useState(null);

  const [bottomPanel, setBottomPanel] =
    useState('terminal');

  const [dialog, setDialog] = useState(null);

  const [dialogValue, setDialogValue] =
    useState('');

  const [dialogTarget, setDialogTarget] =
    useState(null);

  /*
   * Fichier actuellement ouvert
   */
  const activeFile = useMemo(() => {
    if (!files.length) {
      return null;
    }

    return (
      files.find(
        (file) =>
          file.id === activeFileId
      ) || files[0]
    );
  }, [files, activeFileId]);

  /*
   * Garantit qu'un fichier valide
   * reste toujours sélectionné.
   */
  useEffect(() => {
    if (!files.length) {
      setActiveFileId(null);
      return;
    }

    const stillExists = files.some(
      (file) =>
        file.id === activeFileId
    );

    if (!activeFileId || !stillExists) {
      setActiveFileId(files[0].id);
    }
  }, [files, activeFileId]);

  /*
   * Ouvrir un fichier
   */
  function selectFile(file) {
    if (!file) {
      return;
    }

    setActiveFileId(file.id);
  }

  /*
   * Modifier le code
   */
  function updateCode(text) {
    if (!activeFile || !project) {
      return;
    }

    const updatedProject =
      updateProjectFile(
        project,
        activeFile.id,
        text
      );

    onChange?.(updatedProject);
  }

  /*
   * Créer un fichier
   */
  function handleCreateFile() {
    setDialog({
      type: 'create-file',
      title: 'Nouveau fichier',
      placeholder: 'exemple.js',
    });

    setDialogValue('');
    setDialogTarget(null);
  }

  /*
   * Créer un dossier
   */
  function handleCreateFolder() {
    setDialog({
      type: 'create-folder',
      title: 'Nouveau dossier',
      placeholder: 'components',
    });

    setDialogValue('');
    setDialogTarget(null);
  }

  /*
   * Renommer un fichier
   */
  function handleRenameFile(file) {
    if (!file) {
      return;
    }

    setDialog({
      type: 'rename-file',
      title: 'Renommer le fichier',
      placeholder: 'Nouveau nom',
    });

    setDialogValue(file.name);
    setDialogTarget(file);
  }

  /*
   * Supprimer un fichier
   */
  function handleDeleteFile(file) {
    if (!file) {
      return;
    }

    if (file.name === 'index.html') {
      Alert.alert(
        'Fichier protégé',
        'index.html est nécessaire au Preview de GCODE et ne peut pas être supprimé.'
      );

      return;
    }

    Alert.alert(
      'Supprimer le fichier',
      `Voulez-vous vraiment supprimer « ${file.name} » ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const updatedProject =
              deleteFile(
                project,
                file.id
              );

            onChange?.(
              updatedProject
            );

            if (
              activeFileId ===
              file.id
            ) {
              const nextFile =
                updatedProject.files?.[0];

              setActiveFileId(
                nextFile?.id || null
              );
            }
          },
        },
      ]
    );
  }

  /*
   * Renommer un dossier
   */
  function handleRenameFolder(folder) {
    if (!folder) {
      return;
    }

    setDialog({
      type: 'rename-folder',
      title: 'Renommer le dossier',
      placeholder: 'Nouveau nom',
    });

    setDialogValue(folder.name);
    setDialogTarget(folder);
  }

  /*
   * Supprimer un dossier
   */
  function handleDeleteFolder(folder) {
    if (!folder) {
      return;
    }

    Alert.alert(
      'Supprimer le dossier',
      `Voulez-vous supprimer « ${folder.name} » et tout son contenu ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const removedFileIds =
              new Set(
                project.files
                  ?.filter(
                    (file) =>
                      file.folderId ===
                      folder.id
                  )
                  .map(
                    (file) =>
                      file.id
                  ) || []
              );

            const updatedProject =
              deleteFolder(
                project,
                folder.id
              );

            onChange?.(
              updatedProject
            );

            if (
              activeFileId &&
              removedFileIds.has(
                activeFileId
              )
            ) {
              setActiveFileId(
                updatedProject
                  .files?.[0]
                  ?.id || null
              );
            }
          },
        },
      ]
    );
  }

  /*
   * Valider une boîte de dialogue
   */
  function submitDialog() {
    const value =
      dialogValue.trim();

    if (!value) {
      return;
    }

    let updatedProject =
      project;

    if (
      dialog?.type ===
      'create-file'
    ) {
      updatedProject =
        createFile(
          project,
          value,
          '',
          null
        );

      const createdFile =
        updatedProject.files?.[
          updatedProject.files.length - 1
        ];

      if (
        createdFile &&
        createdFile.name === value
      ) {
        setActiveFileId(
          createdFile.id
        );
      }
    }

    if (
      dialog?.type ===
      'create-folder'
    ) {
      updatedProject =
        createFolder(
          project,
          value,
          null
        );
    }

    if (
      dialog?.type ===
      'rename-file'
    ) {
      updatedProject =
        renameFile(
          project,
          dialogTarget?.id,
          value
        );
    }

    if (
      dialog?.type ===
      'rename-folder'
    ) {
      updatedProject =
        renameFolder(
          project,
          dialogTarget?.id,
          value
        );
    }

    if (
      updatedProject !==
      project
    ) {
      onChange?.(
        updatedProject
      );
    }

    closeDialog();
  }

  /*
   * Fermer le dialogue
   */
  function closeDialog() {
    setDialog(null);
    setDialogValue('');
    setDialogTarget(null);
  }

  /*
   * Position affichée dans la barre d'état.
   *
   * Pour l'instant elle représente la
   * dernière ligne du fichier.
   */
  function getCursorPosition(text) {
    const value = text || '';

    const lines =
      value.split('\n');

    return {
      line: lines.length,

      column:
        (lines[
          lines.length - 1
        ]?.length || 0) + 1,
    };
  }

  const cursor =
    getCursorPosition(
      activeFile?.content || ''
    );

  const language =
    activeFile?.language ||
    activeFile?.name
      ?.split('.')
      .pop() ||
    'text';

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
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
            backgroundColor:
              colors.panel,
            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            {
              opacity:
                pressed ? 0.6 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.backIcon,
              {
                color:
                  colors.text,
              },
            ]}
          >
            ‹
          </Text>
        </Pressable>

        <View
          style={
            styles.projectInfo
          }
        >
          <Text
            numberOfLines={1}
            style={[
              styles.projectName,
              {
                color:
                  colors.text,
              },
            ]}
          >
            {project?.name ||
              'Projet sans nom'}
          </Text>

          <Text
            style={[
              styles.projectStatus,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            GCODE Mobile V3
          </Text>
        </View>

        <Pressable
          onPress={onPreview}
          style={({ pressed }) => [
            styles.previewButton,
            {
              backgroundColor:
                colors.purple,
              borderRadius:
                radius.sm,
              opacity:
                pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={
              styles.previewText
            }
          >
            ▶
          </Text>

          <Text
            style={
              styles.previewLabel
            }
          >
            Preview
          </Text>
        </Pressable>
      </View>

      {/* IDE */}
      <View style={styles.ide}>
        {/* ACTIVITY BAR */}
        <ActivityBar />

        {/* ZONE PRINCIPALE */}
        <View style={styles.main}>
          {/* EXPLORATEUR */}
          <View
            style={[
              styles.sidebar,
              {
                backgroundColor:
                  colors.panel,
                borderRightColor:
                  colors.border,
              },
            ]}
          >
            <FileExplorer
              project={project}
              activeFile={
                activeFile
              }
              onOpenFile={
                selectFile
              }
              onCreateFile={
                handleCreateFile
              }
              onCreateFolder={
                handleCreateFolder
              }
              onRenameFile={
                handleRenameFile
              }
              onDeleteFile={
                handleDeleteFile
              }
              onRenameFolder={
                handleRenameFolder
              }
              onDeleteFolder={
                handleDeleteFolder
              }
            />
          </View>

          {/* ÉDITEUR */}
          <View
            style={[
              styles.editorArea,
              {
                backgroundColor:
                  colors.editor,
              },
            ]}
          >
            <EditorTabs
              files={files}
              activeFile={
                activeFile
              }
              onSelect={
                selectFile
              }
            />

            <View
              style={[
                styles.editorHeader,
                {
                  backgroundColor:
                    colors.panel,
                  borderBottomColor:
                    colors.border,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.fileName,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                {activeFile?.name ||
                  'Aucun fichier'}
              </Text>

              <Text
                style={[
                  styles.language,
                  {
                    color:
                      colors.muted,
                  },
                ]}
              >
                {language}
              </Text>
            </View>

            <View
              style={styles.editor}
            >
              {activeFile ? (
                <CodeEditor
                  value={
                    activeFile.content ||
                    ''
                  }
                  language={
                    language
                  }
                  onChangeText={
                    updateCode
                  }
                />
              ) : (
                <View
                  style={
                    styles.noFile
                  }
                >
                  <Text
                    style={[
                      styles.noFileTitle,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    Aucun fichier
                  </Text>

                  <Text
                    style={[
                      styles.noFileText,
                      {
                        color:
                          colors.muted,
                      },
                    ]}
                  >
                    Crée un fichier
                    depuis
                    l'explorateur.
                  </Text>
                </View>
              )}
            </View>

            {/* BARRE OUTILS */}
            <View
              style={[
                styles.toolbar,
                {
                  backgroundColor:
                    colors.panel,
                  borderTopColor:
                    colors.border,
                },
              ]}
            >
              <Tool
                label="⌕"
                colors={colors}
                onPress={() =>
                  setBottomPanel(
                    'problems'
                  )
                }
              />

              <Tool
                label="＋"
                colors={colors}
                onPress={
                  handleCreateFile
                }
              />

              <Tool
                label="□"
                colors={colors}
                onPress={
                  handleCreateFolder
                }
              />

              <View
                style={
                  styles.toolbarSpacer
                }
              />

              <Tool
                label="▶"
                colors={colors}
                onPress={
                  onPreview
                }
                active
              />
            </View>
          </View>
        </View>
      </View>

      {/* TERMINAL / PROBLÈMES */}
      <View
        style={[
          styles.bottom,
          {
            backgroundColor:
              colors.panel,
            borderTopColor:
              colors.border,
          },
        ]}
      >
        <BottomPanel
          active={
            bottomPanel
          }
          onChange={
            setBottomPanel
          }
          project={project}
        />
      </View>

      {/* STATUS BAR */}
      <StatusBar
        language={language}
        line={cursor.line}
        column={cursor.column}
      />

      {/* DIALOGUE MOBILE */}
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
                backgroundColor:
                  colors.panel,
                borderColor:
                  colors.border,
                borderRadius:
                  radius.lg,
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              {dialog.title}
            </Text>

            <TextInput
              value={
                dialogValue
              }
              onChangeText={
                setDialogValue
              }
              placeholder={
                dialog.placeholder
              }
              placeholderTextColor={
                colors.muted
              }
              autoFocus
              selectTextOnFocus
              onSubmitEditing={
                submitDialog
              }
              style={[
                styles.modalInput,
                {
                  color:
                    colors.text,
                  backgroundColor:
                    colors.panel2,
                  borderColor:
                    colors.border,
                },
              ]}
            />

            <View
              style={
                styles.modalActions
              }
            >
              <Pressable
                onPress={
                  closeDialog
                }
                style={[
                  styles.modalButton,
                  {
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  Annuler
                </Text>
              </Pressable>

              <Pressable
                onPress={
                  submitDialog
                }
                style={[
                  styles.modalButton,
                  {
                    backgroundColor:
                      colors.purple,
                    borderColor:
                      colors.purple,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    {
                      color:
                        '#ffffff',
                    },
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

function Tool({
  label,
  colors,
  onPress,
  active = false,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tool,
        {
          backgroundColor:
            active
              ? colors.purple
              : colors.panel2,
          opacity:
            pressed ? 0.6 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.toolText,
          {
            color: active
              ? '#ffffff'
              : colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 58,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backIcon: {
    fontSize: 34,
    fontWeight: '300',
  },

  projectInfo: {
    flex: 1,
    marginLeft: 4,
  },

  projectName: {
    fontSize: 14,
    fontWeight: '900',
  },

  projectStatus: {
    fontSize: 10,
    marginTop: 2,
  },

  previewButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  previewText: {
    color: '#ffffff',
    fontSize: 12,
  },

  previewLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },

  ide: {
    flex: 1,
    flexDirection: 'row',
  },

  main: {
    flex: 1,
    flexDirection: 'row',
  },

  sidebar: {
    width: 170,
    borderRightWidth: 1,
  },

  editorArea: {
    flex: 1,
  },

  editorHeader: {
    height: 35,
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  fileName: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },

  language: {
    fontSize: 10,
    marginLeft: 8,
  },

  editor: {
    flex: 1,
  },

  noFile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  noFileTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  noFileText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },

  toolbar: {
    height: 46,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 7,
  },

  tool: {
    width: 36,
    height: 34,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  toolText: {
    fontSize: 15,
    fontWeight: '800',
  },

  toolbarSpacer: {
    flex: 1,
  },

  bottom: {
    borderTopWidth: 1,
    minHeight: 50,
  },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  modal: {
    width: '100%',
    maxWidth: 420,
    padding: 20,
    borderWidth: 1,
    elevation: 12,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 16,
  },

  modalInput: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },

  modalButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
