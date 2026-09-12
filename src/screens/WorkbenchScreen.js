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

import { loadEditorSettings } from '../storage/editorSettings';

import {
  pickFile,
  sanitizeFileName,
} from '../storage/filePicker';

import FileExplorer from '../components/FileExplorer';

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

  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameFileName, setRenameFileName] = useState('');

  const [showWelcome, setShowWelcome] = useState(true);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },

        header: {
          minHeight: 64,
          paddingHorizontal: spacing.md,
          paddingTop: Platform.OS === 'ios' ? 8 : 4,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.glassStrong,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          shadowColor: colors.shadow,
          shadowOpacity: 0.18,
          shadowRadius: 12,
          shadowOffset: {
            width: 0,
            height: 5,
          },
          elevation: 6,
        },

        headerButton: {
          width: 40,
          height: 40,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.glass,
          borderWidth: 1,
          borderColor: colors.border,
        },

        headerButtonText: {
          color: colors.text,
          fontSize: 20,
          fontWeight: '700',
        },

        headerCenter: {
          flex: 1,
          paddingHorizontal: spacing.sm,
        },

        projectTitle: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '800',
        },

        fileTitle: {
          marginTop: 2,
          color: colors.textSecondary,
          fontSize: 12,
        },

        dirtyText: {
          color: colors.warning,
          fontWeight: '700',
        },

        previewButton: {
          minWidth: 82,
          height: 40,
          paddingHorizontal: spacing.md,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          shadowColor: colors.shadow,
          shadowOpacity: 0.22,
          shadowRadius: 8,
          shadowOffset: {
            width: 0,
            height: 4,
          },
          elevation: 5,
        },

        previewButtonText: {
          color: colors.textInverse,
          fontSize: 12,
          fontWeight: '800',
        },

        toolbar: {
          minHeight: 52,
          paddingHorizontal: spacing.sm,
          backgroundColor: colors.glass,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },

        toolbarScroll: {
          flex: 1,
        },

        toolbarContent: {
          alignItems: 'center',
          paddingVertical: 7,
        },

        toolbarButton: {
          minWidth: 40,
          height: 38,
          marginRight: 6,
          paddingHorizontal: 10,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.glassSoft,
          borderWidth: 1,
          borderColor: colors.border,
        },

        toolbarButtonActive: {
          backgroundColor: colors.primarySoft,
          borderColor: colors.borderStrong,
        },

        toolbarButtonText: {
          color: colors.text,
          fontSize: 12,
          fontWeight: '700',
        },

        toolbarButtonDisabled: {
          opacity: 0.35,
        },

        searchPanel: {
          padding: spacing.sm,
          backgroundColor: colors.glassStrong,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },

        searchRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 7,
        },

        searchInput: {
          flex: 1,
          minHeight: 40,
          paddingHorizontal: spacing.sm,
          borderRadius: radius.md,
          backgroundColor: colors.glassSoft,
          borderWidth: 1,
          borderColor: colors.border,
          color: colors.text,
          fontSize: 13,
        },

        searchInputSecondary: {
          marginLeft: 7,
        },

        searchAction: {
          width: 40,
          height: 40,
          marginLeft: 7,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primarySoft,
          borderWidth: 1,
          borderColor: colors.border,
        },

        searchActionText: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '800',
        },

        searchInfo: {
          color: colors.textMuted,
          fontSize: 11,
        },

        workspace: {
          flex: 1,
          flexDirection: 'row',
        },

        explorerContainer: {
          width: 250,
          maxWidth: '72%',
          backgroundColor: colors.glassStrong,
          borderRightWidth: 1,
          borderRightColor: colors.border,
        },

        editorContainer: {
          flex: 1,
          backgroundColor: colors.editorBackground,
        },

        editorHeader: {
          minHeight: 42,
          paddingHorizontal: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.editorSurface,
          borderBottomWidth: 1,
          borderBottomColor: colors.editorLine,
        },

        editorHeaderTitle: {
          flex: 1,
          color: colors.text,
          fontSize: 12,
          fontWeight: '700',
        },

        editorStatus: {
          color: colors.textMuted,
          fontSize: 10,
        },

        editorBody: {
          flex: 1,
          flexDirection: 'row',
        },

        lineNumbersContainer: {
          width: 48,
          backgroundColor: colors.editorSurface,
          borderRightWidth: 1,
          borderRightColor: colors.editorLine,
        },

        lineNumbersScroll: {
          flex: 1,
        },

        lineNumbersContent: {
          paddingTop: 12,
          paddingBottom: 30,
        },

        lineNumber: {
          height: 21,
          paddingRight: 9,
          textAlign: 'right',
          color: colors.lineNumber,
          fontSize: 12,
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
          lineHeight: 21,
        },

        codeInput: {
          flex: 1,
          minHeight: '100%',
          paddingTop: 12,
          paddingHorizontal: 12,
          paddingBottom: 30,
          color: colors.editorText,
          backgroundColor: colors.editorBackground,
          fontSize: 13,
          lineHeight: 21,
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
          textAlignVertical: 'top',
        },

        welcome: {
          flex: 1,
          backgroundColor: colors.background,
        },

        welcomeScroll: {
          flex: 1,
        },

        welcomeContent: {
          padding: spacing.lg,
          paddingBottom: 60,
        },

        welcomeHero: {
          padding: spacing.lg,
          borderRadius: radius.xl,
          backgroundColor: colors.glassStrong,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          shadowColor: colors.shadow,
          shadowOpacity: 0.22,
          shadowRadius: 18,
          shadowOffset: {
            width: 0,
            height: 8,
          },
          elevation: 8,
        },

        welcomeBadge: {
          alignSelf: 'flex-start',
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: radius.pill,
          backgroundColor: colors.primarySoft,
          borderWidth: 1,
          borderColor: colors.border,
        },

        welcomeBadgeText: {
          color: colors.primary,
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 1,
        },

        welcomeTitle: {
          marginTop: spacing.md,
          color: colors.text,
          fontSize: 27,
          fontWeight: '900',
        },

        welcomeSubtitle: {
          marginTop: spacing.sm,
          color: colors.textSecondary,
          fontSize: 14,
          lineHeight: 21,
        },

        welcomeGrid: {
          marginTop: spacing.lg,
          flexDirection: 'row',
          flexWrap: 'wrap',
        },

        welcomeAction: {
          width: '48%',
          marginBottom: spacing.sm,
          marginRight: '2%',
          minHeight: 86,
          padding: spacing.sm,
          borderRadius: radius.lg,
          backgroundColor: colors.glass,
          borderWidth: 1,
          borderColor: colors.border,
        },

        welcomeActionTitle: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '800',
        },

        welcomeActionText: {
          marginTop: 5,
          color: colors.textMuted,
          fontSize: 11,
          lineHeight: 16,
        },

        infoCard: {
          marginTop: spacing.md,
          padding: spacing.md,
          borderRadius: radius.lg,
          backgroundColor: colors.glassSoft,
          borderWidth: 1,
          borderColor: colors.border,
        },

        infoTitle: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '800',
        },

        infoText: {
          marginTop: 5,
          color: colors.textSecondary,
          fontSize: 12,
          lineHeight: 18,
        },

        modalOverlay: {
          flex: 1,
          padding: spacing.lg,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.overlay,
        },

        modalCard: {
          width: '100%',
          maxWidth: 480,
          padding: spacing.lg,
          borderRadius: radius.xl,
          backgroundColor: colors.glassStrong,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          shadowColor: colors.shadow,
          shadowOpacity: 0.35,
          shadowRadius: 25,
          shadowOffset: {
            width: 0,
            height: 12,
          },
          elevation: 12,
        },

        modalTitle: {
          color: colors.text,
          fontSize: 19,
          fontWeight: '900',
        },

        modalSubtitle: {
          marginTop: 5,
          marginBottom: spacing.md,
          color: colors.textSecondary,
          fontSize: 12,
        },

        modalInput: {
          minHeight: 46,
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          backgroundColor: colors.glassSoft,
          borderWidth: 1,
          borderColor: colors.border,
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
          minHeight: 42,
          marginLeft: 8,
          paddingHorizontal: spacing.md,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.glass,
          borderWidth: 1,
          borderColor: colors.border,
        },

        modalButtonPrimary: {
          backgroundColor: colors.primary,
          borderColor: colors.borderStrong,
        },

        modalButtonDanger: {
          backgroundColor: colors.dangerSoft,
          borderColor: colors.danger,
        },

        modalButtonText: {
          color: colors.text,
          fontSize: 12,
          fontWeight: '800',
        },

        modalButtonPrimaryText: {
          color: colors.textInverse,
        },

        modalButtonDangerText: {
          color: colors.danger,
        },

        loading: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        },

        loadingCard: {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderRadius: radius.xl,
          backgroundColor: colors.glassStrong,
          borderWidth: 1,
          borderColor: colors.border,
        },

        loadingText: {
          color: colors.textSecondary,
          fontSize: 13,
          fontWeight: '700',
        },
      }),
    [colors, spacing, radius]
  );

  const projectId = useMemo(
    () => project?.id || project?._id || project?.projectId,
    [project]
  );

  const lineCount = useMemo(
    () => Math.max(1, String(code || '').split('\n').length),
    [code]
  );

  const lineNumbers = useMemo(
    () =>
      Array.from(
        { length: lineCount },
        (_, index) => String(index + 1)
      ),
    [lineCount]
  );

  const fileNames = useMemo(
    () => Object.keys(files || {}),
    [files]
  );

  const currentProjectName = useMemo(
    () =>
      project?.name ||
      project?.title ||
      'Projet sans nom',
    [project]
  );

  const getFileIcon = useCallback((name) => {
    const lower = String(name || '').toLowerCase();

    if (lower.endsWith('.html') || lower.endsWith('.htm')) {
      return '◇';
    }

    if (lower.endsWith('.css')) {
      return '#';
    }

    if (
      lower.endsWith('.js') ||
      lower.endsWith('.jsx')
    ) {
      return 'JS';
    }

    if (
      lower.endsWith('.ts') ||
      lower.endsWith('.tsx')
    ) {
      return 'TS';
    }

    if (lower.endsWith('.json')) {
      return '{}';
    }

    if (lower.endsWith('.md')) {
      return 'M';
    }

    if (lower.endsWith('.txt')) {
      return 'T';
    }

    if (
      lower.endsWith('.xml') ||
      lower.endsWith('.svg')
    ) {
      return '◇';
    }

    if (lower.endsWith('.php')) {
      return 'PHP';
    }

    if (lower.endsWith('.py')) {
      return 'PY';
    }

    if (
      lower.endsWith('.java') ||
      lower.endsWith('.kt') ||
      lower.endsWith('.kts')
    ) {
      return 'JVM';
    }

    if (
      lower.endsWith('.c') ||
      lower.endsWith('.cpp') ||
      lower.endsWith('.h') ||
      lower.endsWith('.hpp')
    ) {
      return 'C';
    }

    if (lower.endsWith('.cs')) {
      return 'C#';
    }

    if (lower.endsWith('.swift')) {
      return 'SW';
    }

    if (lower.endsWith('.dart')) {
      return 'D';
    }

    if (lower.endsWith('.go')) {
      return 'GO';
    }

    if (lower.endsWith('.rs')) {
      return 'RS';
    }

    if (lower.endsWith('.sql')) {
      return 'SQL';
    }

    if (lower.endsWith('.sh')) {
      return 'SH';
    }

    if (
      lower.endsWith('.yaml') ||
      lower.endsWith('.yml')
    ) {
      return 'YML';
    }

    if (
      lower.endsWith('.gcode') ||
      lower.endsWith('.nc') ||
      lower.endsWith('.ngc')
    ) {
      return 'G';
    }

    return '•';
  }, []);

  const notifyProjectUpdated = useCallback(
    (updatedProject) => {
      if (typeof onProjectUpdated === 'function') {
        onProjectUpdated(updatedProject);
      }
    },
    [onProjectUpdated]
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
      const current = await getProject(projectId);

      const loadedFiles =
        current?.files &&
        typeof current.files === 'object'
          ? current.files
          : {};

      setFiles(loadedFiles);

      const names = Object.keys(loadedFiles);

      if (names.length > 0) {
        const preferred =
          names.includes('index.html')
            ? 'index.html'
            : names[0];

        setActiveFile(preferred);
        setCode(String(loadedFiles[preferred] || ''));
      } else {
        setActiveFile(null);
        setCode('');
      }

      historyRef.current = [];
      redoRef.current = [];
      setDirty(false);
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Impossible de charger le projet.'
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const settings = await loadEditorSettings();

        if (mounted && settings) {
          setEditorSettings({
            autoSave:
              settings.autoSave !== false,
            lineNumbers:
              settings.lineNumbers !== false,
          });
        }
      } catch (error) {
        // Valeurs par défaut conservées.
      }

      if (mounted) {
        await loadProject();
      }
    }

    initialize();

    return () => {
      mounted = false;

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
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

        const updatedProject =
          await getProject(projectId);

        if (updatedProject) {
          notifyProjectUpdated(updatedProject);
        }

        return true;
      } catch (error) {
        if (!silent) {
          Alert.alert(
            'Erreur',
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

  const scheduleAutoSave = useCallback(
    (nextCode) => {
      if (
        !editorSettings.autoSave ||
        !projectId ||
        !activeFile
      ) {
        return;
      }

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(
        async () => {
          try {
            await saveProjectFile(
              projectId,
              activeFile,
              nextCode
            );

            setFiles((previous) => ({
              ...previous,
              [activeFile]: nextCode,
            }));

            setDirty(false);
          } catch (error) {
            // L'utilisateur peut sauvegarder manuellement.
          }
        },
        1200
      );
    },
    [
      editorSettings.autoSave,
      projectId,
      activeFile,
    ]
  );

  const updateCode = useCallback(
    (nextCode) => {
      if (nextCode === code) {
        return;
      }

      historyRef.current = [
        ...historyRef.current.slice(-49),
        code,
      ];

      redoRef.current = [];

      setCode(nextCode);
      setDirty(true);

      scheduleAutoSave(nextCode);
    },
    [code, scheduleAutoSave]
  );

  const openFile = useCallback(
    async (filename) => {
      if (!filename || filename === activeFile) {
        if (filename) {
          setShowWelcome(false);
        }
        return;
      }

      const continueOpening = async () => {
        const nextCode = String(
          files?.[filename] || ''
        );

        setActiveFile(filename);
        setCode(nextCode);
        setSelection({
          start: 0,
          end: 0,
        });

        historyRef.current = [];
        redoRef.current = [];
        setDirty(false);
        setShowWelcome(false);
      };

      if (!dirty) {
        await continueOpening();
        return;
      }

      Alert.alert(
        'Modifications non sauvegardées',
        'Le fichier actuel contient des modifications.',
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Continuer',
            style: 'destructive',
            onPress: continueOpening,
          },
          {
            text: 'Sauvegarder',
            onPress: async () => {
              const saved =
                await saveCurrentFile(false);

              if (saved) {
                await continueOpening();
              }
            },
          },
        ]
      );
    },
    [
      activeFile,
      dirty,
      files,
      saveCurrentFile,
    ]
  );

  const createFile = useCallback(async () => {
    const cleanName = sanitizeFileName(
      newFileName.trim()
    );

    if (!cleanName) {
      Alert.alert(
        'Nom invalide',
        'Entre un nom de fichier valide.'
      );
      return;
    }

    if (!projectId) {
      return;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        files,
        cleanName
      )
    ) {
      Alert.alert(
        'Fichier existant',
        'Un fichier portant ce nom existe déjà.'
      );
      return;
    }

    try {
      await addProjectFile(
        projectId,
        cleanName,
        ''
      );

      const updatedProject =
        await getProject(projectId);

      const updatedFiles =
        updatedProject?.files || {};

      setFiles(updatedFiles);
      setActiveFile(cleanName);
      setCode('');
      setDirty(false);
      setSelection({
        start: 0,
        end: 0,
      });

      historyRef.current = [];
      redoRef.current = [];

      setNewFileName('');
      setShowNewFileModal(false);
      setShowWelcome(false);

      notifyProjectUpdated(updatedProject);
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Impossible de créer le fichier.'
      );
    }
  }, [
    newFileName,
    projectId,
    files,
    notifyProjectUpdated,
  ]);

  const importFile = useCallback(async () => {
    if (!projectId) {
      return;
    }

    try {
      const imported = await pickFile();

      if (!imported) {
        return;
      }

      const originalName =
        sanitizeFileName(
          imported.name ||
            imported.fileName ||
            'imported-file.txt'
        );

      let finalName = originalName;
      let counter = 2;

      while (
        Object.prototype.hasOwnProperty.call(
          files,
          finalName
        )
      ) {
        const dot =
          originalName.lastIndexOf('.');

        if (dot > 0) {
          finalName =
            `${originalName.slice(
              0,
              dot
            )}-${counter}${originalName.slice(dot)}`;
        } else {
          finalName =
            `${originalName}-${counter}`;
        }

        counter += 1;
      }

      const importedContent =
        typeof imported.content === 'string'
          ? imported.content
          : '';

      await addProjectFile(
        projectId,
        finalName,
        importedContent
      );

      const updatedProject =
        await getProject(projectId);

      const updatedFiles =
        updatedProject?.files || {};

      setFiles(updatedFiles);
      setActiveFile(finalName);
      setCode(importedContent);
      setSelection({
        start: 0,
        end: 0,
      });

      historyRef.current = [];
      redoRef.current = [];
      setDirty(false);
      setShowWelcome(false);

      notifyProjectUpdated(updatedProject);
    } catch (error) {
      Alert.alert(
        'Import impossible',
        'Le fichier n’a pas pu être importé.'
      );
    }
  }, [
    projectId,
    files,
    notifyProjectUpdated,
  ]);

  const requestDeleteFile = useCallback(
    (filename) => {
      if (!projectId || !filename) {
        return;
      }

      Alert.alert(
        'Supprimer le fichier',
        `Supprimer « ${filename} » ?`,
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
                  filename
                );

                const updatedProject =
                  await getProject(projectId);

                const updatedFiles =
                  updatedProject?.files || {};

                setFiles(updatedFiles);

                if (filename === activeFile) {
                  const remaining =
                    Object.keys(updatedFiles);

                  const nextFile =
                    remaining.length > 0
                      ? remaining.includes(
                          'index.html'
                        )
                        ? 'index.html'
                        : remaining[0]
                      : null;

                  setActiveFile(nextFile);

                  setCode(
                    nextFile
                      ? String(
                          updatedFiles[nextFile] || ''
                        )
                      : ''
                  );

                  setShowWelcome(!nextFile);
                  setDirty(false);
                  historyRef.current = [];
                  redoRef.current = [];
                }

                notifyProjectUpdated(
                  updatedProject
                );
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
    },
    [
      projectId,
      activeFile,
      notifyProjectUpdated,
    ]
  );

  const requestRenameFile = useCallback(
    (filename) => {
      if (!filename) {
        return;
      }

      setRenameTarget(filename);
      setRenameFileName(filename);
      setShowRenameModal(true);
    },
    []
  );

  const renameFile = useCallback(async () => {
    if (
      !projectId ||
      !renameTarget
    ) {
      return;
    }

    const cleanName = sanitizeFileName(
      renameFileName.trim()
    );

    if (!cleanName) {
      Alert.alert(
        'Nom invalide',
        'Entre un nom de fichier valide.'
      );
      return;
    }

    if (
      cleanName !== renameTarget &&
      Object.prototype.hasOwnProperty.call(
        files,
        cleanName
      )
    ) {
      Alert.alert(
        'Fichier existant',
        'Ce nom est déjà utilisé.'
      );
      return;
    }

    try {
      await renameProjectFile(
        projectId,
        renameTarget,
        cleanName
      );

      const updatedProject =
        await getProject(projectId);

      const updatedFiles =
        updatedProject?.files || {};

      setFiles(updatedFiles);

      if (activeFile === renameTarget) {
        setActiveFile(cleanName);
        setCode(
          String(
            updatedFiles[cleanName] || ''
          )
        );
      }

      setRenameTarget(null);
      setRenameFileName('');
      setShowRenameModal(false);
      setDirty(false);

      notifyProjectUpdated(updatedProject);
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Impossible de renommer le fichier.'
      );
    }
  }, [
    projectId,
    renameTarget,
    renameFileName,
    files,
    activeFile,
    notifyProjectUpdated,
  ]);

  const undo = useCallback(() => {
    const history = historyRef.current;

    if (!history.length) {
      return;
    }

    const previousCode =
      history[history.length - 1];

    historyRef.current =
      history.slice(0, -1);

    redoRef.current = [
      ...redoRef.current,
      code,
    ];

    setCode(previousCode);
    setDirty(true);
  }, [code]);

  const redo = useCallback(() => {
    const redoHistory = redoRef.current;

    if (!redoHistory.length) {
      return;
    }

    const nextCode =
      redoHistory[redoHistory.length - 1];

    redoRef.current =
      redoHistory.slice(0, -1);

    historyRef.current = [
      ...historyRef.current,
      code,
    ];

    setCode(nextCode);
    setDirty(true);
  }, [code]);

  const findNext = useCallback(() => {
    if (!searchText) {
      return;
    }

    const source = String(code || '');

    const startFrom =
      searchIndex >= 0
        ? searchIndex + searchText.length
        : 0;

    let index =
      source.indexOf(
        searchText,
        startFrom
      );

    if (index === -1) {
      index = source.indexOf(
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

    setSearchIndex(index);

    const nextSelection = {
      start: index,
      end: index + searchText.length,
    };

    setSelection(nextSelection);

    requestAnimationFrame(() => {
      editorRef.current?.focus();
    });
  }, [
    searchText,
    code,
    searchIndex,
  ]);

  const replaceCurrent = useCallback(() => {
    if (!searchText) {
      return;
    }

    const start =
      selection?.start ?? -1;

    const end =
      selection?.end ?? -1;

    if (
      start < 0 ||
      end < start ||
      String(code || '').slice(
        start,
        end
      ) !== searchText
    ) {
      findNext();
      return;
    }

    const nextCode =
      String(code || '').slice(0, start) +
      replaceText +
      String(code || '').slice(end);

    updateCode(nextCode);

    const nextPosition =
      start + replaceText.length;

    setSelection({
      start: nextPosition,
      end: nextPosition,
    });

    setSearchIndex(start);

    requestAnimationFrame(() => {
      editorRef.current?.focus();
    });
  }, [
    searchText,
    replaceText,
    selection,
    code,
    findNext,
    updateCode,
  ]);

  const replaceAll = useCallback(() => {
    if (!searchText) {
      return;
    }

    const source = String(code || '');

    if (!source.includes(searchText)) {
      Alert.alert(
        'Remplacement',
        'Aucune occurrence trouvée.'
      );
      return;
    }

    const escapedSearch =
      searchText.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );

    const nextCode =
      source.replace(
        new RegExp(
          escapedSearch,
          'g'
        ),
        replaceText
      );

    updateCode(nextCode);

    setSearchIndex(-1);

    setSelection({
      start: 0,
      end: 0,
    });
  }, [
    searchText,
    replaceText,
    code,
    updateCode,
  ]);

  const goPreview = useCallback(() => {
    if (typeof onPreview === 'function') {
      onPreview(project);
    }
  }, [onPreview, project]);

  const handleWelcomeAction = useCallback(
    (action) => {
      switch (action) {
        case 'new':
          setNewFileName('');
          setShowNewFileModal(true);
          break;

        case 'open':
          importFile();
          break;

        case 'folder':
          setShowWelcome(false);

          if (
            typeof onOpenProjects === 'function'
          ) {
            onOpenProjects();
          }
          break;

        case 'clone':
          Alert.alert(
            'Cloner un dépôt',
            'Le clonage Git distant nécessite une intégration Git native. GCODE ne simule pas cette fonction.'
          );
          break;

        case 'themes':
        case 'tools':
        case 'shortcuts':
          if (
            typeof onOpenSettings === 'function'
          ) {
            onOpenSettings();
          }
          break;

        case 'terminal':
          if (
            typeof onOpenTerminal === 'function'
          ) {
            onOpenTerminal(project);
          }
          break;

        case 'commands':
          if (
            typeof onOpenCommands === 'function'
          ) {
            onOpenCommands();
          }
          break;

        case 'ai':
          if (
            typeof onOpenAI === 'function'
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
      project,
    ]
  );

  const renderWelcome = () => (
    <View style={styles.welcome}>
      <ScrollView
        style={styles.welcomeScroll}
        contentContainerStyle={
          styles.welcomeContent
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.welcomeHero}>
          <View style={styles.welcomeBadge}>
            <Text style={styles.welcomeBadgeText}>
              GCODE MOBILE V3
            </Text>
          </View>

          <Text style={styles.welcomeTitle}>
            {currentProjectName}
          </Text>

          <Text style={styles.welcomeSubtitle}>
            Ton espace de développement mobile.
            Crée, ouvre, modifie et prévisualise
            réellement tes fichiers directement
            dans GCODE.
          </Text>

          <View style={styles.welcomeGrid}>
            <Pressable
              onPress={() =>
                handleWelcomeAction('new')
              }
              style={({ pressed }) => [
                styles.welcomeAction,
                pressed && {
                  opacity: 0.82,
                  transform: [
                    { scale: 0.97 },
                  ],
                },
              ]}
            >
              <Text style={styles.welcomeActionTitle}>
                ＋ Nouveau fichier
              </Text>

              <Text style={styles.welcomeActionText}>
                Créer un fichier dans le projet.
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                handleWelcomeAction('open')
              }
              style={({ pressed }) => [
                styles.welcomeAction,
                pressed && {
                  opacity: 0.82,
                  transform: [
                    { scale: 0.97 },
                  ],
                },
              ]}
            >
              <Text style={styles.welcomeActionTitle}>
                ↥ Importer
              </Text>

              <Text style={styles.welcomeActionText}>
                Importer un fichier existant.
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                handleWelcomeAction('folder')
              }
              style={({ pressed }) => [
                styles.welcomeAction,
                pressed && {
                  opacity: 0.82,
                  transform: [
                    { scale: 0.97 },
                  ],
                },
              ]}
            >
              <Text style={styles.welcomeActionTitle}>
                ◫ Projets
              </Text>

              <Text style={styles.welcomeActionText}>
                Retourner à ton espace projets.
              </Text>
            </Pressable>

            <Pressable
              onPress={goPreview}
              style={({ pressed }) => [
                styles.welcomeAction,
                pressed && {
                  opacity: 0.82,
                  transform: [
                    { scale: 0.97 },
                  ],
                },
              ]}
            >
              <Text style={styles.welcomeActionTitle}>
                ▶ Preview
              </Text>

              <Text style={styles.welcomeActionText}>
                Prévisualiser réellement le projet.
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                handleWelcomeAction('terminal')
              }
              style={({ pressed }) => [
                styles.welcomeAction,
                pressed && {
                  opacity: 0.82,
                  transform: [
                    { scale: 0.97 },
                  ],
                },
              ]}
            >
              <Text style={styles.welcomeActionTitle}>
                › Terminal
              </Text>

              <Text style={styles.welcomeActionText}>
                Ouvrir le terminal du projet.
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                handleWelcomeAction('commands')
              }
              style={({ pressed }) => [
                styles.welcomeAction,
                pressed && {
                  opacity: 0.82,
                  transform: [
                    { scale: 0.97 },
                  ],
                },
              ]}
            >
              <Text style={styles.welcomeActionTitle}>
                ⌘ Commandes
              </Text>

              <Text style={styles.welcomeActionText}>
                Consulter les commandes disponibles.
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                handleWelcomeAction('themes')
              }
              style={({ pressed }) => [
                styles.welcomeAction,
                pressed && {
                  opacity: 0.82,
                  transform: [
                    { scale: 0.97 },
                  ],
                },
              ]}
            >
              <Text style={styles.welcomeActionTitle}>
                ◐ Apparence
              </Text>

              <Text style={styles.welcomeActionText}>
                Personnaliser le thème et l'éditeur.
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                handleWelcomeAction('ai')
              }
              style={({ pressed }) => [
                styles.welcomeAction,
                pressed && {
                  opacity: 0.82,
                  transform: [
                    { scale: 0.97 },
                  ],
                },
              ]}
            >
              <Text style={styles.welcomeActionTitle}>
                ✦ GCODE AI
              </Text>

              <Text style={styles.welcomeActionText}>
                Ouvrir l'espace AI de GCODE.
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Projet local
          </Text>

          <Text style={styles.infoText}>
            {fileNames.length} fichier
            {fileNames.length !== 1 ? 's' : ''}{' '}
            disponible
            {fileNames.length !== 1 ? 's' : ''}.
            Sélectionne un fichier dans
            l'explorateur pour commencer.
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  const renderEditor = () => (
    <View style={styles.editorContainer}>
      <View style={styles.editorHeader}>
        <Text
          style={styles.editorHeaderTitle}
          numberOfLines={1}
        >
          {getFileIcon(activeFile)}{' '}
          {activeFile || 'Aucun fichier'}
        </Text>

        <Text style={styles.editorStatus}>
          {saving
            ? 'Sauvegarde…'
            : dirty
              ? 'Modifié'
              : 'Synchronisé'}
        </Text>
      </View>

      <View style={styles.editorBody}>
        {editorSettings.lineNumbers && (
          <View style={styles.lineNumbersContainer}>
            <ScrollView
              ref={lineScrollRef}
              style={styles.lineNumbersScroll}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={styles.lineNumbersContent}
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
          </View>
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
          selection={selection}
          style={styles.codeInput}
          multiline
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          keyboardType="default"
          textAlignVertical="top"
          scrollEnabled
          editable={Boolean(activeFile)}
          placeholder={
            activeFile
              ? 'Commence à écrire ton code…'
              : 'Sélectionne un fichier'
          }
          placeholderTextColor={
            colors.textMuted
          }
          onScroll={(event) => {
            const y =
              event.nativeEvent.contentOffset.y;

            lineScrollRef.current?.scrollTo({
              y,
              animated: false,
            });
          }}
        />
      </View>
    </View>
  );

  const renderExplorer = () => (
    <View style={styles.explorerContainer}>
      <FileExplorer
        project={{
          ...project,
          files,
        }}
        activeFile={activeFile}
        onOpenFile={openFile}
        onCreateFile={() => {
          setNewFileName('');
          setShowNewFileModal(true);
        }}
        onCreateFolder={() => {
          Alert.alert(
            'Dossiers',
            'La création de dossiers physiques est gérée par la synchronisation du projet.'
          );
        }}
        onRenameFile={requestRenameFile}
        onDeleteFile={requestDeleteFile}
        onRenameFolder={() => {
          Alert.alert(
            'Dossiers',
            'Le renommage des dossiers est disponible lorsque la structure de dossiers est persistée.'
          );
        }}
        onDeleteFolder={() => {
          Alert.alert(
            'Dossiers',
            'La suppression des dossiers est disponible lorsque la structure de dossiers est persistée.'
          );
        }}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>
            Chargement du projet…
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
          onPress={onBack}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && {
              opacity: 0.78,
              transform: [
                { scale: 0.94 },
              ],
            },
          ]}
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
            {currentProjectName}
          </Text>

          <Text
            style={styles.fileTitle}
            numberOfLines={1}
          >
            {showWelcome
              ? 'Workbench'
              : activeFile || 'Aucun fichier'}
            {dirty ? (
              <Text style={styles.dirtyText}>
                {' '}•
              </Text>
            ) : null}
          </Text>
        </View>

        <Pressable
          onPress={goPreview}
          style={({ pressed }) => [
            styles.previewButton,
            pressed && {
              opacity: 0.82,
              transform: [
                { scale: 0.95 },
              ],
            },
          ]}
        >
          <Text style={styles.previewButtonText}>
            ▶ Preview
          </Text>
        </Pressable>
      </View>

      <View style={styles.toolbar}>
        <ScrollView
          horizontal
          style={styles.toolbarScroll}
          contentContainerStyle={
            styles.toolbarContent
          }
          showsHorizontalScrollIndicator={false}
        >
          <Pressable
            onPress={() =>
              setShowExplorer(
                (value) => !value
              )
            }
            style={({ pressed }) => [
              styles.toolbarButton,
              showExplorer &&
                styles.toolbarButtonActive,
              pressed && {
                opacity: 0.78,
                transform: [
                  { scale: 0.94 },
                ],
              },
            ]}
          >
            <Text style={styles.toolbarButtonText}>
              ☰ Explorer
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setShowWelcome(true)}
            style={({ pressed }) => [
              styles.toolbarButton,
              pressed && {
                opacity: 0.78,
                transform: [
                  { scale: 0.94 },
                ],
              },
            ]}
          >
            <Text style={styles.toolbarButtonText}>
              ⌂
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setNewFileName('');
              setShowNewFileModal(true);
            }}
            style={({ pressed }) => [
              styles.toolbarButton,
              pressed && {
                opacity: 0.78,
                transform: [
                  { scale: 0.94 },
                ],
              },
            ]}
          >
            <Text style={styles.toolbarButtonText}>
              ＋ New
            </Text>
          </Pressable>

          <Pressable
            onPress={importFile}
            style={({ pressed }) => [
              styles.toolbarButton,
              pressed && {
                opacity: 0.78,
                transform: [
                  { scale: 0.94 },
                ],
              },
            ]}
          >
            <Text style={styles.toolbarButtonText}>
              ↥ Open
            </Text>
          </Pressable>

          <Pressable
            onPress={() => saveCurrentFile(false)}
            disabled={!activeFile || saving}
            style={({ pressed }) => [
              styles.toolbarButton,
              (!activeFile || saving) &&
                styles.toolbarButtonDisabled,
              pressed && {
                opacity: 0.78,
                transform: [
                  { scale: 0.94 },
                ],
              },
            ]}
          >
            <Text style={styles.toolbarButtonText}>
              {saving ? '…' : 'Save'}
            </Text>
          </Pressable>

          <Pressable
            onPress={undo}
            disabled={!historyRef.current.length}
            style={({ pressed }) => [
              styles.toolbarButton,
              !historyRef.current.length &&
                styles.toolbarButtonDisabled,
              pressed && {
                opacity: 0.78,
                transform: [
                  { scale: 0.94 },
                ],
              },
            ]}
          >
            <Text style={styles.toolbarButtonText}>
              ↶
            </Text>
          </Pressable>

          <Pressable
            onPress={redo}
            disabled={!redoRef.current.length}
            style={({ pressed }) => [
              styles.toolbarButton,
              !redoRef.current.length &&
                styles.toolbarButtonDisabled,
              pressed && {
                opacity: 0.78,
                transform: [
                  { scale: 0.94 },
                ],
              },
            ]}
          >
            <Text style={styles.toolbarButtonText}>
              ↷
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              setShowSearch(
                (value) => !value
              )
            }
            style={({ pressed }) => [
              styles.toolbarButton,
              showSearch &&
                styles.toolbarButtonActive,
              pressed && {
                opacity: 0.78,
                transform: [
                  { scale: 0.94 },
                ],
              },
            ]}
          >
            <Text style={styles.toolbarButtonText}>
              ⌕ Find
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              typeof onOpenTerminal ===
              'function'
                ? onOpenTerminal(project)
                : null
            }
            style={({ pressed }) => [
              styles.toolbarButton,
              pressed && {
                opacity: 0.78,
                transform: [
                  { scale: 0.94 },
                ],
              },
            ]}
          >
            <Text style={styles.toolbarButtonText}>
              › Terminal
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              typeof onOpenCommands ===
              'function'
                ? onOpenCommands()
                : null
            }
            style={({ pressed }) => [
              styles.toolbarButton,
              pressed && {
                opacity: 0.78,
                transform: [
                  { scale: 0.94 },
                ],
              },
            ]}
          >
            <Text style={styles.toolbarButtonText}>
              ⌘ Commands
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {showSearch && (
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
                colors.textMuted
              }
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={findNext}
            />

            <Pressable
              onPress={findNext}
              style={({ pressed }) => [
                styles.searchAction,
                pressed && {
                  opacity: 0.78,
                  transform: [
                    { scale: 0.94 },
                  ],
                },
              ]}
            >
              <Text style={styles.searchActionText}>
                ↓
              </Text>
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <TextInput
              value={replaceText}
              onChangeText={setReplaceText}
              placeholder="Remplacer par…"
              placeholderTextColor={
                colors.textMuted
              }
              style={[
                styles.searchInput,
                styles.searchInputSecondary,
              ]}
              autoCorrect={false}
              autoCapitalize="none"
            />

            <Pressable
              onPress={replaceCurrent}
              style={({ pressed }) => [
                styles.searchAction,
                pressed && {
                  opacity: 0.78,
                  transform: [
                    { scale: 0.94 },
                  ],
                },
              ]}
            >
              <Text style={styles.searchActionText}>
                ↔
              </Text>
            </Pressable>

            <Pressable
              onPress={replaceAll}
              style={({ pressed }) => [
                styles.searchAction,
                pressed && {
                  opacity: 0.78,
                  transform: [
                    { scale: 0.94 },
                  ],
                },
              ]}
            >
              <Text style={styles.searchActionText}>
                ↕
              </Text>
            </Pressable>
          </View>

          <Text style={styles.searchInfo}>
            Recherche dans le fichier actuellement
            ouvert.
          </Text>
        </View>
      )}

      <View style={styles.workspace}>
        {showExplorer && renderExplorer()}

        {showWelcome
          ? renderWelcome()
          : renderEditor()}
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
              Exemple : index.html, app.js,
              styles.css
            </Text>

            <TextInput
              value={newFileName}
              onChangeText={setNewFileName}
              placeholder="Nom du fichier"
              placeholderTextColor={
                colors.textMuted
              }
              style={styles.modalInput}
              autoCorrect={false}
              autoCapitalize="none"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={createFile}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setNewFileName('');
                  setShowNewFileModal(false);
                }}
                style={({ pressed }) => [
                  styles.modalButton,
                  pressed && {
                    opacity: 0.78,
                    transform: [
                      { scale: 0.96 },
                    ],
                  },
                ]}
              >
                <Text style={styles.modalButtonText}>
                  Annuler
                </Text>
              </Pressable>

              <Pressable
                onPress={createFile}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  pressed && {
                    opacity: 0.82,
                    transform: [
                      { scale: 0.96 },
                    ],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    styles.modalButtonPrimaryText,
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

            <Text style={styles.modalSubtitle}>
              Le contenu du fichier sera conservé.
            </Text>

            <TextInput
              value={renameFileName}
              onChangeText={setRenameFileName}
              placeholder="Nouveau nom"
              placeholderTextColor={
                colors.textMuted
              }
              style={styles.modalInput}
              autoCorrect={false}
              autoCapitalize="none"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={renameFile}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setRenameTarget(null);
                  setRenameFileName('');
                  setShowRenameModal(false);
                }}
                style={({ pressed }) => [
                  styles.modalButton,
                  pressed && {
                    opacity: 0.78,
                    transform: [
                      { scale: 0.96 },
                    ],
                  },
                ]}
              >
                <Text style={styles.modalButtonText}>
                  Annuler
                </Text>
              </Pressable>

              <Pressable
                onPress={renameFile}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  pressed && {
                    opacity: 0.82,
                    transform: [
                      { scale: 0.96 },
                    ],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    styles.modalButtonPrimaryText,
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
