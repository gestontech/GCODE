import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

import {
  saveProjectFile,
  addProjectFile,
  deleteProjectFile,
  renameProjectFile,
} from '../storage/projectStorage';

const DEFAULT_CODE = `// Bienvenue dans GCODE
// Commence à coder ici.

function hello() {
  console.log("Hello from GCODE!");
}

hello();`;

const DEFAULT_FILES = {
  'index.js': DEFAULT_CODE,

  'README.md': `# Mon projet GCODE

Bienvenue dans ton projet.

Créé avec GCODE.`,

  'package.json': `{
  "name": "gcode-project",
  "version": "1.0.0",
  "private": true
}`,
};

export default function WorkbenchScreen({
  project,
  onBack,
  onPreview,
  onProjectUpdated,
}) {
  const { colors } = useTheme();

  const initialFiles = {
    ...DEFAULT_FILES,
    ...(project?.files || {}),
  };

  const [files, setFiles] = useState(initialFiles);

  const [activeFile, setActiveFile] = useState(
    project?.activeFile ||
      project?.fileName ||
      'index.js'
  );

  const [code, setCode] = useState(
    initialFiles[
      project?.activeFile ||
        project?.fileName ||
        'index.js'
    ] || DEFAULT_CODE
  );

  const [isSaved, setIsSaved] = useState(true);

  const [showExplorer, setShowExplorer] = useState(true);

  const [saving, setSaving] = useState(false);

  const [isAddingFile, setIsAddingFile] = useState(false);

  const [newFileName, setNewFileName] = useState('');

  const [cursorPosition, setCursorPosition] = useState({
    start: 0,
    end: 0,
  });

  /*
   * Si le projet change, recharge ses fichiers.
   */
  useEffect(() => {
    const projectFiles = {
      ...DEFAULT_FILES,
      ...(project?.files || {}),
    };

    const file =
      project?.activeFile ||
      project?.fileName ||
      'index.js';

    setFiles(projectFiles);
    setActiveFile(file);
    setCode(
      projectFiles[file] ||
        project?.code ||
        DEFAULT_CODE
    );
    setIsSaved(true);
  }, [project?.id]);

  const lines = useMemo(() => {
    return code.split('\n');
  }, [code]);

  const fileNames = useMemo(() => {
    return Object.keys(files);
  }, [files]);

  /*
   * Modification du code.
   */
  const handleChange = (value) => {
    setCode(value);
    setFiles((current) => ({
      ...current,
      [activeFile]: value,
    }));
    setIsSaved(false);
  };

  /*
   * Ouvre un fichier.
   */
  const openFile = (fileName) => {
    if (fileName === activeFile) {
      return;
    }

    if (!isSaved) {
      Alert.alert(
        'Modifications non enregistrées',
        `Tu as des modifications dans ${activeFile}. Enregistre-les avant de changer de fichier.`,
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Enregistrer',
            onPress: async () => {
              const success =
                await performSave();

              if (success) {
                switchFile(fileName);
              }
            },
          },
        ]
      );

      return;
    }

    switchFile(fileName);
  };

  const switchFile = (fileName) => {
    const nextCode =
      files[fileName] || '';

    setActiveFile(fileName);
    setCode(nextCode);
    setIsSaved(true);
  };

  /*
   * Sauvegarde réelle dans AsyncStorage.
   */
  const performSave = async () => {
    if (!project?.id) {
      Alert.alert(
        'Projet introuvable',
        'Impossible de sauvegarder ce projet.'
      );

      return false;
    }

    try {
      setSaving(true);

      const updatedProject =
        await saveProjectFile(
          project.id,
          activeFile,
          code
        );

      if (!updatedProject) {
        throw new Error(
          'Projet introuvable dans le stockage.'
        );
      }

      setFiles(
        updatedProject.files || files
      );

      setIsSaved(true);

      if (onProjectUpdated) {
        onProjectUpdated(updatedProject);
      }

      return true;
    } catch (error) {
      console.warn(
        '[GCODE] Erreur sauvegarde :',
        error
      );

      Alert.alert(
        'Erreur',
        'Impossible de sauvegarder le projet.'
      );

      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    await performSave();
  };

  /*
   * Ajoute du texte à la position actuelle.
   */
  const insertText = (text) => {
    const start = cursorPosition.start;

    const end = cursorPosition.end;

    const before = code.slice(0, start);

    const after = code.slice(end);

    const nextCode =
      before + text + after;

    const nextCursor =
      start + text.length;

    setCode(nextCode);

    setFiles((current) => ({
      ...current,
      [activeFile]: nextCode,
    }));

    setCursorPosition({
      start: nextCursor,
      end: nextCursor,
    });

    setIsSaved(false);
  };

  /*
   * Supprime le caractère précédent.
   */
  const deletePreviousCharacter = () => {
    const start = cursorPosition.start;
    const end = cursorPosition.end;

    if (start !== end) {
      const nextCode =
        code.slice(0, start) +
        code.slice(end);

      setCode(nextCode);

      setFiles((current) => ({
        ...current,
        [activeFile]: nextCode,
      }));

      setCursorPosition({
        start,
        end: start,
      });

      setIsSaved(false);

      return;
    }

    if (start <= 0) {
      return;
    }

    const nextCode =
      code.slice(0, start - 1) +
      code.slice(start);

    setCode(nextCode);

    setFiles((current) => ({
      ...current,
      [activeFile]: nextCode,
    }));

    setCursorPosition({
      start: start - 1,
      end: start - 1,
    });

    setIsSaved(false);
  };

  /*
   * Ajout d'un nouveau fichier.
   */
  const handleAddFile = () => {
    setNewFileName('');
    setIsAddingFile(true);
  };

  const confirmAddFile = async () => {
    const name =
      newFileName.trim();

    if (!name) {
      return;
    }

    if (files[name]) {
      Alert.alert(
        'Fichier existant',
        'Un fichier portant ce nom existe déjà.'
      );

      return;
    }

    if (!project?.id) {
      return;
    }

    try {
      const updatedProject =
        await addProjectFile(
          project.id,
          name,
          ''
        );

      if (!updatedProject) {
        throw new Error(
          'Projet introuvable.'
        );
      }

      setFiles(
        updatedProject.files || {}
      );

      setIsAddingFile(false);

      setActiveFile(name);

      setCode('');

      setIsSaved(true);

      if (onProjectUpdated) {
        onProjectUpdated(updatedProject);
      }
    } catch (error) {
      console.warn(
        '[GCODE] Erreur création fichier :',
        error
      );

      Alert.alert(
        'Erreur',
        'Impossible de créer le fichier.'
      );
    }
  };

  /*
   * Suppression d'un fichier.
   */
  const handleDeleteFile = (fileName) => {
    if (fileNames.length <= 1) {
      Alert.alert(
        'Impossible',
        'Un projet doit conserver au moins un fichier.'
      );

      return;
    }

    Alert.alert(
      'Supprimer le fichier ?',
      fileName,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedProject =
                await deleteProjectFile(
                  project.id,
                  fileName
                );

              if (!updatedProject) {
                throw new Error(
                  'Projet introuvable.'
                );
              }

              setFiles(
                updatedProject.files || {}
              );

              const nextFile =
                updatedProject.activeFile ||
                Object.keys(
                  updatedProject.files || {}
                )[0];

              setActiveFile(nextFile);

              setCode(
                updatedProject.files?.[
                  nextFile
                ] || ''
              );

              setIsSaved(true);

              if (onProjectUpdated) {
                onProjectUpdated(
                  updatedProject
                );
              }
            } catch (error) {
              Alert.alert(
                'Erreur',
                'Impossible de supprimer le fichier.'
              );
            }
          },
        },
      ]
    );
  };

  /*
   * Renommer un fichier.
   */
  const handleRenameFile = (fileName) => {
    Alert.prompt(
      'Renommer le fichier',
      'Nouveau nom :',
      async (value) => {
        const newName =
          value?.trim();

        if (!newName || newName === fileName) {
          return;
        }

        if (files[newName]) {
          Alert.alert(
            'Fichier existant',
            'Ce nom est déjà utilisé.'
          );

          return;
        }

        try {
          const updatedProject =
            await renameProjectFile(
              project.id,
              fileName,
              newName
            );

          if (!updatedProject) {
            throw new Error(
              'Projet introuvable.'
            );
          }

          setFiles(
            updatedProject.files || {}
          );

          if (
            updatedProject.activeFile ===
            newName
          ) {
            setActiveFile(newName);

            setCode(
              updatedProject.files?.[
                newName
              ] || ''
            );
          }

          setIsSaved(true);

          if (onProjectUpdated) {
            onProjectUpdated(
              updatedProject
            );
          }
        } catch (error) {
          Alert.alert(
            'Erreur',
            'Impossible de renommer le fichier.'
          );
        }
      },
      'plain-text',
      fileName
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      {/* TOP BAR */}
      <View
        style={[
          styles.topBar,
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
          hitSlop={8}
          style={({ pressed }) => [
            styles.backButton,
            {
              opacity: pressed
                ? 0.55
                : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.backIcon,
              {
                color: colors.text,
              },
            ]}
          >
            ‹
          </Text>
        </Pressable>

        <View
          style={
            styles.projectHeader
          }
        >
          <Text
            numberOfLines={1}
            style={[
              styles.projectName,
              {
                color:
                  colors.textStrong,
              },
            ]}
          >
            {project?.name ||
              'Nouveau projet'}
          </Text>

          <View
            style={
              styles.fileStatus
            }
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    isSaved
                      ? colors.green
                      : colors.yellow,
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color:
                    colors.muted,
                },
              ]}
            >
              {saving
                ? 'Enregistrement…'
                : isSaved
                  ? 'Enregistré'
                  : 'Modifié'}
            </Text>
          </View>
        </View>

        <View
          style={styles.topActions}
        >
          <Pressable
            onPress={handleSave}
            hitSlop={8}
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor:
                  isSaved
                    ? colors.panel2
                    : colors.purple,
                borderColor:
                  isSaved
                    ? colors.border
                    : colors.purple,
                opacity: pressed
                  ? 0.6
                  : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.saveText,
                {
                  color: isSaved
                    ? colors.muted
                    : '#FFFFFF',
                },
              ]}
            >
              {saving
                ? '...'
                : 'Sauver'}
            </Text>
          </Pressable>

          <Pressable
            onPress={onPreview}
            hitSlop={8}
            style={({ pressed }) => [
              styles.runButton,
              {
                backgroundColor:
                  colors.purple,
                opacity: pressed
                  ? 0.75
                  : 1,
              },
            ]}
          >
            <Text
              style={
                styles.runIcon
              }
            >
              ▶
            </Text>
          </Pressable>
        </View>
      </View>

      {/* FILE TABS */}
      <View
        style={[
          styles.tabsBar,
          {
            backgroundColor:
              colors.panel2,
            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.tab,
            {
              borderBottomColor:
                colors.purple,
            },
          ]}
        >
          <Text
            style={[
              styles.fileIcon,
              {
                color:
                  colors.purple,
              },
            ]}
          >
            JS
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.tabText,
              {
                color:
                  colors.text,
              },
            ]}
          >
            {activeFile}
          </Text>

          {!isSaved && (
            <View
              style={[
                styles.modifiedDot,
                {
                  backgroundColor:
                    colors.yellow,
                },
              ]}
            />
          )}
        </View>

        <Pressable
          onPress={() =>
            setShowExplorer(
              (value) => !value
            )
          }
          style={({ pressed }) => [
            styles.explorerToggle,
            {
              opacity: pressed
                ? 0.55
                : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.explorerIcon,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            ☰
          </Text>
        </Pressable>
      </View>

      <View
        style={styles.workspace}
      >
        {/* EXPLORER */}
        {showExplorer && (
          <View
            style={[
              styles.explorer,
              {
                backgroundColor:
                  colors.panel,
                borderRightColor:
                  colors.border,
              },
            ]}
          >
            <View
              style={
                styles.explorerHeader
              }
            >
              <Text
                style={[
                  styles.explorerTitle,
                  {
                    color:
                      colors.muted,
                  },
                ]}
              >
                EXPLORER
              </Text>

              <Pressable
                onPress={handleAddFile}
                hitSlop={8}
              >
                <Text
                  style={[
                    styles.explorerAction,
                    {
                      color:
                        colors.muted,
                    },
                  ]}
                >
                  +
                </Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.folder,
                {
                  backgroundColor:
                    colors.panel2,
                },
              ]}
            >
              <Text
                style={[
                  styles.folderArrow,
                  {
                    color:
                      colors.muted,
                  },
                ]}
              >
                ▾
              </Text>

              <Text
                style={[
                  styles.folderIcon,
                  {
                    color:
                      colors.yellow,
                  },
                ]}
              >
                ■
              </Text>

              <Text
                numberOfLines={1}
                style={[
                  styles.folderName,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                {project?.name ||
                  'project'}
              </Text>
            </View>

            {fileNames.map(
              (fileName) => {
                const active =
                  fileName ===
                  activeFile;

                return (
                  <Pressable
                    key={fileName}
                    onPress={() =>
                      openFile(
                        fileName
                      )
                    }
                    onLongPress={() =>
                      handleRenameFile(
                        fileName
                      )
                    }
                    style={[
                      styles.fileItem,
                      {
                        backgroundColor:
                          active
                            ? colors.panel2
                            : 'transparent',
                        borderLeftColor:
                          active
                            ? colors.purple
                            : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.fileType,
                        {
                          color:
                            getFileColor(
                              fileName,
                              colors
                            ),
                        },
                      ]}
                    >
                      {getFileType(
                        fileName
                      )}
                    </Text>

                    <Text
                      numberOfLines={1}
                      style={[
                        styles.fileName,
                        {
                          color:
                            active
                              ? colors.textStrong
                              : colors.muted,
                        },
                      ]}
                    >
                      {fileName}
                    </Text>
                  </Pressable>
                );
              }
            )}

            <View
              style={
                styles.explorerHint
              }
            >
              <Text
                style={[
                  styles.explorerHintText,
                  {
                    color:
                      colors.muted2,
                  },
                ]}
              >
                Maintiens un fichier
                pour le renommer.
              </Text>
            </View>
          </View>
        )}

        {/* EDITOR */}
        <KeyboardAvoidingView
          style={
            styles.editorContainer
          }
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={
              styles.editorScroll
            }
          >
            <View
              style={[
                styles.editor,
                {
                  backgroundColor:
                    colors.editor,
                },
              ]}
            >
              {/* LINE NUMBERS */}
              <View
                style={
                  styles.lineNumbers
                }
              >
                {lines.map(
                  (_, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.lineNumber,
                        {
                          color:
                            colors.muted2,
                        },
                      ]}
                    >
                      {String(
                        index + 1
                      ).padStart(
                        3,
                        ' '
                      )}
                    </Text>
                  )
                )}
              </View>

              {/* CODE */}
              <TextInput
                value={code}
                onChangeText={
                  handleChange
                }
                onSelectionChange={(
                  event
                ) =>
                  setCursorPosition(
                    event.nativeEvent
                      .selection
                  )
                }
                multiline
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                scrollEnabled={false}
                style={[
                  styles.codeInput,
                  {
                    color:
                      colors.editorText,
                    backgroundColor:
                      colors.editor,
                  },
                ]}
              />
            </View>
          </ScrollView>

          {/* TOOLBAR */}
          <View
            style={[
              styles.toolbar,
              {
                backgroundColor:
                  colors.panel2,
                borderTopColor:
                  colors.border,
              },
            ]}
          >
            <ToolbarButton
              label="TAB"
              onPress={() =>
                insertText('  ')
              }
              colors={colors}
            />

            <ToolbarButton
              label="{ }"
              onPress={() =>
                insertText('{}')
              }
              colors={colors}
            />

            <ToolbarButton
              label="( )"
              onPress={() =>
                insertText('()')
              }
              colors={colors}
            />

            <ToolbarButton
              label="[ ]"
              onPress={() =>
                insertText('[]')
              }
              colors={colors}
            />

            <ToolbarButton
              label="="
              onPress={() =>
                insertText(' = ')
              }
              colors={colors}
            />

            <ToolbarButton
              label=";"
              onPress={() =>
                insertText(';')
              }
              colors={colors}
            />

            <ToolbarButton
              label="→"
              onPress={() =>
                insertText(' => ')
              }
              colors={colors}
            />

            <ToolbarButton
              label="⌫"
              onPress={
                deletePreviousCharacter
              }
              colors={colors}
            />
          </View>

          {/* STATUS BAR */}
          <View
            style={[
              styles.statusBar,
              {
                backgroundColor:
                  colors.purple,
              },
            ]}
          >
            <Text
              style={
                styles.statusBarText
              }
            >
              {getLanguage(
                activeFile
              )}
            </Text>

            <Text
              style={
                styles.statusBarText
              }
            >
              UTF-8
            </Text>

            <Text
              style={
                styles.statusBarText
              }
            >
              {lines.length} lignes
            </Text>

            <Text
              style={
                styles.statusBarText
              }
            >
              {isSaved
                ? 'Saved'
                : 'Unsaved'}
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* NEW FILE MODAL */}
      {isAddingFile && (
        <View
          style={[
            styles.modalOverlay,
            {
              backgroundColor:
                colors.overlay,
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
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                {
                  color:
                    colors.textStrong,
                },
              ]}
            >
              Nouveau fichier
            </Text>

            <Text
              style={[
                styles.modalSubtitle,
                {
                  color:
                    colors.muted,
                },
              ]}
            >
              Exemple : app.js,
              styles.css ou index.html
            </Text>

            <TextInput
              value={newFileName}
              onChangeText={
                setNewFileName
              }
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="nom-du-fichier.js"
              placeholderTextColor={
                colors.muted2
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
                onPress={() =>
                  setIsAddingFile(
                    false
                  )
                }
                style={[
                  styles.modalButton,
                  {
                    backgroundColor:
                      colors.panel2,
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
                        colors.muted,
                    },
                  ]}
                >
                  Annuler
                </Text>
              </Pressable>

              <Pressable
                onPress={
                  confirmAddFile
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
                        '#FFFFFF',
                    },
                  ]}
                >
                  Créer
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function ToolbarButton({
  label,
  onPress,
  colors,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolbarButton,
        {
          backgroundColor:
            colors.panel,
          borderColor:
            colors.border,
          opacity: pressed
            ? 0.55
            : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.toolbarButtonText,
          {
            color:
              colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function getFileType(fileName) {
  const extension =
    fileName
      .split('.')
      .pop()
      ?.toLowerCase();

  switch (extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return 'JS';

    case 'json':
      return '{}';

    case 'html':
      return 'HTML';

    case 'css':
      return '#';

    case 'md':
      return 'MD';

    default:
      return 'FILE';
  }
}

function getFileColor(
  fileName,
  colors
) {
  const extension =
    fileName
      .split('.')
      .pop()
      ?.toLowerCase();

  switch (extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return colors.yellow;

    case 'json':
      return colors.blue;

    case 'html':
      return colors.orange;

    case 'css':
      return colors.purpleLight;

    case 'md':
      return colors.red;

    default:
      return colors.muted;
  }
}

function getLanguage(fileName) {
  const extension =
    fileName
      .split('.')
      .pop()
      ?.toLowerCase();

  switch (extension) {
    case 'js':
      return 'JavaScript';

    case 'jsx':
      return 'React JSX';

    case 'ts':
      return 'TypeScript';

    case 'tsx':
      return 'React TSX';

    case 'html':
      return 'HTML';

    case 'css':
      return 'CSS';

    case 'json':
      return 'JSON';

    case 'md':
      return 'Markdown';

    default:
      return 'Plain Text';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },

  backButton: {
    width: 40,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backIcon: {
    fontSize: 32,
    fontWeight: '300',
    marginTop: -3,
  },

  projectHeader: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 5,
  },

  projectName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },

  fileStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusText: {
    fontSize: 9,
  },

  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  saveButton: {
    height: 38,
    minWidth: 55,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveText: {
    fontSize: 10,
    fontWeight: '700',
  },

  runButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  runIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 2,
  },

  tabsBar: {
    height: 43,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
  },

  tab: {
    flex: 1,
    minWidth: 150,
    maxWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 2,
  },

  fileIcon: {
    fontSize: 8,
    fontWeight: '900',
    marginRight: 7,
  },

  tabText: {
    fontSize: 11,
    fontWeight: '600',
  },

  modifiedDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginLeft: 7,
  },

  explorerToggle: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },

  explorerIcon: {
    fontSize: 17,
  },

  workspace: {
    flex: 1,
    flexDirection: 'row',
  },

  explorer: {
    width: 150,
    borderRightWidth: 1,
  },

  explorerHeader: {
    height: 43,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },

  explorerTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  explorerAction: {
    fontSize: 21,
    fontWeight: '300',
  },

  folder: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
  },

  folderArrow: {
    fontSize: 11,
    marginRight: 5,
  },

  folderIcon: {
    fontSize: 9,
    marginRight: 6,
  },

  folderName: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
  },

  fileItem: {
    minHeight: 35,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 6,
    borderLeftWidth: 2,
  },

  fileType: {
    fontSize: 7,
    fontWeight: '900',
    width: 31,
  },

  fileName: {
    flex: 1,
    fontSize: 10,
  },

  explorerHint: {
    paddingHorizontal: 12,
    paddingTop: 14,
  },

  explorerHintText: {
    fontSize: 8,
    lineHeight: 13,
  },

  editorContainer: {
    flex: 1,
    minWidth: 0,
  },

  editorScroll: {
    flexGrow: 1,
  },

  editor: {
    minHeight: '100%',
    flexDirection: 'row',
    paddingTop: 12,
    paddingRight: 30,
  },

  lineNumbers: {
    width: 42,
    alignItems: 'flex-end',
    paddingRight: 10,
  },

  lineNumber: {
    height: 20,
    lineHeight: 20,
    fontSize: 10,
    fontFamily:
      Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        default: 'monospace',
      }),
  },

  codeInput: {
    minWidth: 500,
    minHeight: 600,
    padding: 0,
    margin: 0,
    fontSize: 12,
    lineHeight: 20,
    fontFamily:
      Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        default: 'monospace',
      }),
  },

  toolbar: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 5,
    borderTopWidth: 1,
  },

  toolbarButton: {
    minWidth: 35,
    height: 32,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },

  toolbarButtonText: {
    fontSize: 10,
    fontWeight: '700',
  },

  statusBar: {
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },

  statusBarText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '600',
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
    maxWidth: 380,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 7,
  },

  modalSubtitle: {
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 16,
  },

  modalInput: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12,
    marginBottom: 16,
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },

  modalButton: {
    minWidth: 85,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  modalButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
