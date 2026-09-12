import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  KeyboardAvoidingView,
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
  loadProjects,
  saveProjectFile,
  addProjectFile,
  deleteProjectFile,
} from '../storage/projectStorage';

import {
  executeCommand as executeNativeCommand,
  stopCommand as stopNativeCommand,
} from '../../modules/gcode-terminal/src/GcodeTerminal';

import {
  ensureProjectDirectory,
  syncProjectToFilesystem,
} from '../storage/projectFileSystem';

function uriToPath(uri) {
  if (!uri) {
    return '';
  }

  let value = String(uri);

  if (value.startsWith('file://')) {
    value = value.slice('file://'.length);
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizePath(path) {
  if (!path) {
    return '';
  }

  const parts = String(path)
    .replace(/\\/g, '/')
    .split('/');

  const result = [];

  for (const part of parts) {
    if (!part || part === '.') {
      continue;
    }

    if (part === '..') {
      if (result.length > 0) {
        result.pop();
      }

      continue;
    }

    result.push(part);
  }

  return '/' + result.join('/');
}

function resolveDirectoryPath(
  currentPath,
  target
) {
  if (!target || target === '.') {
    return currentPath;
  }

  if (target === '/') {
    return '/';
  }

  if (target.startsWith('/')) {
    return normalizePath(target);
  }

  return normalizePath(
    `${currentPath}/${target}`
  );
}

function GlassButton({
  children,
  onPress,
  colors,
  radius,
  danger = false,
  disabled = false,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.glassButton,
        {
          backgroundColor: danger
            ? colors.dangerSoft
            : colors.glassStrong,

          borderColor: danger
            ? colors.danger
            : colors.border,

          borderRadius: radius.pill,

          opacity: disabled
            ? 0.45
            : pressed
            ? 0.68
            : 1,

          transform: [
            {
              scale: pressed
                ? 0.96
                : 1,
            },
          ],
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

export default function TerminalScreen({
  project,
  projects = [],
  onBack,
  onProjectUpdated,
}) {
  const { theme } = useTheme();

  const {
    colors,
    spacing,
    radius,
  } = theme;

  const scrollRef =
    useRef(null);

  const inputRef =
    useRef(null);

  const [currentProject, setCurrentProject] =
    useState(project || null);

  const [input, setInput] =
    useState('');

  const [output, setOutput] =
    useState([
      'GCODE Terminal V3',
      'Terminal natif Android activé.',
      'Le terminal utilise maintenant le système de fichiers physique du projet.',
      'Tape "help" pour tester les commandes disponibles.',
      '',
    ]);

  const [history, setHistory] =
    useState([]);

  const [historyIndex, setHistoryIndex] =
    useState(-1);

  const [cwd, setCwd] =
    useState('');

  const [projectRoot, setProjectRoot] =
    useState('');

  const [running, setRunning] =
    useState(false);

  useEffect(() => {
    if (!project) {
      return;
    }

    setCurrentProject(project);

    initializeProjectFilesystem(
      project
    );
  }, [project]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({
        animated: true,
      });
    }, 50);

    return () => {
      clearTimeout(timer);
    };
  }, [output]);

  const appendOutput = (
    lines
  ) => {
    const normalized =
      Array.isArray(lines)
        ? lines
        : [String(lines)];

    setOutput(
      (currentOutput) => [
        ...currentOutput,
        ...normalized,
        '',
      ]
    );
  };

  const initializeProjectFilesystem =
    async (activeProject) => {
      try {
        if (!activeProject?.id) {
          return;
        }

        const directory =
          ensureProjectDirectory(
            activeProject.id
          );

        syncProjectToFilesystem(
          activeProject
        );

        const physicalPath =
          uriToPath(
            directory.uri
          );

        setProjectRoot(
          physicalPath
        );

        setCwd(
          physicalPath
        );
      } catch (error) {
        console.error(
          'Erreur filesystem GCODE:',
          error
        );

        appendOutput([
          'Filesystem error:',
          error?.message ||
            'Impossible d’initialiser le dossier du projet.',
        ]);
      }
    };

  const getProject =
    async () => {
      if (currentProject) {
        return currentProject;
      }

      if (projects.length > 0) {
        const firstProject =
          projects[0];

        setCurrentProject(
          firstProject
        );

        await initializeProjectFilesystem(
          firstProject
        );

        return firstProject;
      }

      const storedProjects =
        await loadProjects();

      if (storedProjects.length > 0) {
        const firstProject =
          storedProjects[0];

        setCurrentProject(
          firstProject
        );

        await initializeProjectFilesystem(
          firstProject
        );

        return firstProject;
      }

      return null;
    };

  const updateProjectState =
    async (projectId) => {
      const storedProjects =
        await loadProjects();

      const updatedProject =
        storedProjects.find(
          (item) =>
            item.id === projectId
        );

      if (!updatedProject) {
        return null;
      }

      setCurrentProject(
        updatedProject
      );

      try {
        syncProjectToFilesystem(
          updatedProject
        );
      } catch (error) {
        console.error(
          'Erreur synchronisation filesystem:',
          error
        );
      }

      if (
        typeof onProjectUpdated ===
        'function'
      ) {
        await onProjectUpdated(
          updatedProject
        );
      }

      return updatedProject;
    };

  const handleCreateFile =
    async (
      fileName,
      content = ''
    ) => {
      const activeProject =
        await getProject();

      if (!activeProject?.id) {
        throw new Error(
          'Aucun projet actif.'
        );
      }

      await addProjectFile(
        activeProject.id,
        fileName,
        content
      );

      syncProjectToFilesystem({
        ...activeProject,
        files: {
          ...(activeProject.files || {}),
          [fileName]: content,
        },
      });

      return updateProjectState(
        activeProject.id
      );
    };

  const handleDeleteFile =
    async (fileName) => {
      const activeProject =
        await getProject();

      if (!activeProject?.id) {
        throw new Error(
          'Aucun projet actif.'
        );
      }

      await deleteProjectFile(
        activeProject.id,
        fileName
      );

      return updateProjectState(
        activeProject.id
      );
    };

  const handleWriteFile =
    async (
      fileName,
      content
    ) => {
      const activeProject =
        await getProject();

      if (!activeProject?.id) {
        throw new Error(
          'Aucun projet actif.'
        );
      }

      const exists =
        Object.prototype.hasOwnProperty.call(
          activeProject.files || {},
          fileName
        );

      if (exists) {
        await saveProjectFile(
          activeProject.id,
          fileName,
          content
        );
      } else {
        await addProjectFile(
          activeProject.id,
          fileName,
          content
        );
      }

      return updateProjectState(
        activeProject.id
      );
    };

  const executeNative =
    async (
      command,
      workingDirectory
    ) => {
      return executeNativeCommand(
        command,
        workingDirectory ||
          undefined,
        {
          GCODE_PROJECT_ID:
            String(
              currentProject?.id || ''
            ),

          GCODE_PROJECT_NAME:
            String(
              currentProject?.name || ''
            ),

          GCODE_PROJECT_ROOT:
            String(
              projectRoot || ''
            ),
        }
      );
    };

  const executeCdCommand =
    async (
      trimmed
    ) => {
      const match =
        trimmed.match(
          /^cd(?:\s+(.+))?$/
        );

      if (!match) {
        return false;
      }

      const target =
        (match[1] || '').trim();

      if (
        !target ||
        target === '~'
      ) {
        setCwd(
          projectRoot
        );

        appendOutput([
          `CWD: ${projectRoot}`,
        ]);

        return true;
      }

      if (
        target === '..' &&
        cwd === projectRoot
      ) {
        appendOutput([
          'cd: impossible de sortir du dossier du projet.',
        ]);

        return true;
      }

      const nextPath =
        resolveDirectoryPath(
          cwd || projectRoot,
          target
        );

      if (
        !nextPath.startsWith(
          projectRoot
        )
      ) {
        appendOutput([
          'cd: accès en dehors du dossier du projet refusé.',
        ]);

        return true;
      }

      const escapedPath =
        nextPath.replace(
          /'/g,
          "'\\''"
        );

      const check =
        await executeNativeCommand(
          `test -d '${escapedPath}'`,
          projectRoot,
          {
            GCODE_PROJECT_ROOT:
              projectRoot,
          }
        );

      if (!check.success) {
        appendOutput([
          `cd: dossier introuvable: ${target}`,
        ]);

        return true;
      }

      setCwd(
        nextPath
      );

      appendOutput([
        `CWD: ${nextPath}`,
      ]);

      return true;
    };

  const executeCommand =
    async (command) => {
      const trimmed =
        command.trim();

      if (
        !trimmed ||
        running
      ) {
        return;
      }

      setHistory(
        (currentHistory) => [
          ...currentHistory,
          trimmed,
        ]
      );

      setHistoryIndex(-1);

      const activeProject =
        await getProject();

      if (!activeProject) {
        appendOutput([
          `> ${trimmed}`,
          'Aucun projet disponible.',
          'Crée d’abord un projet.',
        ]);

        return;
      }

      if (!projectRoot) {
        await initializeProjectFilesystem(
          activeProject
        );
      }

      setRunning(true);

      setOutput(
        (currentOutput) => [
          ...currentOutput,
          `> ${trimmed}`,
        ]
      );

      try {
        if (
          /^cd(?:\s+.*)?$/.test(
            trimmed
          )
        ) {
          await executeCdCommand(
            trimmed
          );

          return;
        }

        const result =
          await executeNative(
            trimmed,
            cwd || projectRoot
          );

        const stdout =
          typeof result?.stdout ===
          'string'
            ? result.stdout
            : '';

        const stderr =
          typeof result?.stderr ===
          'string'
            ? result.stderr
            : '';

        const exitCode =
          typeof result?.exitCode ===
          'number'
            ? result.exitCode
            : -1;

        if (stdout) {
          appendOutput(
            stdout.replace(
              /\n$/,
              ''
            )
          );
        }

        if (stderr) {
          appendOutput(
            stderr.replace(
              /\n$/,
              ''
            )
          );
        }

        appendOutput([
          `[Process exited with code ${exitCode}]`,
        ]);

        if (activeProject.id) {
          await updateProjectState(
            activeProject.id
          );
        }
      } catch (error) {
        console.error(
          'Erreur Terminal GCODE:',
          error
        );

        appendOutput([
          'Terminal error:',
          error?.message ||
            'Impossible d’exécuter la commande.',
          '[Process exited with code -1]',
        ]);
      } finally {
        setRunning(false);

        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }
    };

  const handleSubmit =
    async () => {
      if (running) {
        return;
      }

      const command =
        input;

      setInput('');

      await executeCommand(
        command
      );
    };

  const handleStop =
    async () => {
      try {
        const stopped =
          await stopNativeCommand();

        if (stopped) {
          appendOutput([
            '^C',
            'Processus arrêté.',
          ]);
        } else {
          appendOutput([
            'Aucun processus actif.',
          ]);
        }
      } catch (error) {
        appendOutput([
          'Erreur lors de l’arrêt du processus:',
          error?.message ||
            'Impossible d’arrêter le processus.',
        ]);
      } finally {
        setRunning(false);

        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }
    };

  const handleHistoryUp =
    () => {
      if (history.length === 0) {
        return;
      }

      const nextIndex =
        historyIndex < 0
          ? history.length - 1
          : Math.max(
              historyIndex - 1,
              0
            );

      setHistoryIndex(
        nextIndex
      );

      setInput(
        history[nextIndex] ||
          ''
      );
    };

  const handleHistoryDown =
    () => {
      if (
        history.length === 0 ||
        historyIndex < 0
      ) {
        return;
      }

      const nextIndex =
        historyIndex + 1;

      if (
        nextIndex >=
        history.length
      ) {
        setHistoryIndex(-1);
        setInput('');
        return;
      }

      setHistoryIndex(
        nextIndex
      );

      setInput(
        history[nextIndex] ||
          ''
      );
    };

  const handleClear =
    () => {
      setOutput([
        'GCODE Terminal V3',
        'Terminal natif Android.',
        `Projet : ${
          currentProject?.name ||
          'Aucun projet'
        }`,
        `CWD : ${
          cwd ||
          projectRoot ||
          '/'
        }`,
        '',
      ]);
    };

  const projectName =
    currentProject?.name ||
    'Aucun projet';

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
              colors.glassStrong,

            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <GlassButton
          onPress={onBack}
          colors={colors}
          radius={radius}
        >
          <Text
            style={[
              styles.backText,
              {
                color:
                  colors.text,
              },
            ]}
          >
            ‹
          </Text>
        </GlassButton>

        <View
          style={
            styles.headerCenter
          }
        >
          <Text
            style={[
              styles.title,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Terminal
          </Text>

          <Text
            style={[
              styles.project,
              {
                color:
                  colors.textSecondary,
              },
            ]}
            numberOfLines={1}
          >
            {projectName}
          </Text>
        </View>

        {running ? (
          <GlassButton
            onPress={
              handleStop
            }
            colors={colors}
            radius={radius}
            danger
          >
            <Text
              style={[
                styles.actionText,
                {
                  color:
                    colors.danger,
                },
              ]}
            >
              Stop
            </Text>
          </GlassButton>
        ) : (
          <GlassButton
            onPress={
              handleClear
            }
            colors={colors}
            radius={radius}
          >
            <Text
              style={[
                styles.actionText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Clear
            </Text>
          </GlassButton>
        )}
      </View>

      {/* CWD */}

      <View
        style={[
          styles.cwdCard,
          {
            backgroundColor:
              colors.glass,

            borderColor:
              colors.border,

            borderRadius:
              radius.lg,
          },
        ]}
      >
        <View
          style={[
            styles.cwdBadge,
            {
              backgroundColor:
                colors.primarySoft,

              borderColor:
                colors.border,

              borderRadius:
                radius.pill,
            },
          ]}
        >
          <Text
            style={[
              styles.cwdLabel,
              {
                color:
                  colors.primary,
              },
            ]}
          >
            CWD
          </Text>
        </View>

        <Text
          style={[
            styles.cwdText,
            {
              color:
                colors.editorText,
            },
          ]}
          numberOfLines={1}
        >
          {cwd ||
            projectRoot ||
            '/'}
        </Text>
      </View>

      {/* TERMINAL OUTPUT */}

      <View
        style={[
          styles.outputShell,
          {
            backgroundColor:
              colors.editorBackground,

            borderColor:
              colors.border,

            borderRadius:
              radius.xl,
          },
        ]}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.output}
          contentContainerStyle={
            styles.outputContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          {output.map(
            (line, index) => {
              const lower =
                line.toLowerCase();

              const isCommand =
                line.startsWith(
                  '> '
                );

              const isError =
                lower.includes(
                  'error'
                ) ||
                lower.includes(
                  'not found'
                ) ||
                lower.includes(
                  'permission denied'
                ) ||
                lower.includes(
                  'introuvable'
                ) ||
                lower.includes(
                  'refusé'
                );

              const isExit =
                line.startsWith(
                  '[Process exited'
                );

              return (
                <Text
                  key={`${index}-${line}`}
                  style={[
                    styles.outputLine,
                    {
                      color:
                        isCommand
                          ? colors.primary
                          : isError
                          ? colors.danger
                          : isExit
                          ? colors.textMuted
                          : colors.editorText,
                    },
                  ]}
                >
                  {line || ' '}
                </Text>
              );
            }
          )}
        </ScrollView>
      </View>

      {/* INPUT */}

      <View
        style={[
          styles.inputCard,
          {
            backgroundColor:
              colors.glassStrong,

            borderColor:
              colors.borderStrong,

            borderRadius:
              radius.xl,
          },
        ]}
      >
        <View
          style={[
            styles.promptBadge,
            {
              backgroundColor:
                running
                  ? colors.glassSoft
                  : colors.primarySoft,

              borderColor:
                colors.border,

              borderRadius:
                radius.pill,
            },
          ]}
        >
          <Text
            style={[
              styles.prompt,
              {
                color:
                  running
                    ? colors.textMuted
                    : colors.primary,
              },
            ]}
          >
            $
          </Text>
        </View>

        <TextInput
          ref={inputRef}
          value={input}
          onChangeText={
            setInput
          }
          onSubmitEditing={
            handleSubmit
          }
          onKeyPress={(event) => {
            const key =
              event.nativeEvent.key;

            if (
              key ===
              'ArrowUp'
            ) {
              handleHistoryUp();
            }

            if (
              key ===
              'ArrowDown'
            ) {
              handleHistoryDown();
            }

            if (
              key ===
              'Escape'
            ) {
              handleStop();
            }
          }}
          placeholder={
            running
              ? 'Commande en cours...'
              : 'Entrer une commande...'
          }
          placeholderTextColor={
            colors.textMuted
          }
          editable={!running}
          style={[
            styles.input,
            {
              color:
                colors.text,
            },
          ]}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          returnKeyType="send"
          blurOnSubmit={false}
        />

        <Pressable
          onPress={
            running
              ? handleStop
              : handleSubmit
          }
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor:
                running
                  ? colors.dangerSoft
                  : colors.primarySoft,

              borderColor:
                running
                  ? colors.danger
                  : colors.border,

              borderRadius:
                radius.pill,

              opacity:
                pressed ? 0.65 : 1,

              transform: [
                {
                  scale:
                    pressed
                      ? 0.93
                      : 1,
                },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.sendButtonText,
              {
                color:
                  running
                    ? colors.danger
                    : colors.primary,
              },
            ]}
          >
            {running
              ? '■'
              : '→'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },

    header: {
      minHeight: 70,
      paddingHorizontal: 12,
      paddingVertical: 9,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth:
        StyleSheet.hairlineWidth,
    },

    glassButton: {
      minWidth: 42,
      height: 40,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth:
        StyleSheet.hairlineWidth,
      elevation: 2,
    },

    backText: {
      fontSize: 31,
      lineHeight: 34,
      fontWeight: '400',
    },

    headerCenter: {
      flex: 1,
      marginHorizontal: 12,
      minWidth: 0,
    },

    title: {
      fontSize: 17,
      fontWeight: '900',
    },

    project: {
      marginTop: 2,
      fontSize: 10,
      fontWeight: '650',
    },

    actionText: {
      fontSize: 10,
      fontWeight: '850',
    },

    cwdCard: {
      minHeight: 46,
      marginHorizontal: 10,
      marginTop: 9,
      paddingHorizontal: 9,
      paddingVertical: 7,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth:
        StyleSheet.hairlineWidth,
      elevation: 2,
    },

    cwdBadge: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      marginRight: 8,
      borderWidth:
        StyleSheet.hairlineWidth,
    },

    cwdLabel: {
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 1,
    },

    cwdText: {
      flex: 1,
      fontSize: 10,
      fontFamily:
        Platform.OS === 'ios'
          ? 'Menlo'
          : 'monospace',
    },

    outputShell: {
      flex: 1,
      margin: 10,
      overflow: 'hidden',
      borderWidth:
        StyleSheet.hairlineWidth,
      elevation: 3,
    },

    output: {
      flex: 1,
    },

    outputContent: {
      padding: 14,
      paddingBottom: 28,
    },

    outputLine: {
      fontSize: 12,
      lineHeight: 19,
      fontFamily:
        Platform.OS === 'ios'
          ? 'Menlo'
          : 'monospace',
    },

    inputCard: {
      minHeight: 68,
      marginHorizontal: 10,
      marginBottom: 10,
      paddingHorizontal: 9,
      paddingVertical: 9,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth:
        StyleSheet.hairlineWidth,
      elevation: 5,
    },

    promptBadge: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth:
        StyleSheet.hairlineWidth,
    },

    prompt: {
      fontSize: 15,
      fontWeight: '900',
    },

    input: {
      flex: 1,
      minHeight: 44,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 12,
      fontFamily:
        Platform.OS === 'ios'
          ? 'Menlo'
          : 'monospace',
    },

    sendButton: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth:
        StyleSheet.hairlineWidth,
    },

    sendButtonText: {
      fontSize: 17,
      fontWeight: '900',
    },
  });
