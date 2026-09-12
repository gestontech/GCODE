import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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

import {
  loadEditorSettings,
} from '../storage/editorSettings';

import {
  createTerminalEngine,
} from '../storage/terminalEngine';

export default function WorkbenchScreen({
  project,
  onBack,
  onPreview,
  onProjectUpdated,
}) {
  const {
    colors,
    spacing,
    radius,
  } = useTheme();

  const editorRef = useRef(null);
  const lineScrollRef = useRef(null);

  const codeRef = useRef('');
  const selectionRef = useRef({
    start: 0,
    end: 0,
  });

  const historyRef = useRef([]);
  const redoRef = useRef([]);

  const suppressChangeRef = useRef(null);

  const autoSaveTimerRef = useRef(null);

  const [files, setFiles] = useState({});
  const [activeFile, setActiveFile] =
    useState(null);
  const [code, setCode] = useState('');

  const [selection, setSelection] =
    useState({
      start: 0,
      end: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [dirty, setDirty] =
    useState(false);

  const [editorSettings, setEditorSettings] =
    useState({
      autoSave: true,
      lineNumbers: true,
    });

  const [showExplorer, setShowExplorer] =
    useState(true);

  const [showSearch, setShowSearch] =
    useState(false);

  const [searchText, setSearchText] =
    useState('');

  const [replaceText, setReplaceText] =
    useState('');

  const [searchIndex, setSearchIndex] =
    useState(-1);

  const [
    showNewFileModal,
    setShowNewFileModal,
  ] = useState(false);

  const [newFileName, setNewFileName] =
    useState('');

  const [
    showRenameModal,
    setShowRenameModal,
  ] = useState(false);

  const [renameTarget, setRenameTarget] =
    useState(null);

  const [renameFileName, setRenameFileName] =
    useState('');

  const [showTerminal, setShowTerminal] =
    useState(false);

  const [terminalInput, setTerminalInput] =
    useState('');

  const [terminalLines, setTerminalLines] =
    useState([
      {
        type: 'system',
        text:
          'GCODE Terminal V3.1 — tape "help" pour commencer.',
      },
    ]);

  const [terminalCwd, setTerminalCwd] =
    useState('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor:
            colors.background,
        },

        header: {
          minHeight: 62,
          paddingHorizontal:
            spacing.md,
          paddingTop:
            Platform.OS === 'ios'
              ? 8
              : 4,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor:
            colors.border,
          backgroundColor:
            colors.backgroundElevated,
        },

        headerButton: {
          width: 40,
          height: 40,
          borderRadius: radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            colors.panel2,
          borderWidth: 1,
          borderColor:
            colors.border,
        },

        headerButtonText: {
          color: colors.text,
          fontSize: 20,
          fontWeight: '600',
        },

        headerCenter: {
          flex: 1,
          paddingHorizontal:
            spacing.sm,
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
          backgroundColor:
            colors.purple,
        },

        previewButtonText: {
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: '700',
        },

        toolbar: {
          minHeight: 48,
          paddingHorizontal:
            spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor:
            colors.border,
          backgroundColor:
            colors.panel,
        },

        toolbarScroll: {
          flex: 1,
        },

        toolbarButton: {
          minWidth: 38,
          height: 36,
          marginRight: 6,
          paddingHorizontal: 9,
          borderRadius: radius.xs,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            colors.panel2,
          borderWidth: 1,
          borderColor:
            colors.border,
        },

        toolbarButtonText: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '600',
        },

        disabledButton: {
          opacity: 0.35,
        },

        statusText: {
          marginLeft: 6,
          color: dirty
            ? colors.yellow
            : colors.green,
          fontSize: 11,
          fontWeight: '600',
        },

        workspace: {
          flex: 1,
          flexDirection: 'row',
        },

        explorer: {
          width: showExplorer
            ? 190
            : 0,
          overflow: 'hidden',
          backgroundColor:
            colors.panel,
          borderRightWidth:
            showExplorer ? 1 : 0,
          borderRightColor:
            colors.border,
        },

        explorerHeader: {
          height: 48,
          paddingHorizontal:
            spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor:
            colors.border,
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
          backgroundColor:
            colors.panel2,
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
          backgroundColor:
            colors.editorSelection,
          borderWidth: 1,
          borderColor:
            colors.purpleDark,
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

        fileMenuButton: {
          width: 28,
          height: 28,
          alignItems: 'center',
          justifyContent: 'center',
        },

        fileMenuText: {
          color: colors.muted,
          fontSize: 16,
          fontWeight: '700',
        },

        editorArea: {
          flex: 1,
          backgroundColor:
            colors.editor,
        },

        editorHeader: {
          minHeight: 36,
          paddingHorizontal:
            spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor:
            colors.editorActiveLine,
          borderBottomWidth: 1,
          borderBottomColor:
            colors.editorLine,
        },

        editorHeaderText: {
          color: colors.muted,
          fontSize: 11,
        },

        editor: {
          flex: 1,
          flexDirection: 'row',
        },

        lineScroll: {
          width: 48,
          backgroundColor:
            colors.editor,
          borderRightWidth: 1,
          borderRightColor:
            colors.editorLine,
        },

        lineNumbers: {
          paddingTop: 12,
          paddingRight: 8,
          paddingBottom: 40,
        },

        lineNumber: {
          height: 22,
          color: colors.muted2,
          fontSize: 12,
          lineHeight: 22,
          textAlign: 'right',
          fontFamily:
            Platform.OS === 'ios'
              ? 'Menlo'
              : 'monospace',
        },

        codeInput: {
          flex: 1,
          minHeight: '100%',
          paddingHorizontal: 12,
          paddingTop: 12,
          paddingBottom: 40,
          color: colors.editorText,
          backgroundColor:
            colors.editor,
          fontSize: 13,
          lineHeight: 22,
          fontFamily:
            Platform.OS === 'ios'
              ? 'Menlo'
              : 'monospace',
          textAlignVertical: 'top',
        },

        searchPanel: {
          padding: spacing.sm,
          backgroundColor:
            colors.panel,
          borderTopWidth: 1,
          borderTopColor:
            colors.border,
        },

        searchRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 7,
        },

        searchInput: {
          flex: 1,
          height: 40,
          paddingHorizontal: 12,
          borderRadius:
            radius.xs,
          backgroundColor:
            colors.editor,
          borderWidth: 1,
          borderColor:
            colors.borderStrong,
          color: colors.text,
          fontSize: 13,
        },

        searchButton: {
          height: 40,
          minWidth: 42,
          marginLeft: 6,
          paddingHorizontal: 10,
          borderRadius:
            radius.xs,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            colors.panel2,
          borderWidth: 1,
          borderColor:
            colors.border,
        },

        searchButtonText: {
          color: colors.text,
          fontSize: 12,
          fontWeight: '700',
        },

        searchClose: {
          height: 40,
          width: 40,
          marginLeft: 6,
          borderRadius:
            radius.xs,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            colors.panel2,
        },

        searchInfo: {
          color: colors.muted,
          fontSize: 11,
          marginTop: 2,
        },

        terminal: {
          height: 250,
          backgroundColor:
            colors.backgroundElevated,
          borderTopWidth: 1,
          borderTopColor:
            colors.borderStrong,
        },

        terminalHeader: {
          height: 42,
          paddingHorizontal:
            spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor:
            colors.border,
        },

        terminalTitle: {
          flex: 1,
          color: colors.textStrong,
          fontSize: 12,
          fontWeight: '700',
        },

        terminalClose: {
          width: 34,
          height: 32,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius:
            radius.xs,
          backgroundColor:
            colors.panel2,
        },

        terminalCloseText: {
          color: colors.text,
          fontSize: 16,
        },

        terminalOutput: {
          flex: 1,
          padding: 10,
        },

        terminalLine: {
          color: colors.text,
          fontSize: 12,
          lineHeight: 18,
          fontFamily:
            Platform.OS === 'ios'
              ? 'Menlo'
              : 'monospace',
        },

        terminalSystem: {
          color: colors.muted,
        },

        terminalCommand: {
          color: colors.purpleLight,
        },

        terminalError: {
          color: colors.red,
        },

        terminalInputRow: {
          minHeight: 44,
          paddingHorizontal: 8,
          paddingBottom: 7,
          flexDirection: 'row',
          alignItems: 'center',
        },

        terminalPrompt: {
          color: colors.green,
          fontSize: 12,
          fontFamily:
            Platform.OS === 'ios'
              ? 'Menlo'
              : 'monospace',
          marginRight: 6,
        },

        terminalInput: {
          flex: 1,
          height: 38,
          paddingHorizontal: 9,
          borderRadius:
            radius.xs,
          backgroundColor:
            colors.editor,
          borderWidth: 1,
          borderColor:
            colors.borderStrong,
          color: colors.text,
          fontSize: 12,
          fontFamily:
            Platform.OS === 'ios'
              ? 'Menlo'
              : 'monospace',
        },

        terminalSend: {
          width: 42,
          height: 38,
          marginLeft: 6,
          borderRadius:
            radius.xs,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            colors.purple,
        },

        terminalSendText: {
          color: '#FFFFFF',
          fontSize: 16,
          fontWeight: '700',
        },

        modalOverlay: {
          flex: 1,
          backgroundColor:
            colors.overlay,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.lg,
        },

        modalCard: {
          width: '100%',
          maxWidth: 420,
          backgroundColor:
            colors.panel,
          borderRadius:
            radius.lg,
          borderWidth: 1,
          borderColor:
            colors.borderStrong,
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
          marginBottom:
            spacing.md,
        },

        input: {
          height: 48,
          paddingHorizontal: 14,
          borderRadius:
            radius.sm,
          borderWidth: 1,
          borderColor:
            colors.borderStrong,
          backgroundColor:
            colors.editor,
          color: colors.text,
          fontSize: 14,
        },

        modalActions: {
          flexDirection: 'row',
          justifyContent:
            'flex-end',
          marginTop: spacing.md,
        },

        modalButton: {
          minWidth: 92,
          height: 44,
          paddingHorizontal: 14,
          marginLeft: 8,
          borderRadius:
            radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
        },

        cancelButton: {
          backgroundColor:
            colors.panel2,
          borderWidth: 1,
          borderColor:
            colors.border,
        },

        confirmButton: {
          backgroundColor:
            colors.purple,
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
    [
      colors,
      spacing,
      radius,
      dirty,
      showExplorer,
    ]
  );

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const settings =
          await loadEditorSettings();

        if (mounted) {
          setEditorSettings(
            settings
          );
        }
      } catch (error) {
        console.error(
          'Erreur paramètres:',
          error
        );
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadProject() {
      if (!project?.id) {
        setFiles({});
        setActiveFile(null);
        setCode('');
        codeRef.current = '';
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const storedProject =
          await getProject(
            project.id
          );

        if (!mounted) {
          return;
        }

        const projectFiles =
          storedProject?.files ||
          project?.files ||
          {};

        const names =
          Object.keys(
            projectFiles
          );

        const initialFile =
          storedProject?.activeFile ||
          project?.activeFile ||
          names[0] ||
          null;

        const initialCode =
          initialFile
            ? projectFiles[
                initialFile
              ] || ''
            : '';

        setFiles(projectFiles);
        setActiveFile(initialFile);
        setCode(initialCode);

        codeRef.current =
          initialCode;

        setSelection({
          start:
            initialCode.length,
          end:
            initialCode.length,
        });

        selectionRef.current = {
          start:
            initialCode.length,
          end:
            initialCode.length,
        };

        historyRef.current = [];
        redoRef.current = [];

        setDirty(false);
        setLoading(false);
      } catch (error) {
        console.error(
          'Erreur chargement projet:',
          error
        );

        if (mounted) {
          setFiles({});
          setActiveFile(null);
          setCode('');
          codeRef.current = '';
          setDirty(false);
          setLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      mounted = false;
    };
  }, [project?.id]);

  useEffect(() => {
    return () => {
      if (
        autoSaveTimerRef.current
      ) {
        clearTimeout(
          autoSaveTimerRef.current
        );

        autoSaveTimerRef.current =
          null;
      }
    };
  }, []);

  const lineCount = Math.max(
    code.split('\n').length,
    1
  );

  const lineNumbers = Array.from(
    {
      length: lineCount,
    },
    (_, index) => index + 1
  );

  const notifyProjectUpdated =
    (updatedProject) => {
      if (
        typeof onProjectUpdated ===
        'function'
      ) {
        onProjectUpdated(
          updatedProject
        );
      }
    };

  const performSave = async (
    nextCode = codeRef.current
  ) => {
    if (
      !project?.id ||
      !activeFile
    ) {
      return false;
    }

    setSaving(true);

    try {
      const updatedProject =
        await saveProjectFile(
          project.id,
          activeFile,
          nextCode
        );

      if (updatedProject) {
        setFiles(
          updatedProject.files ||
            {}
        );

        notifyProjectUpdated(
          updatedProject
        );
      }

      setDirty(false);

      return true;
    } catch (error) {
      console.error(
        'Erreur sauvegarde:',
        error
      );

      Alert.alert(
        'Erreur',
        'Impossible de sauvegarder le fichier.'
      );

      return false;
    } finally {
      setSaving(false);
    }
  };

  const scheduleAutoSave = (
    nextCode
  ) => {
    if (
      !editorSettings.autoSave
    ) {
      return;
    }

    if (
      autoSaveTimerRef.current
    ) {
      clearTimeout(
        autoSaveTimerRef.current
      );
    }

    autoSaveTimerRef.current =
      setTimeout(
        () => {
          performSave(
            nextCode
          );
        },
        1200
      );
  };

  const pushHistory = (
    previousCode
  ) => {
    if (
      typeof previousCode !==
      'string'
    ) {
      return;
    }

    const history =
      historyRef.current;

    if (
      history.length &&
      history[
        history.length - 1
      ] === previousCode
    ) {
      return;
    }

    history.push(
      previousCode
    );

    if (
      history.length > 100
    ) {
      history.shift();
    }
  };

  const handleCodeChange = (
    nextCode
  ) => {
    if (
      suppressChangeRef.current !==
      null
    ) {
      if (
        nextCode ===
        suppressChangeRef.current
      ) {
        suppressChangeRef.current =
          null;
        return;
      }

      suppressChangeRef.current =
        null;
    }

    const previousCode =
      codeRef.current;

    if (
      nextCode ===
      previousCode
    ) {
      return;
    }

    pushHistory(
      previousCode
    );

    redoRef.current = [];

    codeRef.current =
      nextCode;

    setCode(nextCode);
    setDirty(true);

    scheduleAutoSave(
      nextCode
    );
  };

  const handleSelectionChange = (
    event
  ) => {
    const nextSelection =
      event?.nativeEvent
        ?.selection || {
        start: 0,
        end: 0,
      };

    selectionRef.current =
      nextSelection;

    setSelection(
      nextSelection
    );
  };

  const restoreCode = (
    nextCode
  ) => {
    suppressChangeRef.current =
      nextCode;

    codeRef.current =
      nextCode;

    setCode(nextCode);

    const nextSelection =
      {
        start:
          Math.min(
            selectionRef.current
              .start,
            nextCode.length
          ),
        end:
          Math.min(
            selectionRef.current
              .end,
            nextCode.length
          ),
      };

    selectionRef.current =
      nextSelection;

    setSelection(
      nextSelection
    );

    setDirty(true);

    scheduleAutoSave(
      nextCode
    );

    requestAnimationFrame(
      () => {
        editorRef.current?.focus();

        editorRef.current?.setNativeProps?.(
          {
            selection:
              nextSelection,
          }
        );
      }
    );
  };

  const handleUndo = () => {
    if (
      !historyRef.current.length
    ) {
      return;
    }

    const currentCode =
      codeRef.current;

    const previousCode =
      historyRef.current.pop();

    redoRef.current.push(
      currentCode
    );

    restoreCode(
      previousCode
    );
  };

  const handleRedo = () => {
    if (
      !redoRef.current.length
    ) {
      return;
    }

    const currentCode =
      codeRef.current;

    const nextCode =
      redoRef.current.pop();

    historyRef.current.push(
      currentCode
    );

    restoreCode(
      nextCode
    );
  };

  const insertTextAtCursor = (
    text
  ) => {
    const current =
      codeRef.current;

    const start =
      selectionRef.current
        .start;

    const end =
      selectionRef.current
        .end;

    const nextCode =
      current.slice(0, start) +
      text +
      current.slice(end);

    const cursor =
      start + text.length;

    selectionRef.current = {
      start: cursor,
      end: cursor,
    };

    setSelection({
      start: cursor,
      end: cursor,
    });

    handleCodeChange(
      nextCode
    );

    requestAnimationFrame(
      () => {
        editorRef.current?.focus();
      }
    );
  };

  const switchFile = async (
    fileName
  ) => {
    if (
      fileName === activeFile
    ) {
      return;
    }

    if (dirty) {
      const saved =
        await performSave();

      if (!saved) {
        return;
      }
    }

    const nextCode =
      files[fileName] || '';

    setActiveFile(
      fileName
    );

    codeRef.current =
      nextCode;

    setCode(nextCode);

    historyRef.current = [];
    redoRef.current = [];

    setSelection({
      start:
        nextCode.length,
      end:
        nextCode.length,
    });

    selectionRef.current = {
      start:
        nextCode.length,
      end:
        nextCode.length,
    };

    setDirty(false);
  };

  const handleManualSave =
    async () => {
      await performSave();
    };

  const handleAddFile = async () => {
    const name =
      newFileName.trim();

    if (!name) {
      return;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        files,
        name
      )
    ) {
      Alert.alert(
        'Fichier existant',
        'Ce fichier existe déjà.'
      );
      return;
    }

    try {
      const updatedProject =
        await addProjectFile(
          project.id,
          name,
          ''
        );

      setFiles(
        updatedProject?.files ||
          {}
      );

      notifyProjectUpdated(
        updatedProject
      );

      setShowNewFileModal(
        false
      );

      setNewFileName('');

      if (
        !activeFile
      ) {
        await switchFile(
          name
        );
      }
    } catch (error) {
      console.error(
        'Erreur création fichier:',
        error
      );

      Alert.alert(
        'Erreur',
        'Impossible de créer le fichier.'
      );
    }
  };

  const handleDeleteFile =
    async (fileName) => {
      if (
        Object.keys(files)
          .length <= 1
      ) {
        Alert.alert(
          'Action impossible',
          'Le projet doit conserver au moins un fichier.'
        );
        return;
      }

      Alert.alert(
        'Supprimer le fichier',
        `Voulez-vous supprimer ${fileName} ?`,
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress:
              async () => {
                try {
                  if (
                    fileName ===
                    activeFile
                  ) {
                    const names =
                      Object.keys(
                        files
                      ).filter(
                        (item) =>
                          item !==
                          fileName
                      );

                    if (
                      dirty
                    ) {
                      await performSave();
                    }

                    const nextFile =
                      names[0];

                    const nextCode =
                      files[
                        nextFile
                      ] || '';

                    setActiveFile(
                      nextFile
                    );

                    codeRef.current =
                      nextCode;

                    setCode(
                      nextCode
                    );

                    historyRef.current =
                      [];

                    redoRef.current =
                      [];

                    setDirty(false);
                  }

                  const updatedProject =
                    await deleteProjectFile(
                      project.id,
                      fileName
                    );

                  setFiles(
                    updatedProject?.files ||
                      {}
                  );

                  notifyProjectUpdated(
                    updatedProject
                  );
                } catch (error) {
                  console.error(
                    'Erreur suppression fichier:',
                    error
                  );

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

  const openRenameFile =
    (fileName) => {
      setRenameTarget(
        fileName
      );

      setRenameFileName(
        fileName
      );

      setShowRenameModal(
        true
      );
    };

  const handleRenameFile =
    async () => {
      const nextName =
        renameFileName.trim();

      if (
        !renameTarget ||
        !nextName
      ) {
        return;
      }

      if (
        nextName !==
          renameTarget &&
        Object.prototype.hasOwnProperty.call(
          files,
          nextName
        )
      ) {
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
            renameTarget,
            nextName
          );

        const updatedFiles =
          updatedProject?.files ||
          {};

        setFiles(
          updatedFiles
        );

        if (
          activeFile ===
          renameTarget
        ) {
          setActiveFile(
            nextName
          );

          const nextCode =
            updatedFiles[
              nextName
            ] || '';

          codeRef.current =
            nextCode;

          setCode(
            nextCode
          );
        }

        notifyProjectUpdated(
          updatedProject
        );

        setShowRenameModal(
          false
        );

        setRenameTarget(
          null
        );
      } catch (error) {
        console.error(
          'Erreur renommage:',
          error
        );

        Alert.alert(
          'Erreur',
          'Impossible de renommer le fichier.'
        );
      }
    };

  const getMatches = () => {
    if (
      !searchText ||
      !code
    ) {
      return [];
    }

    const matches = [];
    let start = 0;

    while (true) {
      const index =
        code.indexOf(
          searchText,
          start
        );

      if (index === -1) {
        break;
      }

      matches.push(index);

      start =
        index +
        Math.max(
          searchText.length,
          1
        );
    }

    return matches;
  };

  const handleFindNext = () => {
    const matches =
      getMatches();

    if (!matches.length) {
      setSearchIndex(-1);
      return;
    }

    const nextIndex =
      (searchIndex + 1) %
      matches.length;

    const position =
      matches[nextIndex];

    setSearchIndex(
      nextIndex
    );

    selectionRef.current = {
      start: position,
      end:
        position +
        searchText.length,
    };

    setSelection(
      selectionRef.current
    );

    requestAnimationFrame(
      () => {
        editorRef.current?.focus();
      }
    );
  };

  const handleReplaceCurrent =
    () => {
      if (
        !searchText
      ) {
        return;
      }

      const start =
        selectionRef.current
          .start;

      const end =
        selectionRef.current
          .end;

      const selected =
        code.slice(
          start,
          end
        );

      if (
        selected !==
        searchText
      ) {
        handleFindNext();
        return;
      }

      const nextCode =
        code.slice(
          0,
          start
        ) +
        replaceText +
        code.slice(end);

      const cursor =
        start +
        replaceText.length;

      selectionRef.current = {
        start: cursor,
        end: cursor,
      };

      setSelection(
        selectionRef.current
      );

      handleCodeChange(
        nextCode
      );
    };

  const handleReplaceAll =
    () => {
      if (
        !searchText
      ) {
        return;
      }

      if (
        !code.includes(
          searchText
        )
      ) {
        return;
      }

      const nextCode =
        code.split(
          searchText
        ).join(
          replaceText
        );

      handleCodeChange(
        nextCode
      );

      setSearchIndex(-1);
    };

  const handlePreview =
    async () => {
      if (dirty) {
        const saved =
          await performSave();

        if (!saved) {
          return;
        }
      }

      if (
        typeof onPreview ===
        'function'
      ) {
        onPreview();
      }
    };

  const handleBack = async () => {
    if (!dirty) {
      onBack?.();
      return;
    }

    Alert.alert(
      'Modifications non sauvegardées',
      'Voulez-vous sauvegarder avant de quitter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: () =>
            onBack?.(),
        },
        {
          text: 'Sauvegarder',
          onPress:
            async () => {
              const saved =
                await performSave();

              if (saved) {
                onBack?.();
              }
            },
        },
      ]
    );
  };

  const handleTerminalCreate =
    async (
      fileName,
      content
    ) => {
      const updatedProject =
        await addProjectFile(
          project.id,
          fileName,
          content
        );

      const updatedFiles =
        updatedProject?.files ||
        {};

      setFiles(
        updatedFiles
      );

      notifyProjectUpdated(
        updatedProject
      );
    };

  const handleTerminalDelete =
    async (
      fileName
    ) => {
      if (
        Object.keys(files)
          .length <= 1
      ) {
        throw new Error(
          'Le projet doit conserver au moins un fichier.'
        );
      }

      const updatedProject =
        await deleteProjectFile(
          project.id,
          fileName
        );

      const updatedFiles =
        updatedProject?.files ||
        {};

      setFiles(
        updatedFiles
      );

      if (
        activeFile ===
        fileName
      ) {
        const nextFile =
          Object.keys(
            updatedFiles
          )[0] || null;

        setActiveFile(
          nextFile
        );

        const nextCode =
          nextFile
            ? updatedFiles[
                nextFile
              ] || ''
            : '';

        codeRef.current =
          nextCode;

        setCode(
          nextCode
        );

        historyRef.current =
          [];

        redoRef.current =
          [];

        setDirty(false);
      }

      notifyProjectUpdated(
        updatedProject
      );
    };

  const handleTerminalWrite =
    async (
      fileName,
      content
    ) => {
      const updatedProject =
        await saveProjectFile(
          project.id,
          fileName,
          content
        );

      const updatedFiles =
        updatedProject?.files ||
        {};

      setFiles(
        updatedFiles
      );

      if (
        activeFile ===
        fileName
      ) {
        codeRef.current =
          content;

        setCode(
          content
        );

        historyRef.current =
          [];

        redoRef.current =
          [];

        setDirty(false);
      }

      notifyProjectUpdated(
        updatedProject
      );
    };

  const terminalEngine =
    useMemo(
      () =>
        createTerminalEngine({
          project,
          files,
          cwd: terminalCwd,
          onCreateFile:
            handleTerminalCreate,
          onDeleteFile:
            handleTerminalDelete,
          onWriteFile:
            handleTerminalWrite,
        }),
      [
        project,
        files,
        terminalCwd,
      ]
    );

  const executeTerminal =
    async () => {
      const command =
        terminalInput.trim();

      if (!command) {
        return;
      }

      setTerminalInput('');

      setTerminalLines(
        (current) => [
          ...current,
          {
            type: 'command',
            text:
              `$ ${command}`,
          },
        ]
      );

      try {
        const result =
          await terminalEngine.execute(
            command
          );

        if (
          result.output ===
          '__CLEAR__'
        ) {
          setTerminalLines([]);
        } else if (
          result.output
        ) {
          setTerminalLines(
            (current) => [
              ...current,
              {
                type: 'output',
                text:
                  result.output,
              },
            ]
          );
        }

        setTerminalCwd(
          result.nextCwd ||
            ''
        );

        await refreshFilesAfterTerminal();
      } catch (error) {
        setTerminalLines(
          (current) => [
            ...current,
            {
              type: 'error',
              text:
                error?.message ||
                'Erreur terminal.',
            },
          ]
        );
      }
    };

  const refreshFilesAfterTerminal =
    async () => {
      try {
        const latestProject =
          await getProject(
            project.id
          );

        if (!latestProject) {
          return;
        }

        const latestFiles =
          latestProject.files ||
          {};

        setFiles(
          latestFiles
        );

        notifyProjectUpdated(
          latestProject
        );
      } catch (error) {
        console.error(
          'Erreur actualisation terminal:',
          error
        );
      }
    };

  const fileIcon = (
    fileName
  ) => {
    const extension =
      fileName
        .split('.')
        .pop()
        ?.toLowerCase();

    if (
      extension === 'html'
    ) {
      return 'HTML';
    }

    if (
      extension === 'css'
    ) {
      return 'CSS';
    }

    if (
      extension === 'js'
    ) {
      return 'JS';
    }

    if (
      extension === 'json'
    ) {
      return '{}';
    }

    if (
      extension === 'md'
    ) {
      return 'MD';
    }

    return 'FILE';
  };

  if (loading) {
    return (
      <View
        style={
          styles.container
        }
      >
        <View
          style={
            styles.emptyEditor
          }
        >
          <Text
            style={
              styles.emptyEditorTitle
            }
          >
            Chargement...
          </Text>

          <Text
            style={
              styles.emptyEditorText
            }
          >
            Ouverture du projet
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={
        styles.container
      }
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <View
        style={
          styles.header
        }
      >
        <Pressable
          style={
            styles.headerButton
          }
          onPress={
            handleBack
          }
        >
          <Text
            style={
              styles.headerButtonText
            }
          >
            ‹
          </Text>
        </Pressable>

        <View
          style={
            styles.headerCenter
          }
        >
          <Text
            style={
              styles.projectTitle
            }
            numberOfLines={1}
          >
            {project?.name ||
              'Projet'}
          </Text>

          <Text
            style={
              styles.fileTitle
            }
            numberOfLines={1}
          >
            {activeFile ||
              'Aucun fichier'}
          </Text>
        </View>

        <Pressable
          style={
            styles.previewButton
          }
          onPress={
            handlePreview
          }
        >
          <Text
            style={
              styles.previewButtonText
            }
          >
            PREVIEW
          </Text>
        </Pressable>
      </View>

      <View
        style={
          styles.toolbar
        }
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          style={
            styles.toolbarScroll
          }
          contentContainerStyle={{
            alignItems:
              'center',
          }}
        >
          <Pressable
            style={[
              styles.toolbarButton,
              historyRef.current
                .length === 0 &&
                styles.disabledButton,
            ]}
            onPress={
              handleUndo
            }
          >
            <Text
              style={
                styles.toolbarButtonText
              }
            >
              ↶
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.toolbarButton,
              redoRef.current
                .length === 0 &&
                styles.disabledButton,
            ]}
            onPress={
              handleRedo
            }
          >
            <Text
              style={
                styles.toolbarButtonText
              }
            >
              ↷
            </Text>
          </Pressable>

          <Pressable
            style={
              styles.toolbarButton
            }
            onPress={() =>
              setShowExplorer(
                (value) =>
                  !value
              )
            }
          >
            <Text
              style={
                styles.toolbarButtonText
              }
            >
              FILES
            </Text>
          </Pressable>

          <Pressable
            style={
              styles.toolbarButton
            }
            onPress={() =>
              setShowSearch(
                (value) =>
                  !value
              )
            }
          >
            <Text
              style={
                styles.toolbarButtonText
              }
            >
              SEARCH
            </Text>
          </Pressable>

          <Pressable
            style={
              styles.toolbarButton
            }
            onPress={() =>
              setShowTerminal(
                (value) =>
                  !value
              )
            }
          >
            <Text
              style={
                styles.toolbarButtonText
              }
            >
              TERMINAL
            </Text>
          </Pressable>

          <Pressable
            style={
              styles.toolbarButton
            }
            onPress={
              handleManualSave
            }
          >
            <Text
              style={
                styles.toolbarButtonText
              }
            >
              SAVE
            </Text>
          </Pressable>

          <Text
            style={
              styles.statusText
            }
          >
            {saving
              ? 'Saving...'
              : dirty
              ? 'Unsaved'
              : 'Saved'}
          </Text>
        </ScrollView>
      </View>

      <View
        style={
          styles.workspace
        }
      >
        <View
          style={
            styles.explorer
          }
        >
          {showExplorer && (
            <>
              <View
                style={
                  styles.explorerHeader
                }
              >
                <Text
                  style={
                    styles.explorerTitle
                  }
                >
                  Explorer
                </Text>

                <Pressable
                  style={
                    styles.addButton
                  }
                  onPress={() =>
                    setShowNewFileModal(
                      true
                    )
                  }
                >
                  <Text
                    style={
                      styles.addButtonText
                    }
                  >
                    +
                  </Text>
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={
                  styles.fileList
                }
              >
                {Object.keys(
                  files
                ).map(
                  (fileName) => (
                    <Pressable
                      key={
                        fileName
                      }
                      style={[
                        styles.fileItem,
                        activeFile ===
                          fileName &&
                          styles.activeFileItem,
                      ]}
                      onPress={() =>
                        switchFile(
                          fileName
                        )
                      }
                    >
                      <Text
                        style={
                          styles.fileIcon
                        }
                      >
                        {fileIcon(
                          fileName
                        )}
                      </Text>

                      <Text
                        numberOfLines={
                          1
                        }
                        style={[
                          styles.fileName,
                          activeFile ===
                            fileName &&
                            styles.activeFileName,
                        ]}
                      >
                        {
                          fileName
                        }
                      </Text>

                      <Pressable
                        style={
                          styles.fileMenuButton
                        }
                        onPress={() =>
                          Alert.alert(
                            fileName,
                            'Choisir une action',
                            [
                              {
                                text:
                                  'Annuler',
                                style:
                                  'cancel',
                              },
                              {
                                text:
                                  'Renommer',
                                onPress:
                                  () =>
                                    openRenameFile(
                                      fileName
                                    ),
                              },
                              {
                                text:
                                  'Supprimer',
                                style:
                                  'destructive',
                                onPress:
                                  () =>
                                    handleDeleteFile(
                                      fileName
                                    ),
                              },
                            ]
                          )
                        }
                      >
                        <Text
                          style={
                            styles.fileMenuText
                          }
                        >
                          ⋮
                        </Text>
                      </Pressable>
                    </Pressable>
                  )
                )}
              </ScrollView>
            </>
          )}
        </View>

        <View
          style={
            styles.editorArea
          }
        >
          <View
            style={
              styles.editorHeader
            }
          >
            <Text
              style={
                styles.editorHeaderText
              }
            >
              {activeFile
                ? `${activeFile}  •  ${lineCount} lignes`
                : 'Aucun fichier'}
            </Text>
          </View>

          {activeFile ? (
            <View
              style={
                styles.editor
              }
            >
              {editorSettings.lineNumbers && (
                <ScrollView
                  ref={
                    lineScrollRef
                  }
                  scrollEnabled={
                    false
                  }
                  showsVerticalScrollIndicator={
                    false
                  }
                  style={
                    styles.lineScroll
                  }
                >
                  <View
                    style={
                      styles.lineNumbers
                    }
                  >
                    {lineNumbers.map(
                      (number) => (
                        <Text
                          key={
                            number
                          }
                          style={
                            styles.lineNumber
                          }
                        >
                          {
                            number
                          }
                        </Text>
                      )
                    )}
                  </View>
                </ScrollView>
              )}

              <TextInput
                ref={
                  editorRef
                }
                value={
                  code
                }
                onChangeText={
                  handleCodeChange
                }
                onSelectionChange={
                  handleSelectionChange
                }
                multiline
                autoCapitalize="none"
                autoCorrect={
                  false
                }
                spellCheck={
                  false
                }
                textAlignVertical="top"
                scrollEventThrottle={
                  16
                }
                onScroll={
                  (event) => {
                    const y =
                      event
                        ?.nativeEvent
                        ?.contentOffset
                        ?.y || 0;

                    lineScrollRef.current?.scrollTo(
                      {
                        y,
                        animated:
                          false,
                      }
                    );
                  }
                }
                style={
                  styles.codeInput
                }
              />
            </View>
          ) : (
            <View
              style={
                styles.emptyEditor
              }
            >
              <Text
                style={
                  styles.emptyEditorTitle
                }
              >
                Aucun fichier
              </Text>

              <Text
                style={
                  styles.emptyEditorText
                }
              >
                Crée un fichier pour
                commencer.
              </Text>
            </View>
          )}

          {showSearch && (
            <View
              style={
                styles.searchPanel
              }
            >
              <View
                style={
                  styles.searchRow
                }
              >
                <TextInput
                  value={
                    searchText
                  }
                  onChangeText={
                    (value) => {
                      setSearchText(
                        value
                      );
                      setSearchIndex(
                        -1
                      );
                    }
                  }
                  placeholder="Rechercher..."
                  placeholderTextColor={
                    colors.muted
                  }
                  style={
                    styles.searchInput
                  }
                />

                <Pressable
                  style={
                    styles.searchButton
                  }
                  onPress={
                    handleFindNext
                  }
                >
                  <Text
                    style={
                      styles.searchButtonText
                    }
                  >
                    Find
                  </Text>
                </Pressable>

                <Pressable
                  style={
                    styles.searchClose
                  }
                  onPress={() =>
                    setShowSearch(
                      false
                    )
                  }
                >
                  <Text
                    style={
                      styles.searchButtonText
                    }
                  >
                    ×
                  </Text>
                </Pressable>
              </View>

              <View
                style={
                  styles.searchRow
                }
              >
                <TextInput
                  value={
                    replaceText
                  }
                  onChangeText={
                    setReplaceText
                  }
                  placeholder="Remplacer par..."
                  placeholderTextColor={
                    colors.muted
                  }
                  style={
                    styles.searchInput
                  }
                />

                <Pressable
                  style={
                    styles.searchButton
                  }
                  onPress={
                    handleReplaceCurrent
                  }
                >
                  <Text
                    style={
                      styles.searchButtonText
                    }
                  >
                    One
                  </Text>
                </Pressable>

                <Pressable
                  style={
                    styles.searchButton
                  }
                  onPress={
                    handleReplaceAll
                  }
                >
                  <Text
                    style={
                      styles.searchButtonText
                    }
                  >
                    All
                  </Text>
                </Pressable>
              </View>

              <Text
                style={
                  styles.searchInfo
                }
              >
                {getMatches().length
                  ? `${getMatches().length} résultat(s)`
                  : 'Aucun résultat'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {showTerminal && (
        <View
          style={
            styles.terminal
          }
        >
          <View
            style={
              styles.terminalHeader
            }
          >
            <Text
              style={
                styles.terminalTitle
              }
            >
              TERMINAL
            </Text>

            <Pressable
              style={
                styles.terminalClose
              }
              onPress={() =>
                setShowTerminal(
                  false
                )
              }
            >
              <Text
                style={
                  styles.terminalCloseText
                }
              >
                ×
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={
              styles.terminalOutput
            }
            contentContainerStyle={{
              paddingBottom: 8,
            }}
          >
            {terminalLines.map(
              (line, index) => (
                <Text
                  key={
                    `${index}-${line.text}`
                  }
                  style={[
                    styles.terminalLine,
                    line.type ===
                      'system' &&
                      styles.terminalSystem,
                    line.type ===
                      'command' &&
                      styles.terminalCommand,
                    line.type ===
                      'error' &&
                      styles.terminalError,
                  ]}
                >
                  {
                    line.text
                  }
                </Text>
              )
            )}
          </ScrollView>

          <View
            style={
              styles.terminalInputRow
            }
          >
            <Text
              style={
                styles.terminalPrompt
              }
            >
              $
            </Text>

            <TextInput
              value={
                terminalInput
              }
              onChangeText={
                setTerminalInput
              }
              onSubmitEditing={
                executeTerminal
              }
              returnKeyType="send"
              autoCapitalize="none"
              autoCorrect={
                false
              }
              spellCheck={
                false
              }
              placeholder="help"
              placeholderTextColor={
                colors.muted
              }
              style={
                styles.terminalInput
              }
            />

            <Pressable
              style={
                styles.terminalSend
              }
              onPress={
                executeTerminal
              }
            >
              <Text
                style={
                  styles.terminalSendText
                }
              >
                ›
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      <Modal
        visible={
          showNewFileModal
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowNewFileModal(
            false
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              Nouveau fichier
            </Text>

            <Text
              style={
                styles.modalSubtitle
              }
            >
              Exemple : components/App.js
            </Text>

            <TextInput
              value={
                newFileName
              }
              onChangeText={
                setNewFileName
              }
              autoFocus
              autoCapitalize="none"
              placeholder="nom-du-fichier.js"
              placeholderTextColor={
                colors.muted
              }
              style={
                styles.input
              }
            />

            <View
              style={
                styles.modalActions
              }
            >
              <Pressable
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                ]}
                onPress={() => {
                  setShowNewFileModal(
                    false
                  );
                  setNewFileName(
                    ''
                  );
                }}
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Annuler
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                ]}
                onPress={
                  handleAddFile
                }
              >
                <Text
                  style={
                    styles.confirmButtonText
                  }
                >
                  Créer
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={
          showRenameModal
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowRenameModal(
            false
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              Renommer
            </Text>

            <Text
              style={
                styles.modalSubtitle
              }
            >
              Nouveau nom du fichier
            </Text>

            <TextInput
              value={
                renameFileName
              }
              onChangeText={
                setRenameFileName
              }
              autoFocus
              autoCapitalize="none"
              style={
                styles.input
              }
            />

            <View
              style={
                styles.modalActions
              }
            >
              <Pressable
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                ]}
                onPress={() =>
                  setShowRenameModal(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Annuler
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                ]}
                onPress={
                  handleRenameFile
                }
              >
                <Text
                  style={
                    styles.confirmButtonText
                  }
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
