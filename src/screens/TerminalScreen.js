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
  getProjectDirectoryUri,
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

function resolveDirectoryPath(currentPath, target) {
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

export default function TerminalScreen({
  project,
  projects = [],
  onBack,
  onProjectUpdated,
}) {
  const { colors } = useTheme();

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

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

    initializeProjectFilesystem(project);
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

  const initializeProjectFilesystem = async (
    activeProject
  ) => {
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

  const getProject = async () => {
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

  const updateProjectState = async (
    projectId
  ) => {
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

  const handleCreateFile = async (
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

    const directory =
      ensureProjectDirectory(
        activeProject.id
      );

    syncProjectToFilesystem(
      {
        ...activeProject,
        files: {
          ...(activeProject.files || {}),
          [fileName]: content,
        },
      }
    );

    return updateProjectState(
      activeProject.id
    );
  };

  const handleDeleteFile = async (
    fileName
  ) => {
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

  const handleWriteFile = async (
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

  const executeNative = async (
    command,
    workingDirectory
  ) => {
    return executeNativeCommand(
      command,
      workingDirectory || undefined,
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

  const executeCdCommand = async (
    trimmed,
    activeProject
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

    if (!target || target === '~') {
      setCwd(projectRoot);

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

    const check =
      await executeNativeCommand(
        `test -d '${nextPath.replace(
          /'/g,
          "'\\''"
        )}'`,
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

    setCwd(nextPath);

    appendOutput([
      `CWD: ${nextPath}`,
    ]);

    return true;
  };

  const executeCommand = async (
    command
  ) => {
    const trimmed =
      command.trim();

    if (!trimmed || running) {
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
      /*
       * cd est géré par GCODE afin que le
       * répertoire courant reste persistant
       * entre deux commandes.
       */
      if (
        /^cd(?:\s+.*)?$/.test(
          trimmed
        )
      ) {
        await executeCdCommand(
          trimmed,
          activeProject
        );

        return;
      }

      /*
       * Toutes les autres commandes sont
       * exécutées réellement par le shell
       * Android dans le dossier physique
       * du projet.
       */
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

      /*
       * Le terminal peut avoir créé/modifié
       * des fichiers physiques.
       *
       * On recharge ensuite les métadonnées
       * du projet pour conserver la cohérence
       * de GCODE.
       */
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

  const handleSubmit = async () => {
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

  const handleStop = async () => {
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
    }
  };

  const handleHistoryUp = () => {
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
      history[nextIndex] || ''
    );
  };

  const handleHistoryDown = () => {
    if (history.length === 0) {
      return;
    }

    if (historyIndex < 0) {
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
      history[nextIndex] || ''
    );
  };

  const handleClear = () => {
    setOutput([
      'GCODE Terminal V3',
      'Terminal natif Android.',
      `Projet : ${
        currentProject?.name ||
        'Aucun projet'
      }`,
      `CWD : ${
        cwd || projectRoot || '/'
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
      <View
        style={[
          styles.header,
          {
            backgroundColor:
              colors.backgroundElevated,
            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <Pressable
          onPress={onBack}
          style={[
            styles.backButton,
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
              styles.backText,
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
            styles.headerCenter
          }
        >
          <Text
            style={[
              styles.title,
              {
                color:
                  colors.textStrong,
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
                  colors.muted,
              },
            ]}
            numberOfLines={1}
          >
            {projectName}
          </Text>
        </View>

        {running ? (
          <Pressable
            onPress={
              handleStop
            }
            style={[
              styles.stopButton,
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
                styles.stopText,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Stop
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={
              handleClear
            }
            style={[
              styles.clearButton,
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
                styles.clearText,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Clear
            </Text>
          </Pressable>
        )}
      </View>

      <View
        style={[
          styles.cwdBar,
          {
            backgroundColor:
              colors.panel,
            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.cwdLabel,
            {
              color:
                colors.muted,
            },
          ]}
        >
          CWD
        </Text>

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
          {cwd || projectRoot || '/'}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={[
          styles.output,
          {
            backgroundColor:
              colors.editor,
          },
        ]}
        contentContainerStyle={
          styles.outputContent
        }
        keyboardShouldPersistTaps="handled"
      >
        {output.map(
          (line, index) => {
            const lower =
              line.toLowerCase();

            const isCommand =
              line.startsWith('> ');

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
                        ? colors.purpleLight
                        : isError
                        ? colors.danger
                        : isExit
                        ? colors.muted
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

      <View
        style={[
          styles.inputBar,
          {
            backgroundColor:
              colors.panel,
            borderTopColor:
              colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.prompt,
            {
              color:
                running
                  ? colors.muted
                  : colors.purple,
            },
          ]}
        >
          $
        </Text>

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
            colors.muted
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

        {running ? (
          <Pressable
            onPress={
              handleStop
            }
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  colors.danger,
              },
            ]}
          >
            <Text
              style={
                styles.sendButtonText
              }
            >
              ■
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={
              handleSubmit
            }
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  colors.purple,
              },
            ]}
          >
            <Text
              style={
                styles.sendButtonText
              }
            >
              →
            </Text>
          </Pressable>
        )}
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
      minHeight: 64,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    backText: {
      fontSize: 32,
      lineHeight: 34,
      fontWeight: '400',
    },

    headerCenter: {
      flex: 1,
      marginHorizontal: 12,
    },

    title: {
      fontSize: 17,
      fontWeight: '800',
    },

    project: {
      marginTop: 2,
      fontSize: 11,
      fontWeight: '600',
    },

    clearButton: {
      minWidth: 62,
      height: 38,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    clearText: {
      fontSize: 12,
      fontWeight: '800',
    },

    stopButton: {
      minWidth: 62,
      height: 38,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    stopText: {
      fontSize: 12,
      fontWeight: '800',
    },

    cwdBar: {
      minHeight: 32,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
    },

    cwdLabel: {
      fontSize: 10,
      fontWeight: '900',
      marginRight: 8,
    },

    cwdText: {
      flex: 1,
      fontSize: 11,
      fontFamily:
        Platform.OS === 'ios'
          ? 'Menlo'
          : 'monospace',
    },

    output: {
      flex: 1,
    },

    outputContent: {
      padding: 14,
      paddingBottom: 24,
    },

    outputLine: {
      fontSize: 13,
      lineHeight: 20,
      fontFamily:
        Platform.OS === 'ios'
          ? 'Menlo'
          : 'monospace',
    },

    inputBar: {
      minHeight: 62,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
    },

    prompt: {
      width: 24,
      fontSize: 17,
      fontWeight: '900',
      textAlign: 'center',
    },

    input: {
      flex: 1,
      minHeight: 44,
      paddingHorizontal: 8,
      paddingVertical: 8,
      fontSize: 13,
      fontFamily:
        Platform.OS === 'ios'
          ? 'Menlo'
          : 'monospace',
    },

    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },

    sendButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '900',
    },
  });
