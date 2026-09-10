import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export default function BottomPanel({
  active = 'terminal',
  onChange,
}) {
  const { colors } = useTheme();

  const [command, setCommand] = useState('');

  const [history, setHistory] = useState([
    {
      type: 'system',
      text: 'GCODE Terminal prêt.',
    },
  ]);

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
      label: 'OUTPUT',
    },
    {
      id: 'debug',
      label: 'DEBUG CONSOLE',
    },
  ];

  function runCommand() {
    const value = command.trim();

    if (!value) {
      return;
    }

    const nextHistory = [
      ...history,
      {
        type: 'command',
        text: `$ ${value}`,
      },
    ];

    const lower = value.toLowerCase();

    if (lower === 'clear') {
      setHistory([]);
      setCommand('');
      return;
    }

    if (lower === 'help') {
      nextHistory.push({
        type: 'output',
        text:
          'Commandes disponibles :\n' +
          'help   - afficher cette aide\n' +
          'clear  - vider le terminal\n' +
          'pwd    - afficher le dossier courant\n' +
          'ls     - afficher les fichiers du projet\n' +
          'echo   - afficher un texte',
      });
    } else if (lower === 'pwd') {
      nextHistory.push({
        type: 'output',
        text: '/gcode/project',
      });
    } else if (lower === 'ls') {
      nextHistory.push({
        type: 'output',
        text:
          'index.html\n' +
          'style.css\n' +
          'script.js',
      });
    } else if (lower.startsWith('echo ')) {
      nextHistory.push({
        type: 'output',
        text: value.slice(5),
      });
    } else {
      nextHistory.push({
        type: 'error',
        text:
          `Commande inconnue : ${value}\n` +
          `Tape "help" pour voir les commandes disponibles.`,
      });
    }

    setHistory(nextHistory);
    setCommand('');
  }

  function renderTerminal() {
    return (
      <View style={styles.terminalContainer}>
        <ScrollView
          style={styles.terminalOutput}
          contentContainerStyle={
            styles.terminalContent
          }
          keyboardShouldPersistTaps="handled"
        >
          {history.map((item, index) => (
            <Text
              key={`${item.type}-${index}`}
              style={[
                styles.terminalLine,
                {
                  color:
                    item.type === 'command'
                      ? colors.text
                      : item.type === 'error'
                      ? colors.red
                      : item.type === 'system'
                      ? colors.blue
                      : colors.editorText,
                },
              ]}
            >
              {item.text}
            </Text>
          ))}
        </ScrollView>

        <View
          style={[
            styles.commandRow,
            {
              borderTopColor:
                colors.border,
              backgroundColor:
                colors.panel,
            },
          ]}
        >
          <Text
            style={[
              styles.prompt,
              {
                color: colors.green,
              },
            ]}
          >
            $
          </Text>

          <TextInput
            value={command}
            onChangeText={setCommand}
            onSubmitEditing={runCommand}
            placeholder="Entrer une commande..."
            placeholderTextColor={
              colors.muted
            }
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
            style={[
              styles.commandInput,
              {
                color: colors.text,
              },
            ]}
          />

          <Pressable
            onPress={runCommand}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor:
                  colors.purple,
                opacity: pressed
                  ? 0.65
                  : 1,
              },
            ]}
          >
            <Text
              style={styles.sendText}
            >
              ▶
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderProblems() {
    return (
      <View style={styles.emptyContainer}>
        <Text
          style={[
            styles.emptyIcon,
            {
              color: colors.green,
            },
          ]}
        >
          ✓
        </Text>

        <Text
          style={[
            styles.emptyTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Aucun problème
        </Text>

        <Text
          style={[
            styles.emptyText,
            {
              color: colors.muted,
            },
          ]}
        >
          Les erreurs détectées dans ton
          projet apparaîtront ici.
        </Text>
      </View>
    );
  }

  function renderOutput() {
    return (
      <View style={styles.emptyContainer}>
        <Text
          style={[
            styles.emptyIcon,
            {
              color: colors.blue,
            },
          ]}
        >
          ◉
        </Text>

        <Text
          style={[
            styles.emptyTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Output GCODE
        </Text>

        <Text
          style={[
            styles.emptyText,
            {
              color: colors.muted,
            },
          ]}
        >
          Les sorties de compilation et
          d'exécution apparaîtront ici.
        </Text>
      </View>
    );
  }

  function renderDebug() {
    return (
      <View style={styles.emptyContainer}>
        <Text
          style={[
            styles.emptyIcon,
            {
              color: colors.purple,
            },
          ]}
        >
          ◇
        </Text>

        <Text
          style={[
            styles.emptyTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Debug Console
        </Text>

        <Text
          style={[
            styles.emptyText,
            {
              color: colors.muted,
            },
          ]}
        >
          Les informations de débogage
          apparaîtront ici.
        </Text>
      </View>
    );
  }

  function renderContent() {
    switch (active) {
      case 'problems':
        return renderProblems();

      case 'output':
        return renderOutput();

      case 'debug':
        return renderDebug();

      case 'terminal':
      default:
        return renderTerminal();
    }
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            colors.panel,
        },
      ]}
    >
      {/* ONGLETS */}
      <View
        style={[
          styles.tabs,
          {
            borderBottomColor:
              colors.border,
          },
        ]}
      >
        {tabs.map((tab) => {
          const selected =
            active === tab.id;

          return (
            <Pressable
              key={tab.id}
              onPress={() =>
                onChange?.(tab.id)
              }
              style={[
                styles.tab,
                {
                  borderBottomColor:
                    selected
                      ? colors.purple
                      : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: selected
                      ? colors.text
                      : colors.muted,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* CONTENU */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 50,
  },

  tabs: {
    height: 36,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  tab: {
    minWidth: 82,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
  },

  tabText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  content: {
    flex: 1,
  },

  terminalContainer: {
    flex: 1,
  },

  terminalOutput: {
    flex: 1,
  },

  terminalContent: {
    padding: 10,
    paddingBottom: 20,
  },

  terminalLine: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 18,
    marginBottom: 2,
  },

  commandRow: {
    minHeight: 44,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  prompt: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '900',
    marginRight: 7,
  },

  commandInput: {
    flex: 1,
    minHeight: 38,
    fontFamily: 'monospace',
    fontSize: 11,
    paddingVertical: 6,
  },

  sendButton: {
    width: 34,
    height: 32,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  emptyIcon: {
    fontSize: 25,
    fontWeight: '800',
    marginBottom: 7,
  },

  emptyTitle: {
    fontSize: 13,
    fontWeight: '900',
  },

  emptyText: {
    maxWidth: 300,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },
});
