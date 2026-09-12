import React, {
  useCallback,
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
  pickFile,
  sanitizeFileName,
} from '../storage/filePicker';

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
  const autoSaveTimerRef = useRef(null);

  const historyRef = useRef([]);
  const redoRef = useRef([]);

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

  const [editorSettings, setEditorSettings] = useState({
    autoSave: true,
    lineNumbers: true,
  });

  const [showExplorer, setShowExplorer] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchIndex, setSearchIndex] = useState(-1);

  const [showNewFileModal, setShowNewFileModal] =
    useState(false);

  const [newFileName, setNewFileName] = useState('');

  const [showRenameModal, setShowRenameModal] =
    useState(false);

  const [renameTarget, setRenameTarget] =
    useState(null);

  const [renameFileName, setRenameFileName] =
    useState('');

  const [showWelcome, setShowWelcome] = useState(true);

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

        lineScroll: {
          width: 48,
          backgroundColor: colors.editor,
          borderRightWidth: 1,
          borderRightColor: colors.editorLine,
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
        },

        welcomeSection: {
          marginBottom: 24,
        },

        welcomeSectionTitle: {
          color: colors.textStrong,
          fontSize: 18,
          fontWeight: '700',
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
          backgroundColor: 'rgba(0,0,0,0.65)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        },

        modalCard: {
          width: '100%',
          maxWidth: 430,
          padding: 20,
          borderRadius: radius.lg,
          backgroundColor: colors.panel,
          borderWidth: 1,
          borderColor: colors.border,
        },

        modalTitle: {
          color: colors.textStrong,
          fontSize: 18,
          fontWeight: '700',
          marginBottom: 14,
        },

        modalInput: {
          height: 46,
          paddingHorizontal: 12,
          borderRadius: radius.sm,
          backgroundColor: colors.editor,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          color: colors.text,
          fontSize: 14,
        },

        modalActions: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: 16,
        },

        modalButton: {
          minWidth: 90,
          height: 42,
          paddingHorizontal: 14,
          borderRadius: radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 8,
          backgroundColor: colors.panel2,
          borderWidth: 1,
          borderColor: colors.border,
        },

        modalPrimary: {
          backgroundColor: colors.purple,
          borderColor: colors.purple,
        },

        modalButtonText: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '700',
        },

        modalPrimaryText: {
          color: '#FFFFFF',
        },
      }),
    [colors, spacing, radius, dirty, showExplorer]
  );

  const projectId = project?.id;

  const lineCount = Math.max(
    1,
    String(code || '').split('\n').length
  );

  const lineNumbers = useMemo(
    () =>
      Array.from(
        { length: lineCount },
        (_, index) => index + 1
      ),
    [lineCount]
  );

  const fileNames = useMemo(
    () => Object.keys(files || {}),
    [files]
  );

  const currentProjectName =
    project?.name || 'Projet GCODE';

  const getFileIcon = useCallback((name) => {
    const extension =
      String(name)
        .split('.')
        .pop()
        .toLowerCase();

    const icons = {
      html: 'H',
      htm: 'H',
      css: '#',
      js: 'JS',
      jsx: 'JS',
      ts: 'TS',
      tsx: 'TS',
      json: '{}',
      md: 'M',
      txt: 'T',
      xml: 'X',
      svg: 'S',
      php: 'P',
      py: 'PY',
      java: 'J',
      kt: 'K',
      kts: 'K',
      c: 'C',
      cpp: 'C',
      h: 'H',
      hpp: 'H',
      cs: 'C#',
      swift: 'SW',
      dart: 'D',
      go: 'GO',
      rs: 'RS',
      sql: 'SQL',
      sh: '$',
      yaml: 'Y',
      yml: 'Y',
      gcode: 'G',
      nc: 'NC',
      ngc: 'G',
    };

    return icons[extension] || '•';
  }, []);

  const notifyProjectUpdated = useCallback(
    async (fallbackProject = null) => {
      if (typeof onProjectUpdated !== 'function') {
        return;
      }

      try {
        const updated =
          projectId
            ? await getProject(projectId)
            : null;

        onProjectUpdated(
          updated || fallbackProject || project
        );
      } catch {
        onProjectUpdated(
          fallbackProject || project
        );
      }
    },
    [onProjectUpdated, projectId, project]
  );

  const loadProject = useCallback(async () => {
    if (!projectId) {
      setFiles({});
      setActiveFile(null);
      setCode('');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const loaded = await getProject(projectId);

      const loadedFiles =
        loaded?.files &&
        typeof loaded.files === 'object'
          ? loaded.files
          : {};

      const names = Object.keys(loadedFiles);

      const selected =
        loaded?.activeFile &&
        Object.prototype.hasOwnProperty.call(
          loadedFiles,
          loaded.activeFile
        )
          ? loaded.activeFile
          : names[0] || null;

      setFiles(loadedFiles);
      setActiveFile(selected);
      setCode(
        selected
          ? String(loadedFiles[selected] ?? '')
          : ''
      );

      historyRef.current = [];
      redoRef.current = [];
      setDirty(false);
    } catch (error) {
      Alert.alert(
        'Erreur',
        error?.message ||
          'Impossible de charger le projet.'
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const settings =
          await loadEditorSettings();

        if (mounted && settings) {
          setEditorSettings({
            autoSave:
              settings.autoSave !== false,
            lineNumbers:
              settings.lineNumbers !== false,
          });
        }
      } catch {
        // Les valeurs par défaut restent actives.
      }

      if (mounted) {
        await loadProject();
      }
    };

    initialize();

    return () => {
      mounted = false;

      if (autoSaveTimerRef.current) {
        clearTimeout(
          autoSaveTimerRef.current
        );
      }
    };
  }, [loadProject]);

  useEffect(() => {
    setShowWelcome(true);
  }, [projectId]);

  const saveCurrentFile = useCallback(
    async (silent = false) => {
      if (!projectId || !activeFile) {
        return false;
      }

      setSaving(true);

      try {
        await saveProjectFile(
          projectId,
          activeFile,
          code
        );

        setFiles((previous) => ({
          ...previous,
          [activeFile]: code,
        }));

        setDirty(false);

        await notifyProjectUpdated();

        return true;
      } catch (error) {
        if (!silent) {
          Alert.alert(
            'Erreur de sauvegarde',
            error?.message ||
              'Impossible de sauvegarder le fichier.'
          );
        }

        return false;
      } finally {
        setSaving(false);
      }
    },
    [
      projectId,
      activeFile,
      code,
      notifyProjectUpdated,
    ]
  );

  const scheduleAutoSave = useCallback(() => {
    if (
      !editorSettings.autoSave ||
      !projectId ||
      !activeFile
    ) {
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(
        autoSaveTimerRef.current
      );
    }

    autoSaveTimerRef.current = setTimeout(
      () => {
        saveCurrentFile(true);
      },
      1200
    );
  }, [
    editorSettings.autoSave,
    projectId,
    activeFile,
    saveCurrentFile,
  ]);

  const updateCode = useCallback(
    (nextValue) => {
      const previous = code;

      if (previous !== nextValue) {
        historyRef.current = [
          ...historyRef.current.slice(-49),
          previous,
        ];

        redoRef.current = [];
      }

      setCode(nextValue);
      setDirty(true);
      scheduleAutoSave();
    },
    [code, scheduleAutoSave]
  );

  const openFile = useCallback(
    async (name) => {
      if (!Object.prototype.hasOwnProperty.call(files, name)) {
        return;
      }

      if (dirty && activeFile) {
        const shouldSave = await new Promise(
          (resolve) => {
            Alert.alert(
              'Modifications non sauvegardées',
              `"${activeFile}" contient des modifications.`,
              [
                {
                  text: 'Continuer sans sauvegarder',
                  style: 'destructive',
                  onPress: () =>
                    resolve(false),
                },
                {
                  text: 'Annuler',
                  style: 'cancel',
                  onPress: () =>
                    resolve(null),
                },
                {
                  text: 'Sauvegarder',
                  onPress: async () => {
                    const saved =
                      await saveCurrentFile();
                    resolve(saved);
                  },
                },
              ]
            );
          }
        );

        if (shouldSave === null) {
          return;
        }
      }

      setActiveFile(name);
      setCode(String(files[name] ?? ''));
      setDirty(false);
      setSelection({
        start: 0,
        end: 0,
      });

      historyRef.current = [];
      redoRef.current = [];

      setShowWelcome(false);
    },
    [
      files,
      dirty,
      activeFile,
      saveCurrentFile,
    ]
  );

  const createFile = useCallback(
    async () => {
      const cleanName =
        sanitizeFileName(newFileName);

      if (!cleanName) {
        Alert.alert(
          'Nom requis',
          'Donne un nom au fichier.'
        );
        return;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          files,
          cleanName
        )
      ) {
        Alert.alert(
          'Fichier déjà présent',
          `Le fichier "${cleanName}" existe déjà.`
        );
        return;
      }

      try {
        await addProjectFile(
          projectId,
          cleanName,
          ''
        );

        setFiles((previous) => ({
          ...previous,
          [cleanName]: '',
        }));

        setNewFileName('');
        setShowNewFileModal(false);

        setActiveFile(cleanName);
        setCode('');
        setDirty(false);
        setShowWelcome(false);

        historyRef.current = [];
        redoRef.current = [];

        await notifyProjectUpdated();
      } catch (error) {
        Alert.alert(
          'Erreur',
          error?.message ||
            'Impossible de créer le fichier.'
        );
      }
    },
    [
      newFileName,
      files,
      projectId,
      notifyProjectUpdated,
    ]
  );

  const importFile = useCallback(async () => {
    try {
      const result = await pickFile();

      if (!result || result.canceled) {
        return;
      }

      const name = sanitizeFileName(
        result.name || 'untitled.txt'
      );

      const content =
        typeof result.content === 'string'
          ? result.content
          : '';

      let finalName = name;

      if (
        Object.prototype.hasOwnProperty.call(
          files,
          finalName
        )
      ) {
        const dot =
          finalName.lastIndexOf('.');

        const base =
          dot > 0
            ? finalName.slice(0, dot)
            : finalName;

        const extension =
          dot > 0
            ? finalName.slice(dot)
            : '';

        let counter = 2;

        while (
          Object.prototype.hasOwnProperty.call(
            files,
            `${base}-${counter}${extension}`
          )
        ) {
          counter += 1;
        }

        finalName =
          `${base}-${counter}${extension}`;
      }

      await addProjectFile(
        projectId,
        finalName,
        content
      );

      setFiles((previous) => ({
        ...previous,
        [finalName]: content,
      }));

      setActiveFile(finalName);
      setCode(content);
      setDirty(false);
      setShowWelcome(false);

      historyRef.current = [];
      redoRef.current = [];

      await notifyProjectUpdated();

      Alert.alert(
        'Fichier ouvert',
        `"${finalName}" a été importé dans le projet.`
      );
    } catch (error) {
      Alert.alert(
        'Impossible d’ouvrir le fichier',
        error?.message ||
          'Le fichier ne peut pas être lu.'
      );
    }
  }, [
    files,
    projectId,
    notifyProjectUpdated,
  ]);

  const requestDeleteFile = useCallback(
    (name) => {
      Alert.alert(
        'Supprimer le fichier',
        `Supprimer définitivement "${name}" ?`,
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
                await deleteProjectFile(
                  projectId,
                  name
                );

                const nextFiles = {
                  ...files,
                };

                delete nextFiles[name];

                const remaining =
                  Object.keys(nextFiles);

                setFiles(nextFiles);

                if (activeFile === name) {
                  const nextActive =
                    remaining[0] || null;

                  setActiveFile(nextActive);

                  setCode(
                    nextActive
                      ? String(
                          nextFiles[nextActive] ??
                            ''
                        )
                      : ''
                  );

                  setDirty(false);
                }

                await notifyProjectUpdated();
              } catch (error) {
                Alert.alert(
                  'Erreur',
                  error?.message ||
                    'Impossible de supprimer le fichier.'
                );
              }
            },
          },
        ]
      );
    },
    [
      projectId,
      files,
      activeFile,
      notifyProjectUpdated,
    ]
  );

  const requestRenameFile = useCallback(
    (name) => {
      setRenameTarget(name);
      setRenameFileName(name);
      setShowRenameModal(true);
    },
    []
  );

  const renameFile = useCallback(async () => {
    const oldName = renameTarget;
    const newName =
      sanitizeFileName(renameFileName);

    if (!oldName || !newName) {
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
        'Nom déjà utilisé',
        `Le fichier "${newName}" existe déjà.`
      );
      return;
    }

    try {
      await renameProjectFile(
        projectId,
        oldName,
        newName
      );

      const nextFiles = {
        ...files,
      };

      nextFiles[newName] =
        nextFiles[oldName];

      delete nextFiles[oldName];

      setFiles(nextFiles);

      if (activeFile === oldName) {
        setActiveFile(newName);
      }

      setRenameTarget(null);
      setRenameFileName('');
      setShowRenameModal(false);

      await notifyProjectUpdated();
    } catch (error) {
      Alert.alert(
        'Erreur',
        error?.message ||
          'Impossible de renommer le fichier.'
      );
    }
  }, [
    renameTarget,
    renameFileName,
    files,
    projectId,
    activeFile,
    notifyProjectUpdated,
  ]);

  const undo = useCallback(() => {
    const history = historyRef.current;

    if (!history.length) {
      return;
    }

    const previous =
      history[history.length - 1];

    historyRef.current =
      history.slice(0, -1);

    redoRef.current = [
      ...redoRef.current,
      code,
    ];

    setCode(previous);
    setDirty(true);
    scheduleAutoSave();
  }, [code, scheduleAutoSave]);

  const redo = useCallback(() => {
    const redoHistory =
      redoRef.current;

    if (!redoHistory.length) {
      return;
    }

    const next =
      redoHistory[redoHistory.length - 1];

    redoRef.current =
      redoHistory.slice(0, -1);

    historyRef.current = [
      ...historyRef.current,
      code,
    ];

    setCode(next);
    setDirty(true);
    scheduleAutoSave();
  }, [code, scheduleAutoSave]);

  const findNext = useCallback(() => {
    const query = searchText;

    if (!query) {
      setSearchIndex(-1);
      return;
    }

    const start =
      searchIndex < 0
        ? 0
        : searchIndex + 1;

    const first =
      code.indexOf(query, start);

    const index =
      first === -1
        ? code.indexOf(query)
        : first;

    setSearchIndex(index);

    if (index >= 0) {
      setSelection({
        start: index,
        end: index + query.length,
      });
    }
  }, [code, searchText, searchIndex]);

  const replaceCurrent = useCallback(() => {
    if (!searchText) {
      return;
    }

    const index =
      searchIndex >= 0
        ? searchIndex
        : code.indexOf(searchText);

    if (index < 0) {
      return;
    }

    const nextCode =
      code.slice(0, index) +
      replaceText +
      code.slice(
        index + searchText.length
      );

    updateCode(nextCode);

    setSearchIndex(index);

    setSelection({
      start: index,
      end:
        index + replaceText.length,
    });
  }, [
    code,
    searchText,
    replaceText,
    searchIndex,
    updateCode,
  ]);

  const replaceAll = useCallback(() => {
    if (!searchText) {
      return;
    }

    if (!code.includes(searchText)) {
      return;
    }

    const nextCode =
      code.split(searchText).join(replaceText);

    updateCode(nextCode);
    setSearchIndex(-1);
    setSelection({
      start: 0,
      end: 0,
    });
  }, [
    code,
    searchText,
    replaceText,
    updateCode,
  ]);

  const goPreview = useCallback(() => {
    if (dirty) {
      saveCurrentFile(true);
    }

    if (typeof onPreview === 'function') {
      onPreview();
      return;
    }

    Alert.alert(
      'Preview',
      'Le Preview n’est pas disponible dans cette navigation.'
    );
  }, [dirty, saveCurrentFile, onPreview]);

  const handleWelcomeAction = useCallback(
    async (action) => {
      switch (action) {
        case 'new':
          setShowNewFileModal(true);
          break;

        case 'open':
          await importFile();
          break;

        case 'folder':
          setShowWelcome(false);

          if (
            typeof onOpenProjects ===
            'function'
          ) {
            onOpenProjects();
          }
          break;

        case 'clone':
          Alert.alert(
            'Git',
            'Le clonage Git distant nécessite encore l’intégration du moteur Git natif. Cette fonction n’est volontairement pas simulée.'
          );
          break;

        case 'themes':
        case 'tools':
        case 'shortcuts':
          if (
            typeof onOpenSettings ===
            'function'
          ) {
            onOpenSettings();
          }
          break;

        case 'terminal':
          if (
            typeof onOpenTerminal ===
            'function'
          ) {
            onOpenTerminal();
          }
          break;

        case 'commands':
          if (
            typeof onOpenCommands ===
            'function'
          ) {
            onOpenCommands();
          }
          break;

        case 'ai':
          if (
            typeof onOpenAI ===
            'function'
          ) {
            onOpenAI();
          }
          break;

        default:
          break;
      }
    },
    [
      importFile,
      onOpenProjects,
      onOpenSettings,
      onOpenTerminal,
      onOpenCommands,
      onOpenAI,
    ]
  );

  const renderWelcomeAction = (
    icon,
    title,
    description,
    action
  ) => (
    <Pressable
      key={title}
      style={styles.welcomeCard}
      onPress={() =>
        handleWelcomeAction(action)
      }
    >
      <View style={styles.welcomeAction}>
        <View style={styles.welcomeActionIcon}>
          <Text
            style={
              styles.welcomeActionIconText
            }
          >
            {icon}
          </Text>
        </View>

        <View style={styles.welcomeActionBody}>
          <Text
            style={styles.welcomeActionTitle}
          >
            {title}
          </Text>

          <Text
            style={
              styles.welcomeActionDescription
            }
          >
            {description}
          </Text>
        </View>

        <Text style={styles.welcomeArrow}>
          ›
        </Text>
      </View>
    </Pressable>
  );

  const renderWelcome = () => {
    const recentFiles = fileNames.slice(0, 8);

    return (
      <View style={styles.welcomeContainer}>
        <ScrollView
          style={styles.welcomeScroll}
          contentContainerStyle={{
            paddingBottom: 80,
          }}
        >
          <View style={styles.welcomeHeader}>
            <Text
              style={styles.welcomeEyebrow}
            >
              GCODE MOBILE V3
            </Text>

            <Text style={styles.welcomeTitle}>
              Welcome
            </Text>

            <Text
              style={styles.welcomeSubtitle}
            >
              Un environnement de développement
              mobile pour créer, modifier,
              organiser et prévisualiser tes
              projets directement sur Android.
            </Text>
          </View>

          <View style={styles.welcomeSection}>
            <Text
              style={styles.welcomeSectionTitle}
            >
              Start
            </Text>

            {renderWelcomeAction(
              '+',
              'New File…',
              'Créer un nouveau fichier dans le projet.',
              'new'
            )}

            {renderWelcomeAction(
              '↗',
              'Open File…',
              'Importer un fichier réel depuis le stockage de l’appareil.',
              'open'
            )}

            {renderWelcomeAction(
              '▣',
              'Open Folder…',
              'Ouvrir un autre projet GCODE.',
              'folder'
            )}

            {renderWelcomeAction(
              'G',
              'Clone Git Repository…',
              'Préparation de l’intégration Git native.',
              'clone'
            )}
          </View>

          <View style={styles.welcomeSection}>
            <Text
              style={styles.welcomeSectionTitle}
            >
              Recent
            </Text>

            <View style={styles.welcomeCard}>
              {recentFiles.length === 0 ? (
                <View
                  style={styles.recentEmpty}
                >
                  <Text
                    style={
                      styles.emptyEditorText
                    }
                  >
                    Aucun fichier récent.
                  </Text>
                </View>
              ) : (
                recentFiles.map((name) => (
                  <Pressable
                    key={name}
                    style={styles.recentFile}
                    onPress={() =>
                      openFile(name)
                    }
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
                        {getFileIcon(name)}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.recentFileBody
                      }
                    >
                      <Text
                        style={
                          styles.recentFileName
                        }
                      >
                        {name}
                      </Text>

                      <Text
                        style={
                          styles.recentFilePath
                        }
                      >
                        {currentProjectName}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          </View>

          <View style={styles.welcomeSection}>
            <Text
              style={styles.welcomeSectionTitle}
            >
              Walkthroughs & Tips
            </Text>

            <View style={styles.tipCard}>
              <Text style={styles.tipNumber}>
                01
              </Text>

              <Text style={styles.tipTitle}>
                Édition
              </Text>

              <Text style={styles.tipText}>
                Utilise la barre d’outils pour
                rechercher, remplacer, annuler
                et rétablir tes modifications.
              </Text>
            </View>

            <View style={styles.tipCard}>
              <Text style={styles.tipNumber}>
                02
              </Text>

              <Text style={styles.tipTitle}>
                Auto-save
              </Text>

              <Text style={styles.tipText}>
                Lorsque l’auto-sauvegarde est
                activée dans Settings, GCODE
                sauvegarde automatiquement les
                modifications.
              </Text>
            </View>

            <View style={styles.tipCard}>
              <Text style={styles.tipNumber}>
                03
              </Text>

              <Text style={styles.tipTitle}>
                Preview
              </Text>

              <Text style={styles.tipText}>
                Pour les projets web, utilise
                Preview afin de vérifier le
                résultat de ton HTML/CSS/JS.
              </Text>
            </View>
          </View>

          <View style={styles.welcomeSection}>
            <Text
              style={styles.welcomeSectionTitle}
            >
              Customize
            </Text>

            {renderWelcomeAction(
              'T',
              'Themes',
              'Personnaliser l’apparence de GCODE.',
              'themes'
            )}

            {renderWelcomeAction(
              '{}',
              'Tools and languages',
              'Configurer les outils disponibles.',
              'tools'
            )}

            {renderWelcomeAction(
              '⌨',
              'Keyboard Shortcuts',
              'Consulter les options de configuration de l’éditeur.',
              'shortcuts'
            )}
          </View>

          <View style={styles.welcomeFooter}>
            <Text
              style={styles.welcomeFooterText}
            >
              GCODE Mobile V3 • Édition locale
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderEditor = () => {
    if (!activeFile) {
      return (
        <View style={styles.emptyEditor}>
          <Text
            style={styles.emptyEditorTitle}
          >
            Aucun fichier ouvert
          </Text>

          <Text
            style={styles.emptyEditorText}
          >
            Crée ou importe un fichier pour
            commencer à coder.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.editorArea}>
        <View style={styles.editorHeader}>
          <Text
            style={styles.editorHeaderText}
          >
            {activeFile}
          </Text>

          <Text style={styles.statusText}>
            {saving
              ? 'Sauvegarde…'
              : dirty
                ? 'Modifié'
                : 'Enregistré'}
          </Text>
        </View>

        <View style={styles.editor}>
          {editorSettings.lineNumbers && (
            <ScrollView
              ref={lineScrollRef}
              style={styles.lineScroll}
              scrollEnabled={false}
              showsVerticalScrollIndicator={
                false
              }
            >
              <View
                style={styles.lineNumbers}
              >
                {lineNumbers.map((number) => (
                  <Text
                    key={number}
                    style={styles.lineNumber}
                  >
                    {number}
                  </Text>
                ))}
              </View>
            </ScrollView>
          )}

          <TextInput
            ref={editorRef}
            value={code}
            onChangeText={updateCode}
            onSelectionChange={(event) =>
              setSelection(
                event.nativeEvent.selection
              )
            }
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            scrollEnabled
            textAlignVertical="top"
            style={styles.codeInput}
            selection={selection}
            onScroll={(event) => {
              const y =
                event.nativeEvent.contentOffset
                  ?.y || 0;

              if (
                lineScrollRef.current &&
                editorSettings.lineNumbers
              ) {
                lineScrollRef.current.scrollTo({
                  y,
                  animated: false,
                });
              }
            }}
          />
        </View>
      </View>
    );
  };

  const renderExplorer = () => (
    <View style={styles.explorer}>
      <View style={styles.explorerHeader}>
        <Text style={styles.explorerTitle}>
          Explorer
        </Text>

        <Pressable
          style={styles.addButton}
          onPress={() =>
            setShowNewFileModal(true)
          }
        >
          <Text
            style={styles.addButtonText}
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
        {fileNames.map((name) => {
          const active =
            name === activeFile;

          return (
            <View
              key={name}
              style={[
                styles.fileItem,
                active &&
                  styles.activeFileItem,
              ]}
            >
              <Pressable
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                onPress={() =>
                  openFile(name)
                }
              >
                <Text style={styles.fileIcon}>
                  {getFileIcon(name)}
                </Text>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.fileName,
                    active &&
                      styles.activeFileName,
                  ]}
                >
                  {name}
                </Text>
              </Pressable>

              <Pressable
                style={
                  styles.fileMenuButton
                }
                onPress={() => {
                  Alert.alert(
                    name,
                    'Action sur le fichier',
                    [
                      {
                        text: 'Annuler',
                        style: 'cancel',
                      },
                      {
                        text: 'Renommer',
                        onPress: () =>
                          requestRenameFile(
                            name
                          ),
                      },
                      {
                        text: 'Supprimer',
                        style: 'destructive',
                        onPress: () =>
                          requestDeleteFile(
                            name
                          ),
                      },
                    ]
                  );
                }}
              >
                <Text
                  style={styles.fileMenuText}
                >
                  ⋯
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyEditor}>
          <Text
            style={styles.emptyEditorTitle}
          >
            Chargement de GCODE…
          </Text>

          <Text
            style={styles.emptyEditorText}
          >
            Ouverture du projet.
          </Text>
        </View>
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
          style={styles.headerButton}
          onPress={() => {
            if (dirty) {
              Alert.alert(
                'Modifications non sauvegardées',
                'Veux-tu sauvegarder avant de quitter ?',
                [
                  {
                    text: 'Annuler',
                    style: 'cancel',
                  },
                  {
                    text: 'Quitter',
                    style: 'destructive',
                    onPress: onBack,
                  },
                  {
                    text: 'Sauvegarder',
                    onPress: async () => {
                      const saved =
                        await saveCurrentFile();

                      if (saved) {
                        onBack?.();
                      }
                    },
                  },
                ]
              );

              return;
            }

            onBack?.();
          }}
        >
          <Text
            style={styles.headerButtonText}
          >
            ‹
          </Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text
            numberOfLines={1}
            style={styles.projectTitle}
          >
            {currentProjectName}
          </Text>

          <Text
            numberOfLines={1}
            style={styles.fileTitle}
          >
            {showWelcome
              ? 'Welcome'
              : activeFile || 'Aucun fichier'}
          </Text>
        </View>

        <Pressable
          style={styles.previewButton}
          onPress={goPreview}
        >
          <Text
            style={styles.previewButtonText}
          >
            Preview
          </Text>
        </Pressable>
      </View>

      <View style={styles.toolbar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          style={styles.toolbarScroll}
        >
          <Pressable
            style={styles.toolbarButton}
            onPress={() =>
              setShowExplorer(
                (value) => !value
              )
            }
          >
            <Text
              style={styles.toolbarButtonText}
            >
              ☰
            </Text>
          </Pressable>

          <Pressable
            style={styles.toolbarButton}
            onPress={() =>
              setShowWelcome(true)
            }
          >
            <Text
              style={styles.toolbarButtonText}
            >
              Home
            </Text>
          </Pressable>

          <Pressable
            style={styles.toolbarButton}
            onPress={() =>
              setShowNewFileModal(true)
            }
          >
            <Text
              style={styles.toolbarButtonText}
            >
              New
            </Text>
          </Pressable>

          <Pressable
            style={styles.toolbarButton}
            onPress={importFile}
          >
            <Text
              style={styles.toolbarButtonText}
            >
              Open
            </Text>
          </Pressable>

          <Pressable
            style={styles.toolbarButton}
            onPress={() =>
              saveCurrentFile(false)
            }
          >
            <Text
              style={styles.toolbarButtonText}
            >
              Save
            </Text>
          </Pressable>

          <Pressable
            style={styles.toolbarButton}
            onPress={undo}
          >
            <Text
              style={styles.toolbarButtonText}
            >
              ↶
            </Text>
          </Pressable>

          <Pressable
            style={styles.toolbarButton}
            onPress={redo}
          >
            <Text
              style={styles.toolbarButtonText}
            >
              ↷
            </Text>
          </Pressable>

          <Pressable
            style={styles.toolbarButton}
            onPress={() => {
              setShowSearch(true);
              setSearchIndex(-1);
            }}
          >
            <Text
              style={styles.toolbarButtonText}
            >
              Find
            </Text>
          </Pressable>

          <Pressable
            style={styles.toolbarButton}
            onPress={() => {
              if (
                typeof onOpenTerminal ===
                'function'
              ) {
                onOpenTerminal();
              }
            }}
          >
            <Text
              style={styles.toolbarButtonText}
            >
              Terminal
            </Text>
          </Pressable>

          <Pressable
            style={styles.toolbarButton}
            onPress={() => {
              if (
                typeof onOpenCommands ===
                'function'
              ) {
                onOpenCommands();
              }
            }}
          >
            <Text
              style={styles.toolbarButtonText}
            >
              Commands
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {showSearch && !showWelcome && (
        <View style={styles.searchPanel}>
          <View style={styles.searchRow}>
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
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Pressable
              style={styles.searchButton}
              onPress={findNext}
            >
              <Text
                style={
                  styles.searchButtonText
                }
              >
                Suivant
              </Text>
            </Pressable>

            <Pressable
              style={styles.searchClose}
              onPress={() => {
                setShowSearch(false);
                setSearchIndex(-1);
              }}
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

          <View style={styles.searchRow}>
            <TextInput
              value={replaceText}
              onChangeText={setReplaceText}
              placeholder="Remplacer par…"
              placeholderTextColor={
                colors.muted2
              }
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Pressable
              style={styles.searchButton}
              onPress={replaceCurrent}
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
              style={styles.searchButton}
              onPress={replaceAll}
            >
              <Text
                style={
                  styles.searchButtonText
                }
              >
                Tout
              </Text>
            </Pressable>
          </View>

          <Text style={styles.searchInfo}>
            {searchText
              ? searchIndex >= 0
                ? `Position : ${searchIndex}`
                : 'Recherche prête'
              : 'Saisis un texte à rechercher'}
          </Text>
        </View>
      )}

      <View style={styles.workspace}>
        {showExplorer &&
          !showWelcome &&
          renderExplorer()}

        <View style={{ flex: 1 }}>
          {showWelcome
            ? renderWelcome()
            : renderEditor()}
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

            <TextInput
              value={newFileName}
              onChangeText={setNewFileName}
              placeholder="ex: app.js"
              placeholderTextColor={
                colors.muted2
              }
              style={styles.modalInput}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalButton}
                onPress={() => {
                  setNewFileName('');
                  setShowNewFileModal(false);
                }}
              >
                <Text
                  style={styles.modalButtonText}
                >
                  Annuler
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalButton,
                  styles.modalPrimary,
                ]}
                onPress={createFile}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    styles.modalPrimaryText,
                  ]}
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

            <TextInput
              value={renameFileName}
              onChangeText={setRenameFileName}
              placeholder="Nouveau nom"
              placeholderTextColor={
                colors.muted2
              }
              style={styles.modalInput}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalButton}
                onPress={() => {
                  setRenameTarget(null);
                  setRenameFileName('');
                  setShowRenameModal(false);
                }}
              >
                <Text
                  style={styles.modalButtonText}
                >
                  Annuler
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalButton,
                  styles.modalPrimary,
                ]}
                onPress={renameFile}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    styles.modalPrimaryText,
                  ]}
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
