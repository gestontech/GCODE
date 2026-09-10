import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export default function CodeEditor({
  value = '',
  onChangeText,
}) {
  const { colors } = useTheme();

  const inputRef = useRef(null);

  const [text, setText] = useState(value);

  const undoStack = useRef([]);
  const redoStack = useRef([]);

  const internalChange = useRef(false);

  useEffect(() => {
    if (value !== text && !internalChange.current) {
      setText(value);
    }

    internalChange.current = false;
  }, [value]);

  function handleChange(nextText) {
    if (nextText === text) {
      return;
    }

    undoStack.current.push(text);

    if (undoStack.current.length > 100) {
      undoStack.current.shift();
    }

    redoStack.current = [];

    setText(nextText);

    internalChange.current = true;

    onChangeText?.(nextText);
  }

  function undo() {
    if (!undoStack.current.length) {
      return;
    }

    const previousText =
      undoStack.current.pop();

    redoStack.current.push(text);

    setText(previousText);

    internalChange.current = true;

    onChangeText?.(previousText);
  }

  function redo() {
    if (!redoStack.current.length) {
      return;
    }

    const nextText =
      redoStack.current.pop();

    undoStack.current.push(text);

    setText(nextText);

    internalChange.current = true;

    onChangeText?.(nextText);
  }

  const canUndo =
    undoStack.current.length > 0;

  const canRedo =
    redoStack.current.length > 0;

  const lines = text.split('\n');

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.editor,
        },
      ]}
    >
      {/* BARRE D'OUTILS */}
      <View
        style={[
          styles.toolbar,
          {
            backgroundColor: colors.panel,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={undo}
          disabled={!canUndo}
          style={({ pressed }) => [
            styles.toolButton,
            {
              backgroundColor: colors.panel2,
              opacity:
                !canUndo
                  ? 0.35
                  : pressed
                  ? 0.55
                  : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.toolText,
              {
                color: colors.text,
              },
            ]}
          >
            ↶
          </Text>
        </Pressable>

        <Pressable
          onPress={redo}
          disabled={!canRedo}
          style={({ pressed }) => [
            styles.toolButton,
            {
              backgroundColor: colors.panel2,
              opacity:
                !canRedo
                  ? 0.35
                  : pressed
                  ? 0.55
                  : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.toolText,
              {
                color: colors.text,
              },
            ]}
          >
            ↷
          </Text>
        </Pressable>

        <View style={styles.toolbarSpacer} />

        <Text
          style={[
            styles.editorLabel,
            {
              color: colors.muted,
            },
          ]}
        >
          ÉDITEUR
        </Text>
      </View>

      {/* CODE */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        horizontal
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.editorRow}>
          {/* NUMÉROS DE LIGNES */}
          <View
            style={[
              styles.lineNumbers,
              {
                backgroundColor: colors.editor,
                borderRightColor: colors.border,
              },
            ]}
          >
            {lines.map((_, index) => (
              <Text
                key={index}
                style={[
                  styles.lineNumber,
                  {
                    color: colors.muted,
                  },
                ]}
              >
                {index + 1}
              </Text>
            ))}
          </View>

          {/* TEXT INPUT */}
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={handleChange}
            multiline
            textAlignVertical="top"
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            scrollEnabled={false}
            style={[
              styles.input,
              {
                color: colors.editorText,
                backgroundColor: colors.editor,
              },
            ]}
            placeholder="Commence à écrire ton code..."
            placeholderTextColor={colors.muted}
            selectionColor={colors.purple}
          />
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.panel,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.footerText,
            {
              color: colors.muted,
            },
          ]}
        >
          {lines.length} ligne
          {lines.length > 1 ? 's' : ''}
        </Text>

        <Text
          style={[
            styles.footerText,
            {
              color: colors.muted,
            },
          ]}
        >
          GCODE Editor
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  toolbar: {
    height: 42,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 7,
  },

  toolButton: {
    width: 34,
    height: 32,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  toolText: {
    fontSize: 19,
    fontWeight: '800',
  },

  toolbarSpacer: {
    flex: 1,
  },

  editorLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  scroll: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
  },

  editorRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: '100%',
  },

  lineNumbers: {
    width: 42,
    paddingTop: 10,
    paddingRight: 8,
    alignItems: 'flex-end',
    borderRightWidth: 1,
  },

  lineNumber: {
    fontSize: 12,
    lineHeight: 20,
    fontFamily: 'monospace',
  },

  input: {
    minWidth: 500,
    minHeight: '100%',
    paddingTop: 10,
    paddingBottom: 30,
    paddingLeft: 10,
    paddingRight: 20,
    fontSize: 12,
    lineHeight: 20,
    fontFamily: 'monospace',
  },

  footer: {
    height: 28,
    borderTopWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  footerText: {
    fontSize: 9,
    fontWeight: '700',
  },
});
