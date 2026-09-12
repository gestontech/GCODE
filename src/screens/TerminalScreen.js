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

  const [input, setInput] = useState('');

  const [output, setOutput] = useState([
    'GCODE Terminal V3',
    'Terminal natif Android activé.',
    'Tape "help" pour tester les commandes disponibles.',
    '',
  ]);

  const [history, setHistory] = useState([]);

  const [historyIndex, setHistoryIndex] =
    useState(-1);

  const [cwd, setCwd] = useState('');

  const [running, setRunning] =
    useState(false);

  useEffect(() => {
    if (project) {
      setCurrentProject(project);
      setCwd('');
    }
  }, [project]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({
        animated: true,
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [output]);

  const getProject = async () => {
    if (currentProject) {
      return currentProject;
    }

    if (projects.length > 0) {
      const firstProject = projects[0];

      setCurrentProject(firstProject);

      return firstProject;
    }

    const storedProjects =
      await loadProjects();

    if (storedProjects.length > 0) {
      const firstProject =
        storedProjects[0];

      setCurrentProject(firstProject);

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
        (item) => item.id === projectId
      );

    if (!updatedProject) {
      return null;
    }

    setCurrentProject(updatedProject);

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

    setOutput((currentOutput) => [
      ...currentOutput,
      ...normalized,
      '',
    ]);
  };

  const executeCommand = async (
    command
  ) => {
    const trimmed =
      command.trim();

    if (!trimmed || running) {
      return;
    }

    setHistory((currentHistory) => [
      ...currentHistory,
      trimmed,
    ]);

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

    setRunning(true);

    setOutput((currentOutput) => [
      ...currentOutput,
      `> ${trimmed}`,
    ]);

    try {
      /*
       * Le moteur natif Android exécute
       * réellement la commande dans le
       * processus système disponible dans
       * le sandbox de GCODE.
       *
       * Pour le moment, cwd vide signifie
       * que le moteur utilise son répertoire
       * de travail applicatif par défaut.
       *
       * Nous connecterons ensuite ce chemin
       * physique au système de fichiers réel
       * des projets GCODE.
       */

      const result =
        await executeNativeCommand(
          trimmed,
          cwd || undefined,
          {
            GCODE_PROJECT_ID:
              String(
                activeProject.id || ''
              ),

            GCODE_PROJECT_NAME:
              String(
                activeProject.name || ''
              ),
          }
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

      const nextCwd =
        typeof result?.cwd ===
        'string'
          ? result.cwd
          : cwd;

      setCwd(nextCwd);

      if (stdout) {
        appendOutput(
          stdout.replace(/\n$/, '')
        );
      }

      if (stderr) {
        appendOutput(
          stderr.replace(/\n$/, '')
        );
      }

      appendOutput([
        `[Process exited with code ${exitCode}]`,
      ]);

      /*
       * Une commande native réussie peut
       * modifier ultérieurement les fichiers
       * physiques du projet. On recharge donc
       * l'état du projet après exécution.
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

    const command = input;

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
          style={styles.headerCenter}
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
            onPress={handleStop}
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
            onPress={handleClear}
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
            const isCommand =
              line.startsWith('> ');

            const isError =
              line
                .toLowerCase()
                .includes('error') ||
              line
                .toLowerCase()
                .includes('not found') ||
              line
                .toLowerCase()
                .includes('permission denied');

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
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor:
                  colors.purple,
                opacity: pressed
                  ? 0.7
                  : 1,
              },
            ]}
          >
            <Text
              style={
                styles.sendButtonText
              }
            >
              ›
            </Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    fontSize: 30,
    lineHeight: 32,
  },

  headerCenter: {
    flex: 1,
    paddingHorizontal: 12,
  },

  title: {
    fontSize: 17,
    fontWeight: '900',
  },

  project: {
    fontSize: 10,
    marginTop: 3,
  },

  clearButton: {
    minWidth: 58,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearText: {
    fontSize: 10,
    fontWeight: '700',
  },

  stopButton: {
    minWidth: 58,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stopText: {
    fontSize: 10,
    fontWeight: '800',
  },

  output: {
    flex: 1,
  },

  outputContent: {
    padding: 14,
    paddingBottom: 30,
  },

  outputLine: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Menlo'
        : 'monospace',
    fontSize: 12,
    lineHeight: 20,
  },

  inputBar: {
    minHeight: 58,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },

  prompt: {
    fontFamily: 'monospace',
    fontSize: 17,
    fontWeight: '900',
    marginRight: 7,
  },

  input: {
    flex: 1,
    minHeight: 42,
    fontFamily:
      Platform.OS === 'ios'
        ? 'Menlo'
        : 'monospace',
    fontSize: 12,
    paddingHorizontal: 8,
  },

  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
});
