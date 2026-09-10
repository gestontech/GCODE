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
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export default function CodeEditor({
  value = '',
  onChangeText,
}) {
  const { colors } = useTheme();

  const inputRef = useRef(null);

  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  function handleChange(nextText) {
    setText(nextText);
    onChangeText?.(nextText);
  }

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

          {/* ÉDITEUR */}
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

      {/* INDICATEUR */}
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
            { color: colors.muted },
          ]}
        >
          {lines.length} ligne
          {lines.length > 1 ? 's' : ''}
        </Text>

        <Text
          style={[
            styles.footerText,
            { color: colors.muted },
          ]}
        >
          Éditeur GCODE
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
