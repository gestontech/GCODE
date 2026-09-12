import React, { useMemo, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export default function BottomPanel({
  active = 'terminal',
  onChange,
  project,
}) {
  const { theme } = useTheme();
  const { colors, radius, spacing } = theme;

  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([
    {
      type: 'system',
      text: 'GCODE Terminal — projet local',
    },
    {
      type: 'system',
      text: 'Tape "help" pour afficher les commandes disponibles.',
    },
  ]);

  const files = useMemo(() => {
    return Array.isArray(project?.files)
      ? project.files
      : [];
  }, [project]);

  function addHistory(type, text) {
    setHistory((previous) => [
      ...previous,
      {
        type,
        text: String(text),
      },
    ]);
  }

  function clearTerminal() {
    setHistory([]);
  }

  function findFile(fileName) {
    const normalized = fileName
      .trim()
      .replace(/^[\"']|[\"']$/g, '');

    return files.find(
      (file) =>
        file?.name === normalized ||
        file?.path === normalized
    );
  }

  function executeCommand(rawCommand) {
    const value = rawCommand.trim();

    if (!value) {
      return;
    }

    addHistory('command', `$ ${value}`);

    const parts = value.split(/\s+/);
    const commandName = parts[0].toLowerCase();

    const argument = value
      .slice(parts[0].length)
      .trim();

    switch (commandName) {
      case 'help':
        addHistory(
          'output',
          [
            'Commandes disponibles :',
            '',
            '  help              Afficher cette aide',
            '  ls                Lister les fichiers',
            '  pwd               Afficher le projet actuel',
            '  cat <fichier>     Afficher le contenu',
            '  echo <texte>      Afficher un texte',
            '  clear             Nettoyer le terminal',
          ].join('\n')
        );
        break;

      case 'ls': {
        if (!files.length) {
          addHistory(
            'output',
            'Aucun fichier dans ce projet.'
          );
          break;
        }

        const names = files
          .map((file) => file?.name)
          .filter(Boolean);

        addHistory(
          'output',
          names.join('\n')
        );

        break;
      }

      case 'pwd':
        addHistory(
          'output',
          `/gcode/projects/${project?.name || 'project'}`
        );
        break;

      case 'cat': {
        if (!argument) {
          addHistory(
            'error',
            'Usage : cat <fichier>'
          );
          break;
        }

        const file = findFile(argument);

        if (!file) {
          addHistory(
            'error',
            `Fichier introuvable : ${argument}`
          );
          break;
        }

        addHistory(
          'output',
          file.content || ''
        );

        break;
      }

      case 'echo':
        addHistory(
          'output',
          argument
        );
        break;

      case 'clear':
        clearTerminal();
        break;

      default:
        addHistory(
          'error',
          `Commande inconnue : ${commandName}`
        );

        addHistory(
          'system',
          'Tape "help" pour voir les commandes disponibles.'
        );
    }
  }

  function submitCommand() {
    const value = command;

    if (!value.trim()) {
      return;
    }

    setCommand('');
    executeCommand(value);
  }

  const tabs = [
    {
      id: 'terminal',
      label: 'TERMINAL',
    },
    {
      id: 'problems',
      label: 'PROBLÈMES',
    },
    {
      id: 'output',
      label: 'SORTIE',
    },
    {
      id: 'debug',
      label: 'DEBUG',
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.glass,
          borderTopColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.tabs,
          {
            borderBottomColor: colors.border,
          },
        ]}
      >
        {tabs.map((tab) => {
          const selected = active === tab.id;

          return (
            <Pressable
              key={tab.id}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{
                selected,
              }}
              onPress={() => onChange?.(tab.id)}
              hitSlop={4}
              style={({ pressed }) => [
                styles.tab,
                {
                  backgroundColor: selected
                    ? colors.primarySoft
                    : colors.glassSoft,
                  borderColor: selected
                    ? colors.primary
                    : colors.border,
                  borderRadius: radius.md,
                  marginHorizontal: spacing.xs,
                  opacity: pressed ? 0.68 : 1,
                  transform: [
                    {
                      scale: pressed ? 0.97 : 1,
                    },
                  ],
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: selected
                      ? colors.primary
                      : colors.textMuted,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {active === 'terminal' ? (
        <KeyboardAvoidingView
          style={styles.content}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <ScrollView
            style={styles.output}
            contentContainerStyle={styles.outputContent}
            keyboardShouldPersistTaps="handled"
          >
            {history.map((item, index) => {
              let textColor = colors.editorText;

              if (item.type === 'command') {
                textColor = colors.primary;
              }

              if (item.type === 'error') {
                textColor = colors.danger;
              }

              if (item.type === 'system') {
                textColor = colors.textMuted;
              }

              if (item.type === 'output') {
                textColor = colors.editorText;
              }

              return (
                <Text
                  key={`${index}-${item.text}`}
                  selectable
                  style={[
                    styles.historyText,
                    {
                      color: textColor,
                    },
                  ]}
                >
                  {item.text}
                </Text>
              );
            })}
          </ScrollView>

          <View
            style={[
              styles.commandBar,
              {
                backgroundColor: colors.glassStrong,
                borderTopColor: colors.border,
                borderRadius: radius.lg,
                marginHorizontal: spacing.xs,
                marginBottom: spacing.xs,
              },
            ]}
          >
            <Text
              style={[
                styles.prompt,
                {
                  color: colors.success,
                },
              ]}
            >
              $
            </Text>

            <TextInput
              value={command}
              onChangeText={setCommand}
              onSubmitEditing={submitCommand}
              placeholder="Entrer une commande..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="send"
              style={[
                styles.input,
                {
                  color: colors.text,
                },
              ]}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Exécuter la commande"
              onPress={submitCommand}
              disabled={!command.trim()}
              hitSlop={5}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primary,
                  borderRadius: radius.md,
                  opacity: !command.trim()
                    ? 0.35
                    : pressed
                      ? 0.68
                      : 1,
                  transform: [
                    {
                      scale:
                        pressed && command.trim()
                          ? 0.94
                          : 1,
                    },
                  ],
                },
              ]}
            >
              <Text
                style={[
                  styles.sendText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                ↵
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      ) : null}

      {active === 'problems' ? (
        <View
          style={[
            styles.placeholder,
            {
              backgroundColor: colors.glassSoft,
              borderColor: colors.border,
              borderRadius: radius.lg,
              margin: spacing.xs,
            },
          ]}
        >
          <Text
            style={[
              styles.placeholderTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Aucun problème détecté
          </Text>

          <Text
            style={[
              styles.placeholderText,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Les erreurs du projet apparaîtront ici.
          </Text>
        </View>
      ) : null}

      {active === 'output' ? (
        <View
          style={[
            styles.placeholder,
            {
              backgroundColor: colors.glassSoft,
              borderColor: colors.border,
              borderRadius: radius.lg,
              margin: spacing.xs,
            },
          ]}
        >
          <Text
            style={[
              styles.placeholderTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Sortie GCODE
          </Text>

          <Text
            style={[
              styles.placeholderText,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Les informations d'exécution apparaîtront ici.
          </Text>
        </View>
      ) : null}

      {active === 'debug' ? (
        <View
          style={[
            styles.placeholder,
            {
              backgroundColor: colors.glassSoft,
              borderColor: colors.border,
              borderRadius: radius.lg,
              margin: spacing.xs,
            },
          ]}
        >
          <Text
            style={[
              styles.placeholderTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Console de débogage
          </Text>

          <Text
            style={[
              styles.placeholderText,
              {
                color: colors.textMuted,
              },
            ]}
          >
            La console de débogage sera disponible
            avec le système Debug de GCODE.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 50,
  },

  tabs: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
  },

  tab: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 6,
  },

  tabText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  content: {
    height: 190,
  },

  output: {
    flex: 1,
  },

  outputContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  historyText: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 18,
    marginBottom: 2,
  },

  commandBar: {
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  prompt: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '900',
    marginRight: 8,
  },

  input: {
    flex: 1,
    minHeight: 38,
    fontFamily: 'monospace',
    fontSize: 12,
    paddingVertical: 4,
  },

  sendButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginLeft: 6,
  },

  sendText: {
    fontSize: 19,
    fontWeight: '900',
  },

  placeholder: {
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },

  placeholderTitle: {
    fontSize: 13,
    fontWeight: '800',
  },

  placeholderText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 5,
  },
});
