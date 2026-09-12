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
  createTerminalEngine,
} from '../storage/terminalEngine';

import {
  loadProjects,
} from '../storage/projectStorage';

export default function TerminalScreen({
  project,
  projects = [],
  onBack,
}) {
  const { colors } = useTheme();

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const [currentProject, setCurrentProject] =
    useState(project || null);

  const [input, setInput] = useState('');

  const [output, setOutput] = useState([
    'GCODE Terminal V3',
    'Tape "help" pour afficher les commandes disponibles.',
    '',
  ]);

  const [history, setHistory] =
    useState([]);

  const [historyIndex, setHistoryIndex] =
    useState(-1);

  useEffect(() => {
    if (project) {
      setCurrentProject(project);
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

    const storedProjects =
      await loadProjects();

    if (storedProjects.length > 0) {
      const first =
        storedProjects[0];

      setCurrentProject(first);

      return first;
    }

    return null;
  };

  const executeCommand = async (
    command
  ) => {
    const trimmed =
      command.trim();

    if (!trimmed) {
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
      setOutput((currentOutput) => [
        ...currentOutput,
        `> ${trimmed}`,
        'Aucun projet disponible. Crée d’abord un projet.',
        '',
      ]);

      return;
    }

    try {
      const engine =
        createTerminalEngine({
          project: activeProject,

          onProjectUpdated:
            (updatedProject) => {
              setCurrentProject(
                updatedProject
              );
            },
        });

      const result =
        await engine.execute(trimmed);

      const resultText =
        result === undefined ||
        result === null
          ? ''
          : String(result);

      setOutput((currentOutput) => [
        ...currentOutput,
        `> ${trimmed}`,
        ...(resultText
          ? resultText.split('\n')
          : []),
        '',
      ]);
    } catch (error) {
      console.error(
        'Erreur Terminal GCODE:',
        error
      );

      setOutput((currentOutput) => [
        ...currentOutput,
        `> ${trimmed}`,
        `Erreur: ${
          error?.message ||
          'commande impossible'
        }`,
        '',
      ]);
    }
  };

  const handleSubmit = async () => {
    const command = input;

    setInput('');

    await executeCommand(command);
  };

  const handleInputKeyPress = () => {
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

    setHistoryIndex(nextIndex);
    setInput(
      history[nextIndex] || ''
    );
  };

  const handleClear = () => {
    setOutput([
      'GCODE Terminal V3',
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
                color: colors.text,
              },
            ]}
          >
            ‹
          </Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text
            style={[
              styles.title,
              {
                color: colors.textStrong,
              },
            ]}
          >
            Terminal
          </Text>

          <Text
            style={[
              styles.project,
              {
                color: colors.muted,
              },
            ]}
            numberOfLines={1}
          >
            {projectName}
          </Text>
        </View>

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
                color: colors.text,
              },
            ]}
          >
            Clear
          </Text>
        </Pressable>
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
          (line, index) => (
            <Text
              key={`${index}-${line}`}
              style={[
                styles.outputLine,
                {
                  color:
                    line.startsWith('>')
                      ? colors.purpleLight
                      : colors.editorText,
                },
              ]}
            >
              {line || ' '}
            </Text>
          )
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
              color: colors.purple,
            },
          ]}
        >
          $
        </Text>

        <TextInput
          ref={inputRef}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={
            handleSubmit
          }
          onKeyPress={(
            event
          ) => {
            if (
              event.nativeEvent.key ===
              'ArrowUp'
            ) {
              handleInputKeyPress();
            }
          }}
          placeholder="Entrer une commande..."
          placeholderTextColor={
            colors.muted
          }
          style={[
            styles.input,
            {
              color: colors.text,
            },
          ]}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          returnKeyType="send"
          blurOnSubmit={false}
        />

        <Pressable
          onPress={handleSubmit}
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
    minWidth: 56,
    height: 36,
    paddingHorizontal: 9,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearText: {
    fontSize: 10,
    fontWeight: '700',
  },

  output: {
    flex: 1,
  },

  outputContent: {
    padding: 14,
    paddingBottom: 30,
  },

  outputLine: {
    fontFamily: Platform.OS === 'ios'
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
    fontFamily: Platform.OS === 'ios'
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
    fontSize: 24,
    fontWeight: '800',
  },
});
