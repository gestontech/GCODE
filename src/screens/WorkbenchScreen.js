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

export default function WorkbenchScreen({
  project,
  onBack,
  onPreview,
  onProjectUpdated,
  onOpenProjects,
  onOpenSettings,
  onOpenTerminal,
  onOpenCommands,
  onOpenAI,
}) {
  const { colors, spacing, radius } = useTheme();

  const editorRef = useRef(null);
  const lineScrollRef = useRef(null);

  const historyRef = useRef([]);
  const redoRef = useRef([]);
  const autoSaveTimerRef = useRef(null);

  const [files, setFiles] = useState({});
  const [activeFile, setActiveFile] = useState(null);
  const [code, setCode] = useState('');

  const [selection, setSelection] = useState({
    start: 0,
    end: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

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

  /*
   * Welcome est le premier onglet ouvert
   * par défaut dans le Workbench.
   */
  const [showWelcome, setShowWelcome] =
    useState(true);

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
          paddingTop:
            Platform.OS === 'ios' ? 8 : 4,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor:
            colors.backgroundElevated,
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
          width: showExplorer ? 190 : 0,
          overflow: 'hidden',
          backgroundColor: colors.panel,
          borderRightWidth:
            showExplorer ? 1 : 0,
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
          backgroundColor:
            colors.editorSelection,
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
          backgroundColor: colors.editor,
        },

        editorHeader: {
          minHeight: 36,
          paddingHorizontal: spacing.sm,
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
          backgroundColor: colors.editor,
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
          backgroundColor: colors.editor,
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
          backgroundColor: colors.panel,
          borderTopWidth: 1,
          borderTopColor: colors.border,
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
          borderRadius: radius.xs,
          backgroundColor: colors.editor,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          color: colors.text,
          fontSize: 13,
        },

        searchButton: {
          height: 40,
          minWidth: 42,
          marginLeft: 6,
          paddingHorizontal: 10,
          borderRadius: radius.xs,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.panel2,
          borderWidth: 1,
          borderColor: colors.border,
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
          borderRadius: radius.xs,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.panel2,
        },

        searchInfo: {
          color: colors.muted,
          fontSize: 11,
          marginTop: 2,
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

        /*
         * ==========================
         * WELCOME
         * ==========================
         */

        welcomeContainer: {
          flex: 1,
          backgroundColor: colors.editor,
        },

        welcomeScroll: {
          padding: spacing.lg,
          paddingBottom: 60,
        },

        welcomeHeader: {
          marginBottom: 24,
        },

        welcomeEyebrow: {
          color: colors.purpleLight,
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 8,
        },

        welcomeTitle: {
          color: colors.textStrong,
          fontSize: 30,
          fontWeight: '800',
          marginBottom: 8,
        },

        welcomeSubtitle: {
          color: colors.muted,
          fontSize: 14,
          lineHeight: 21,
          maxWidth: 650,
        },

        welcomeSection: {
          marginBottom: 24,
        },

        welcomeSectionTitle: {
          color: colors.textStrong,
          fontSize: 18,
          fontWeight: '750',
          marginBottom: 12,
        },

        welcomeCard: {
          backgroundColor: colors.panel,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          marginBottom: 8,
          overflow: 'hidden',
        },

        welcomeAction: {
          minHeight: 58,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
        },

        welcomeActionIcon: {
          width: 40,
          height: 40,
          borderRadius: radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.panel2,
          marginRight: 12,
        },

        welcomeActionIconText: {
          color: colors.purpleLight,
          fontSize: 18,
          fontWeight: '700',
        },

        welcomeActionBody: {
          flex: 1,
        },

        welcomeActionTitle: {
          color: colors.textStrong,
          fontSize: 14,
          fontWeight: '700',
          marginBottom: 2,
        },

        welcomeActionDescription: {
          color: colors.muted,
          fontSize: 11,
          lineHeight: 16,
        },

        welcomeArrow: {
          color: colors.muted,
          fontSize: 18,
          marginLeft: 8,
        },

        recentEmpty: {
          padding: 18,
          alignItems: 'center',
        },

        recentFile: {
          minHeight: 52,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },

        recentFileIcon: {
          width: 34,
          height: 34,
          borderRadius: radius.xs,
          backgroundColor: colors.panel2,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        },

        recentFileIconText: {
          color: colors.blue,
          fontSize: 12,
          fontWeight: '700',
        },

        recentFileBody: {
          flex: 1,
        },

        recentFileName: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '600',
        },

        recentFilePath: {
          color: colors.muted2,
          fontSize: 10,
          marginTop: 2,
        },

        tipCard: {
          backgroundColor: colors.panel,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: 16,
          marginBottom: 8,
        },

        tipNumber: {
          color: colors.purpleLight,
          fontSize: 11,
          fontWeight: '800',
          marginBottom: 5,
        },

        tipTitle: {
          color: colors.textStrong,
          fontSize: 14,
          fontWeight: '700',
          marginBottom: 4,
        },

        tipText: {
          color: colors.muted,
          fontSize: 12,
          lineHeight: 18,
        },

        welcomeFooter: {
          paddingTop: 8,
          alignItems: 'center',
        },

        welcomeFooterText: {
          color: colors.muted2,
          fontSize: 11,
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
          setEditorSettings(settings);
        }
      } catch (error) {
        console.error(
          'Erreur paramètres éditeur:',
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
        if (mounted) {
          setFiles({});
          setActiveFile(null);
          setCode('');
          setLoading(false);
        }

        return;
      }

      setLoading(true);

      try {
        const storedProject =
          await getProject(project.id);

        if (!mounted) {
          return;
        }

        const projectFiles =
          storedProject?.files ||
          project?.files ||
          {};

        const names =
          Object.keys(projectFiles);

        const initialFile =
          storedProject?.activeFile ||
          project?.activeFile ||
          names[0] ||
          null;

        const initialCode =
          initialFile
            ? projectFiles[initialFile] || ''
            : '';

        setFiles(projectFiles);
        setActiveFile(initialFile);
        setCode(initialCode);

        setSelection({
          start: initialCode.length,
          end: initialCode.length,
        });

        historyRef.current = [];
        redoRef.current = [];

        setDirty(false);
        setLoading(false);
      } catch (error) {
        console.error(
          'Erreur de chargement du projet:',
          error
        );

        if (mounted) {
          setFiles({});
          setActiveFile(null);
          setCode('');
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
      if (autoSaveTimerRef.current) {
        clearTimeout(
          autoSaveTimerRef.current
        );

        autoSaveTimerRef.current = null;
      }
    };
  }, []);

  const notifyProjectUpdated = (
    updatedProject
  ) => {
    if (
      typeof onProjectUpdated ===
      'function'
    ) {
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

    try {
      const updatedProject =
        await saveProjectFile(
          project.id,
          fileName,
          content
        );

      if (updatedProject) {
        setFiles(
          updatedProject.files || {}
        );

        setDirty(false);

        notifyProjectUpdated(
          updatedProject
        );
      }

      return updatedProject;
    } catch (error) {
      console.error(
        'Erreur de sauvegarde:',
        error
      );

      return null;
    } finally {
      setSaving(false);
    }
  };

  const scheduleAutoSave = (
    fileName,
    content
  ) => {
    if (
      !editorSettings.autoSave ||
      !project?.id ||
      !fileName
    ) {
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(
        autoSaveTimerRef.current
      );
    }

    autoSaveTimerRef.current =
      setTimeout(async () => {
        await performSave(
          fileName,
          content
        );

        autoSaveTimerRef.current =
          null;
      }, 800);
  };

  const pushHistory = (
    previousCode
  ) => {
    if (
      previousCode === code
    ) {
      return;
    }

    historyRef.current.push(
      previousCode
    );

    if (
      historyRef.current.length >
      100
    ) {
      historyRef.current.shift();
    }

    redoRef.current = [];
  };

  const handleCodeChange = (
    value
  ) => {
    pushHistory(code);

    setCode(value);

    setFiles((previous) => ({
      ...previous,
      [activeFile]: value,
    }));

    setDirty(true);

    scheduleAutoSave(
      activeFile,
      value
    );
  };

  const handleSelectionChange = (
    event
  ) => {
    const nextSelection =
      event?.nativeEvent?.selection;

    if (!nextSelection) {
      return;
    }

    setSelection({
      start: nextSelection.start,
      end: nextSelection.end,
    });
  };

  const insertTextAtCursor = (
    text
  ) => {
    if (!activeFile) {
      return;
    }

    const start = Math.min(
      selection.start,
      selection.end
    );

    const end = Math.max(
      selection.start,
      selection.end
    );

    const nextCode =
      code.slice(0, start) +
      text +
      code.slice(end);

    pushHistory(code);

    setCode(nextCode);

    setFiles((previous) => ({
      ...previous,
      [activeFile]: nextCode,
    }));

    const nextCursor =
      start + text.length;

    setSelection({
      start: nextCursor,
      end: nextCursor,
    });

    setDirty(true);

    scheduleAutoSave(
      activeFile,
      nextCode
    );

    requestAnimationFrame(() => {
      editorRef.current?.focus();
    });
  };

  const handleUndo = () => {
    if (!historyRef.current.length) {
      return;
    }

    const previousCode =
      historyRef.current.pop();

    redoRef.current.push(code);

    setCode(previousCode);

    setFiles((previous) => ({
      ...previous,
      [activeFile]: previousCode,
    }));

    setSelection({
      start: previousCode.length,
      end: previousCode.length,
    });

    setDirty(true);

    scheduleAutoSave(
      activeFile,
      previousCode
    );
  };

  const handleRedo = () => {
    if (!redoRef.current.length) {
      return;
    }

    const nextCode =
      redoRef.current.pop();

    historyRef.current.push(code);

    setCode(nextCode);

    setFiles((previous) => ({
      ...previous,
      [activeFile]: nextCode,
    }));

    setSelection({
      start: nextCode.length,
      end: nextCode.length,
    });

    setDirty(true);

    scheduleAutoSave(
      activeFile,
      nextCode
    );
  };

  const handleEditorScroll = (
    event
  ) => {
    const offsetY =
      event?.nativeEvent?.contentOffset
        ?.y || 0;

    lineScrollRef.current?.scrollTo({
      y: offsetY,
      animated: false,
    });
  };

  const handleSelectFile = async (
    fileName
  ) => {
    if (
      !fileName ||
      fileName === activeFile
    ) {
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(
        autoSaveTimerRef.current
      );

      autoSaveTimerRef.current = null;
    }

    if (dirty) {
      await performSave(
        activeFile,
        code
      );
    }

    const nextCode =
      files[fileName] || '';

    setActiveFile(fileName);
    setCode(nextCode);

    setSelection({
      start: 0,
      end: 0,
    });

    historyRef.current = [];
    redoRef.current = [];

    setDirty(false);

    setShowWelcome(false);

    requestAnimationFrame(() => {
      editorRef.current?.focus();
    });
  };

  const handleAddFile = async () => {
    const name =
      newFileName.trim();

    if (!name) {
      Alert.alert(
        'Nom requis',
        'Entre un nom de fichier.'
      );
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
        'Un fichier avec ce nom existe déjà.'
      );
      return;
    }

    const updatedProject =
      await addProjectFile(
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

    setFiles(
      updatedProject.files || {}
    );

    setActiveFile(name);
    setCode('');

    setSelection({
      start: 0,
      end: 0,
    });

    historyRef.current = [];
    redoRef.current = [];

    setDirty(false);
    setNewFileName('');
    setShowNewFileModal(false);
    setShowWelcome(false);

    notifyProjectUpdated(
      updatedProject
    );
  };

  const handleDeleteFile = (
    fileName
  ) => {
    if (!fileName) {
      return;
    }

    const fileNames =
      Object.keys(files);

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
              Object.keys(
                updatedFiles
              )[0] ||
              null;

            const nextCode =
              nextFile
                ? updatedFiles[nextFile] || ''
                : '';

            setFiles(updatedFiles);
            setActiveFile(nextFile);
            setCode(nextCode);

            setSelection({
              start: 0,
              end: 0,
            });

            historyRef.current = [];
            redoRef.current = [];

            setDirty(false);

            notifyProjectUpdated(
              updatedProject
            );
          },
        },
      ]
    );
  };

  const openRenameModal = (
    fileName
  ) => {
    setRenameTarget(fileName);
    setRenameFileName(fileName);
    setShowRenameModal(true);
  };

  const handleRenameFile = async () => {
    const oldName =
      renameTarget;

    const newName =
      renameFileName.trim();

    if (!oldName || !newName) {
      Alert.alert(
        'Nom requis',
        'Entre un nouveau nom de fichier.'
      );
      return;
    }

    if (
      newName !== oldName &&
      Object.prototype.hasOwnProperty.call(
        files,
        newName
      )
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

    setFiles(updatedFiles);

    if (activeFile === oldName) {
      setActiveFile(newName);
      setCode(
        updatedFiles[newName] || ''
      );
    }

    setRenameTarget(null);
    setRenameFileName('');
    setShowRenameModal(false);
    setDirty(false);

    notifyProjectUpdated(
      updatedProject
    );
  };

  const findNext = () => {
    if (!searchText) {
      return;
    }

    const startFrom =
      searchIndex >= 0
        ? searchIndex +
          searchText.length
        : selection.end;

    let index =
      code.indexOf(
        searchText,
        startFrom
      );

    if (index === -1) {
      index =
        code.indexOf(
          searchText,
          0
        );
    }

    if (index === -1) {
      Alert.alert(
        'Recherche',
        'Aucune occurrence trouvée.'
      );
      return;
    }

    const nextEnd =
      index + searchText.length;

    setSearchIndex(index);

    setSelection({
      start: index,
      end: nextEnd,
    });

    requestAnimationFrame(() => {
      editorRef.current?.focus();
    });
  };

  const replaceCurrent = () => {
    if (!searchText) {
      return;
    }

    const start =
      selection.start;

    const end =
      selection.end;

    const selectedText =
      code.slice(start, end);

    if (
      selectedText !== searchText
    ) {
      findNext();
      return;
    }

    const nextCode =
      code.slice(0, start) +
      replaceText +
      code.slice(end);

    pushHistory(code);

    setCode(nextCode);

    setFiles((previous) => ({
      ...previous,
      [activeFile]: nextCode,
    }));

    const nextCursor =
      start + replaceText.length;

    setSelection({
      start: nextCursor,
      end: nextCursor,
    });

    setDirty(true);

    scheduleAutoSave(
      activeFile,
      nextCode
    );
  };

  const replaceAll = () => {
    if (!searchText) {
      return;
    }

    if (!code.includes(searchText)) {
      Alert.alert(
        'Remplacement',
        'Aucune occurrence trouvée.'
      );
      return;
    }

    const nextCode =
      code
        .split(searchText)
        .join(replaceText);

    pushHistory(code);

    setCode(nextCode);

    setFiles((previous) => ({
      ...previous,
      [activeFile]: nextCode,
    }));

    setSelection({
      start: 0,
      end: 0,
    });

    setDirty(true);

    scheduleAutoSave(
      activeFile,
      nextCode
    );
  };

  const handleSave = async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(
        autoSaveTimerRef.current
      );

      autoSaveTimerRef.current = null;
    }

    await performSave(
      activeFile,
      code
    );
  };

  const handlePreview = async () => {
    if (!project?.id) {
      return;
    }

    await performSave(
      activeFile,
      code
    );

    if (
      typeof onPreview ===
      'function'
    ) {
      onPreview({
        ...project,
        files,
        activeFile,
      });
    }
  };

  const handleBack = () => {
    if (!dirty) {
      onBack?.();
      return;
    }

    Alert.alert(
      'Modifications non enregistrées',
      'Voulez-vous enregistrer avant de quitter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: () => onBack?.(),
        },
        {
          text: 'Enregistrer',
          onPress: async () => {
            await performSave(
              activeFile,
              code
            );
            onBack?.();
          },
        },
      ]
    );
  };

  /*
   * ==========================
   * ACTIONS WELCOME
   * ==========================
   */

  const openWelcome = () => {
    setShowWelcome(true);
  };

  const openNewFileFromWelcome = () => {
    setShowWelcome(false);
    setNewFileName('');
    setShowNewFileModal(true);
  };

  const openRecentFile = (
    fileName
  ) => {
    if (!fileName) {
      return;
    }

    handleSelectFile(fileName);
  };

  const openProjectsFromWelcome = () => {
    if (
      typeof onOpenProjects ===
      'function'
    ) {
      onOpenProjects();
    } else {
      Alert.alert(
        'Projets',
        'La liste des projets est accessible depuis la navigation principale.'
      );
    }
  };

  const openSettingsFromWelcome = () => {
    if (
      typeof onOpenSettings ===
      'function'
    ) {
      onOpenSettings();
    } else {
      Alert.alert(
        'Personnaliser',
        'Ouvre Paramètres depuis la navigation principale.'
      );
    }
  };

  const openTerminalFromWelcome = () => {
    if (
      typeof onOpenTerminal ===
      'function'
    ) {
      onOpenTerminal();
    } else {
      Alert.alert(
        'Terminal',
        'Le terminal est accessible depuis la navigation principale.'
      );
    }
  };

  const openCommandsFromWelcome = () => {
    if (
      typeof onOpenCommands ===
      'function'
    ) {
      onOpenCommands();
    } else {
      Alert.alert(
        'Palette de commandes',
        'Ouvre Commandes depuis la navigation principale.'
      );
    }
  };

  const openAIFromWelcome = () => {
    if (
      typeof onOpenAI ===
      'function'
    ) {
      onOpenAI();
    }
  };

  const getFileIcon = (
    fileName
  ) => {
    const extension =
      fileName
        .split('.')
        .pop()
        ?.toLowerCase();

    if (extension === 'html') {
      return '◇';
    }

    if (extension === 'css') {
      return '#';
    }

    if (
      extension === 'js' ||
      extension === 'jsx' ||
      extension === 'ts' ||
      extension === 'tsx'
    ) {
      return 'JS';
    }

    if (extension === 'json') {
      return '{}';
    }

    if (extension === 'md') {
      return 'M';
    }

    return '•';
  };

  const lineCount = Math.max(
    code.split('\n').length,
    1
  );

  const lineNumbers = Array.from(
    { length: lineCount },
    (_, index) => index + 1
  );

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
          Chargement du projet…
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
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={handleBack}
          style={({ pressed }) => [
            styles.headerButton,
            {
              opacity: pressed
                ? 0.65
                : 1,
            },
          ]}
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
          style={styles.headerCenter}
        >
          <Text
            numberOfLines={1}
            style={styles.projectTitle}
          >
            {project?.name ||
              'Projet GCODE'}
          </Text>

          <Text
            numberOfLines={1}
            style={styles.fileTitle}
          >
            {showWelcome
              ? 'Welcome'
              : activeFile ||
                'Aucun fichier'}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Preview"
          onPress={handlePreview}
          style={({ pressed }) => [
            styles.previewButton,
            {
              opacity: pressed
                ? 0.75
                : 1,
            },
          ]}
        >
          <Text
            style={
              styles.previewButtonText
            }
          >
            ▶ Preview
          </Text>
        </Pressable>
      </View>

      {showWelcome ? (
        /*
         * =====================================================
         * WELCOME
         * =====================================================
         */
        <View
          style={styles.welcomeContainer}
        >
          <ScrollView
            showsVerticalScrollIndicator
            contentContainerStyle={
              styles.welcomeScroll
            }
          >
            <View
              style={styles.welcomeHeader}
            >
              <Text
                style={
                  styles.welcomeEyebrow
                }
              >
                GCODE
              </Text>

              <Text
                style={styles.welcomeTitle}
              >
                Bienvenue
              </Text>

              <Text
                style={
                  styles.welcomeSubtitle
                }
              >
                Commence rapidement un projet,
                ouvre tes fichiers récents,
                personnalise GCODE et découvre
                les outils de développement.
              </Text>
            </View>

            <View
              style={styles.welcomeSection}
            >
              <Text
                style={
                  styles.welcomeSectionTitle
                }
              >
                Start
              </Text>

              <View
                style={styles.welcomeCard}
              >
                <Pressable
                  onPress={
                    openNewFileFromWelcome
                  }
                  style={({ pressed }) => [
                    styles.welcomeAction,
                    {
                      opacity: pressed
                        ? 0.65
                        : 1,
                    },
                  ]}
                >
                  <View
                    style={
                      styles.welcomeActionIcon
                    }
                  >
                    <Text
                      style={
                        styles.welcomeActionIconText
                      }
                    >
                      +
                    </Text>
                  </View>

                  <View
                    style={
                      styles.welcomeActionBody
                    }
                  >
                    <Text
                      style={
                        styles.welcomeActionTitle
                      }
                    >
                      New File…
                    </Text>

                    <Text
                      style={
                        styles.welcomeActionDescription
                      }
                    >
                      Créer réellement un nouveau
                      fichier dans ce projet.
                    </Text>
                  </View>

                  <Text
                    style={styles.welcomeArrow}
                  >
                    ›
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    activeFile
                      ? openRecentFile(
                          activeFile
                        )
                      : openNewFileFromWelcome()
                  }
                  style={({ pressed }) => [
                    styles.welcomeAction,
                    {
                      opacity: pressed
                        ? 0.65
                        : 1,
                    },
                  ]}
                >
                  <View
                    style={
                      styles.welcomeActionIcon
                    }
                  >
                    <Text
                      style={
                        styles.welcomeActionIconText
                      }
                    >
                      ◇
                    </Text>
                  </View>

                  <View
                    style={
                      styles.welcomeActionBody
                    }
                  >
                    <Text
                      style={
                        styles.welcomeActionTitle
                      }
                    >
                      Open File…
                    </Text>

                    <Text
                      style={
                        styles.welcomeActionDescription
                      }
                    >
                      Ouvrir un fichier présent
                      dans le projet GCODE.
                    </Text>
                  </View>

                  <Text
                    style={styles.welcomeArrow}
                  >
                    ›
                  </Text>
                </Pressable>

                <Pressable
                  onPress={
                    openProjectsFromWelcome
                  }
                  style={({ pressed }) => [
                    styles.welcomeAction,
                    {
                      opacity: pressed
                        ? 0.65
                        : 1,
                    },
                  ]}
                >
                  <View
                    style={
                      styles.welcomeActionIcon
                    }
                  >
                    <Text
                      style={
                        styles.welcomeActionIconText
                      }
                    >
                      □
                    </Text>
                  </View>

                  <View
                    style={
                      styles.welcomeActionBody
                    }
                  >
                    <Text
                      style={
                        styles.welcomeActionTitle
                      }
                    >
                      Open Folder…
                    </Text>

                    <Text
                      style={
                        styles.welcomeActionDescription
                      }
                    >
                      Accéder aux vrais projets
                      et dossiers de travail.
                    </Text>
                  </View>

                  <Text
                    style={styles.welcomeArrow}
                  >
                    ›
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    Alert.alert(
                      'Clone Git Repository…',
                      'Le clonage Git nécessite encore le moteur Git natif de GCODE. Cette fonction ne sera pas simulée.'
                    )
                  }
                  style={({ pressed }) => [
                    styles.welcomeAction,
                    {
                      opacity: pressed
                        ? 0.65
                        : 1,
                    },
                  ]}
                >
                  <View
                    style={
                      styles.welcomeActionIcon
                    }
                  >
                    <Text
                      style={
                        styles.welcomeActionIconText
                      }
                    >
                      ↙
                    </Text>
                  </View>

                  <View
                    style={
                      styles.welcomeActionBody
                    }
                  >
                    <Text
                      style={
                        styles.welcomeActionTitle
                      }
                    >
                      Clone Git Repository…
                    </Text>

                    <Text
                      style={
                        styles.welcomeActionDescription
                      }
                    >
                      Préparé pour le futur moteur
                      Git natif de GCODE.
                    </Text>
                  </View>

                  <Text
                    style={styles.welcomeArrow}
                  >
                    ›
                  </Text>
                </Pressable>
              </View>
            </View>

            <View
              style={styles.welcomeSection}
            >
              <Text
                style={
                  styles.welcomeSectionTitle
                }
              >
                Recent
              </Text>

              <View
                style={styles.welcomeCard}
              >
                {Object.keys(files).length ===
                0 ? (
                  <View
                    style={styles.recentEmpty}
                  >
                    <Text
                      style={{
                        color: colors.muted,
                        fontSize: 12,
                      }}
                    >
                      Aucun fichier récent.
                    </Text>
                  </View>
                ) : (
                  Object.keys(files).map(
                    (fileName) => (
                      <Pressable
                        key={fileName}
                        onPress={() =>
                          openRecentFile(
                            fileName
                          )
                        }
                        style={({ pressed }) => [
                          styles.recentFile,
                          {
                            opacity: pressed
                              ? 0.65
                              : 1,
                          },
                        ]}
                      >
                        <View
                          style={
                            styles.recentFileIcon
                          }
                        >
                          <Text
                            style={
                              styles.recentFileIconText
                            }
                          >
                            {getFileIcon(
                              fileName
                            )}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.recentFileBody
                          }
                        >
                          <Text
                            numberOfLines={1}
                            style={
                              styles.recentFileName
                            }
                          >
                            {fileName}
                          </Text>

                          <Text
                            numberOfLines={1}
                            style={
                              styles.recentFilePath
                            }
                          >
                            {fileName ===
                            activeFile
                              ? 'Fichier actif'
                              : 'Projet courant'}
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.welcomeArrow
                          }
                        >
                          ›
                        </Text>
                      </Pressable>
                    )
                  )
                )}
              </View>
            </View>

            <View
              style={styles.welcomeSection}
            >
              <Text
                style={
                  styles.welcomeSectionTitle
                }
              >
                Walkthroughs & Tips
              </Text>

              <View
                style={styles.tipCard}
              >
                <Text
                  style={styles.tipNumber}
                >
                  01 · PREMIERS PAS
                </Text>

                <Text
                  style={styles.tipTitle}
                >
                  Créer ton premier fichier
                </Text>

                <Text
                  style={styles.tipText}
                >
                  Utilise New File… pour créer
                  index.html, app.js, style.css
                  ou n'importe quel fichier dont
                  ton projet a besoin.
                </Text>
              </View>

              <View
                style={styles.tipCard}
              >
                <Text
                  style={styles.tipNumber}
                >
                  02 · ÉDITION
                </Text>

                <Text
                  style={styles.tipTitle}
                >
                  Éditer et sauvegarder
                </Text>

                <Text
                  style={styles.tipText}
                >
                  GCODE conserve les modifications
                  localement et prend en charge
                  l'auto-sauvegarde lorsque celle-ci
                  est activée.
                </Text>
              </View>

              <View
                style={styles.tipCard}
              >
                <Text
                  style={styles.tipNumber}
                >
                  03 · TERMINAL
                </Text>

                <Text
                  style={styles.tipTitle}
                >
                  Utiliser le terminal réel
                </Text>

                <Text
                  style={styles.tipText}
                >
                  Le terminal natif exécute réellement
                  les commandes disponibles dans
                  l'environnement Android de GCODE.
                </Text>

                <Pressable
                  onPress={
                    openTerminalFromWelcome
                  }
                  style={[
                    styles.toolbarButton,
                    {
                      marginTop: 12,
                      alignSelf: 'flex-start',
                    },
                  ]}
                >
                  <Text
                    style={
                      styles.toolbarButtonText
                    }
                  >
                    Ouvrir Terminal
                  </Text>
                </Pressable>
              </View>
            </View>

            <View
              style={styles.welcomeSection}
            >
              <Text
                style={
                  styles.welcomeSectionTitle
                }
              >
                Customize
              </Text>

              <View
                style={styles.welcomeCard}
              >
                <Pressable
                  onPress={
                    openSettingsFromWelcome
                  }
                  style={({ pressed }) => [
                    styles.welcomeAction,
                    {
                      opacity: pressed
                        ? 0.65
                        : 1,
                    },
                  ]}
                >
                  <View
                    style={
                      styles.welcomeActionIcon
                    }
                  >
                    <Text
                      style={
                        styles.welcomeActionIconText
                      }
                    >
                      ◐
                    </Text>
                  </View>

                  <View
                    style={
                      styles.welcomeActionBody
                    }
                  >
                    <Text
                      style={
                        styles.welcomeActionTitle
                      }
                    >
                      Themes
                    </Text>

                    <Text
                      style={
                        styles.welcomeActionDescription
                      }
                    >
                      Changer les paramètres visuels
                      et le thème de l'éditeur.
                    </Text>
                  </View>

                  <Text
                    style={styles.welcomeArrow}
                  >
                    ›
                  </Text>
                </Pressable>

                <Pressable
                  onPress={
                    openSettingsFromWelcome
                  }
                  style={({ pressed }) => [
                    styles.welcomeAction,
                    {
                      opacity: pressed
                        ? 0.65
                        : 1,
                    },
                  ]}
                >
                  <View
                    style={
                      styles.welcomeActionIcon
                    }
                  >
                    <Text
                      style={
                        styles.welcomeActionIconText
                      }
                    >
                      A
                    </Text>
                  </View>

                  <View
                    style={
                      styles.welcomeActionBody
                    }
                  >
                    <Text
                      style={
                        styles.welcomeActionTitle
                      }
                    >
                      Tools and languages
                    </Text>

                    <Text
                      style={
                        styles.welcomeActionDescription
                      }
                    >
                      Accéder aux réglages des outils
                      et du développement.
                    </Text>
                  </View>

                  <Text
                    style={styles.welcomeArrow}
                  >
                    ›
                  </Text>
                </Pressable>

                <Pressable
                  onPress={
                    openCommandsFromWelcome
                  }
                  style={({ pressed }) => [
                    styles.welcomeAction,
                    {
                      opacity: pressed
                        ? 0.65
                        : 1,
                    },
                  ]}
                >
                  <View
                    style={
                      styles.welcomeActionIcon
                    }
                  >
                    <Text
                      style={
                        styles.welcomeActionIconText
                      }
                    >
                      ⌘
                    </Text>
                  </View>

                  <View
                    style={
                      styles.welcomeActionBody
                    }
                  >
                    <Text
                      style={
                        styles.welcomeActionTitle
                      }
                    >
                      Keyboard Shortcuts
                    </Text>

                    <Text
                      style={
                        styles.welcomeActionDescription
                      }
                    >
                      Accéder à la palette de commandes
                      et aux actions disponibles.
                    </Text>
                  </View>

                  <Text
                    style={styles.welcomeArrow}
                  >
                    ›
                  </Text>
                </Pressable>
              </View>
            </View>

            <View
              style={styles.welcomeSection}
            >
              <Text
                style={
                  styles.welcomeSectionTitle
                }
              >
                GCODE
              </Text>

              <View
                style={styles.welcomeCard}
              >
                <Pressable
                  onPress={
                    openAIFromWelcome
                  }
                  style={({ pressed }) => [
                    styles.welcomeAction,
                    {
                      opacity: pressed
                        ? 0.65
                        : 1,
                    },
                  ]}
                >
                  <View
                    style={
                      styles.welcomeActionIcon
                    }
                  >
                    <Text
                      style={
                        styles.welcomeActionIconText
                      }
                    >
                      ✦
                    </Text>
                  </View>

                  <View
                    style={
                      styles.welcomeActionBody
                    }
                  >
                    <Text
                      style={
                        styles.welcomeActionTitle
                      }
                    >
                      GCODE AI
                    </Text>

                    <Text
                      style={
                        styles.welcomeActionDescription
                      }
                    >
                      Module préparé pour une future
                      intégration IA optionnelle.
                    </Text>
                  </View>

                  <Text
                    style={styles.welcomeArrow}
                  >
                    ›
                  </Text>
                </Pressable>
              </View>
            </View>

            <View
              style={styles.welcomeFooter}
            >
              <Text
                style={styles.welcomeFooterText}
              >
                Bienvenue peut être réouvert à tout
                moment depuis l'interface GCODE.
              </Text>
            </View>
          </ScrollView>
        </View>
      ) : (
        <>
          <View style={styles.toolbar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              style={styles.toolbarScroll}
              contentContainerStyle={{
                alignItems: 'center',
              }}
            >
              <Pressable
                onPress={() =>
                  setShowExplorer(
                    (value) => !value
                  )
                }
                style={styles.toolbarButton}
              >
                <Text
                  style={
                    styles.toolbarButtonText
                  }
                >
                  ☰
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  setShowSearch(true)
                }
                style={styles.toolbarButton}
              >
                <Text
                  style={
                    styles.toolbarButtonText
                  }
                >
                  🔍
                </Text>
              </Pressable>

              <Pressable
                onPress={handleUndo}
                style={styles.toolbarButton}
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
                onPress={handleRedo}
                style={styles.toolbarButton}
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
                onPress={() =>
                  insertTextAtCursor('  ')
                }
                style={styles.toolbarButton}
              >
                <Text
                  style={
                    styles.toolbarButtonText
                  }
                >
                  Tab
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  insertTextAtCursor('// ')
                }
                style={styles.toolbarButton}
              >
                <Text
                  style={
                    styles.toolbarButtonText
                  }
                >
                  //
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  insertTextAtCursor(
                    'console.log();'
                  )
                }
                style={styles.toolbarButton}
              >
                <Text
                  style={
                    styles.toolbarButtonText
                  }
                >
                  log
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  insertTextAtCursor(
                    'function name() {\n  \n}'
                  )
                }
                style={styles.toolbarButton}
              >
                <Text
                  style={
                    styles.toolbarButtonText
                  }
                >
                  fn
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                style={styles.toolbarButton}
              >
                <Text
                  style={
                    styles.toolbarButtonText
                  }
                >
                  💾
                </Text>
              </Pressable>

              <Pressable
                onPress={openWelcome}
                style={styles.toolbarButton}
              >
                <Text
                  style={
                    styles.toolbarButtonText
                  }
                >
                  Welcome
                </Text>
              </Pressable>

              <Text
                style={styles.statusText}
              >
                {saving
                  ? 'Sauvegarde…'
                  : dirty
                    ? 'Modifié'
                    : 'Enregistré'}
              </Text>
            </ScrollView>
          </View>

          <View style={styles.workspace}>
            <View style={styles.explorer}>
              <View
                style={styles.explorerHeader}
              >
                <Text
                  style={styles.explorerTitle}
                >
                  Explorateur
                </Text>

                <Pressable
                  onPress={() =>
                    setShowNewFileModal(
                      true
                    )
                  }
                  style={styles.addButton}
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
                {Object.keys(files).map(
                  (fileName) => {
                    const selected =
                      fileName ===
                      activeFile;

                    return (
                      <Pressable
                        key={fileName}
                        onPress={() =>
                          handleSelectFile(
                            fileName
                          )
                        }
                        onLongPress={() =>
                          openRenameModal(
                            fileName
                          )
                        }
                        style={[
                          styles.fileItem,
                          selected &&
                            styles.activeFileItem,
                        ]}
                      >
                        <Text
                          style={
                            styles.fileIcon
                          }
                        >
                          {getFileIcon(
                            fileName
                          )}
                        </Text>

                        <Text
                          numberOfLines={1}
                          style={[
                            styles.fileName,
                            selected &&
                              styles.activeFileName,
                          ]}
                        >
                          {fileName}
                        </Text>

                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Options ${fileName}`}
                          onPress={() =>
                            Alert.alert(
                              fileName,
                              'Choisis une action.',
                              [
                                {
                                  text: 'Annuler',
                                  style: 'cancel',
                                },
                                {
                                  text: 'Renommer',
                                  onPress: () =>
                                    openRenameModal(
                                      fileName
                                    ),
                                },
                                {
                                  text: 'Supprimer',
                                  style: 'destructive',
                                  onPress: () =>
                                    handleDeleteFile(
                                      fileName
                                    ),
                                },
                              ]
                            )
                          }
                          style={
                            styles.fileMenuButton
                          }
                        >
                          <Text
                            style={
                              styles.fileMenuText
                            }
                          >
                            ⋯
                          </Text>
                        </Pressable>
                      </Pressable>
                    );
                  }
                )}
              </ScrollView>
            </View>

            <View
              style={styles.editorArea}
            >
              <View
                style={styles.editorHeader}
              >
                <Text
                  style={
                    styles.editorHeaderText
                  }
                >
                  {activeFile ||
                    'Aucun fichier ouvert'}
                </Text>
              </View>

              {activeFile ? (
                <View style={styles.editor}>
                  {editorSettings.lineNumbers && (
                    <ScrollView
                      ref={lineScrollRef}
                      style={
                        styles.lineScroll
                      }
                      scrollEnabled={false}
                      showsVerticalScrollIndicator={
                        false
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
                              key={number}
                              style={
                                styles.lineNumber
                              }
                            >
                              {number}
                            </Text>
                          )
                        )}
                      </View>
                    </ScrollView>
                  )}

                  <TextInput
                    ref={editorRef}
                    value={code}
                    onChangeText={
                      handleCodeChange
                    }
                    onSelectionChange={
                      handleSelectionChange
                    }
                    onScroll={
                      handleEditorScroll
                    }
                    selection={selection}
                    multiline
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    textAlignVertical="top"
                    scrollEnabled
                    style={
                      styles.codeInput
                    }
                    placeholder="Commence à écrire ton code…"
                    placeholderTextColor={
                      colors.muted2
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
                    commencer à coder.
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
                      value={searchText}
                      onChangeText={(value) => {
                        setSearchText(value);
                        setSearchIndex(-1);
                      }}
                      placeholder="Rechercher…"
                      placeholderTextColor={
                        colors.muted2
                      }
                      style={
                        styles.searchInput
                      }
                      autoCapitalize="none"
                      autoCorrect={false}
                    />

                    <Pressable
                      onPress={findNext}
                      style={
                        styles.searchButton
                      }
                    >
                      <Text
                        style={
                          styles.searchButtonText
                        }
                      >
                        Suivant
                      </Text>
                    </Pressable>
                  </View>

                  <View
                    style={
                      styles.searchRow
                    }
                  >
                    <TextInput
                      value={replaceText}
                      onChangeText={
                        setReplaceText
                      }
                      placeholder="Remplacer par…"
                      placeholderTextColor={
                        colors.muted2
                      }
                      style={
                        styles.searchInput
                      }
                      autoCapitalize="none"
                      autoCorrect={false}
                    />

                    <Pressable
                      onPress={
                        replaceCurrent
                      }
                      style={
                        styles.searchButton
                      }
                    >
                      <Text
                        style={
                          styles.searchButtonText
                        }
                      >
                        Remplacer
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={replaceAll}
                      style={
                        styles.searchButton
                      }
                    >
                      <Text
                        style={
                          styles.searchButtonText
                        }
                      >
                        Tout
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setShowSearch(false);
                        setSearchIndex(-1);
                      }}
                      style={
                        styles.searchClose
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

                  <Text
                    style={styles.searchInfo}
                  >
                    Recherche et remplacement
                    directement dans le fichier
                    actuellement ouvert.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </>
      )}

      <Modal
        visible={showNewFileModal}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowNewFileModal(false)
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text
              style={styles.modalTitle}
            >
              Nouveau fichier
            </Text>

            <Text
              style={styles.modalSubtitle}
            >
              Exemple : index.html,
              styles.css ou app.js
            </Text>

            <TextInput
              value={newFileName}
              onChangeText={
                setNewFileName
              }
              placeholder="nom-du-fichier.ext"
              placeholderTextColor={
                colors.muted2
              }
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              autoFocus
            />

            <View
              style={styles.modalActions}
            >
              <Pressable
                onPress={() => {
                  setNewFileName('');
                  setShowNewFileModal(
                    false
                  );
                }}
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                ]}
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
                onPress={handleAddFile}
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                ]}
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
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowRenameModal(false)
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text
              style={styles.modalTitle}
            >
              Renommer le fichier
            </Text>

            <Text
              style={styles.modalSubtitle}
            >
              Le contenu du fichier sera
              conservé.
            </Text>

            <TextInput
              value={renameFileName}
              onChangeText={
                setRenameFileName
              }
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              autoFocus
              selectTextOnFocus
            />

            <View
              style={styles.modalActions}
            >
              <Pressable
                onPress={() => {
                  setRenameTarget(null);
                  setRenameFileName('');
                  setShowRenameModal(
                    false
                  );
                }}
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                ]}
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
                onPress={
                  handleRenameFile
                }
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                ]}
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
