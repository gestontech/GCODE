import React, {
  useEffect,
  useMemo,
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
import SyntaxHighlight from './SyntaxHighlight';

const FONT_SIZE = 12;
const LINE_HEIGHT = 20;

export default function CodeEditor({
  value = '',
  language = 'text',
  onChangeText,
  onSelectionChange,
}) {
  const { theme } = useTheme();
  const { colors, radius, spacing } = theme;

  const inputRef = useRef(null);

  const [text, setText] = useState(value || '');

  const [selection, setSelection] = useState({
    start: 0,
    end: 0,
  });

  const [searchVisible, setSearchVisible] = useState(false);
  const [replaceVisible, setReplaceVisible] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  useEffect(() => {
    const nextValue = value || '';

    if (nextValue !== text) {
      setText(nextValue);

      const safePosition = Math.min(
        selection.start,
        nextValue.length,
      );

      setSelection({
        start: safePosition,
        end: safePosition,
      });
    }
  }, [value]);

  const lines = useMemo(() => {
    return (text || '').split('\n');
  }, [text]);

  const lineCount = lines.length;

  const selectedCharacters = Math.abs(
    selection.end - selection.start,
  );

  const pushUndo = (previousText) => {
    setUndoStack((current) => [
      ...current.slice(-49),
      previousText,
    ]);

    setRedoStack([]);
  };

  const updateText = (nextText) => {
    pushUndo(text);

    setText(nextText);
    onChangeText?.(nextText);
  };

  const handleSelectionChange = (event) => {
    const nextSelection =
      event?.nativeEvent?.selection;

    if (!nextSelection) {
      return;
    }

    setSelection(nextSelection);

    onSelectionChange?.(nextSelection);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) {
      return;
    }

    const previousText =
      undoStack[undoStack.length - 1];

    setUndoStack((current) =>
      current.slice(0, -1)
    );

    setRedoStack((current) => [
      ...current,
      text,
    ]);

    setText(previousText);
    onChangeText?.(previousText);

    requestAnimationFrame(() => {
      const position = Math.min(
        selection.start,
        previousText.length,
      );

      const nextSelection = {
        start: position,
        end: position,
      };

      setSelection(nextSelection);
      onSelectionChange?.(nextSelection);
    });
  };

  const handleRedo = () => {
    if (redoStack.length === 0) {
      return;
    }

    const nextText =
      redoStack[redoStack.length - 1];

    setRedoStack((current) =>
      current.slice(0, -1)
    );

    setUndoStack((current) => [
      ...current,
      text,
    ]);

    setText(nextText);
    onChangeText?.(nextText);

    requestAnimationFrame(() => {
      const position = Math.min(
        selection.start,
        nextText.length,
      );

      const nextSelection = {
        start: position,
        end: position,
      };

      setSelection(nextSelection);
      onSelectionChange?.(nextSelection);
    });
  };

  const handleReplace = () => {
    if (!searchText) {
      return;
    }

    const nextText = text.replace(
      searchText,
      replaceText,
    );

    if (nextText === text) {
      return;
    }

    updateText(nextText);

    const position = Math.min(
      selection.start,
      nextText.length,
    );

    const nextSelection = {
      start: position,
      end: position,
    };

    setSelection(nextSelection);
    onSelectionChange?.(nextSelection);
  };

  const handleReplaceAll = () => {
    if (!searchText) {
      return;
    }

    const nextText = text
      .split(searchText)
      .join(replaceText);

    if (nextText === text) {
      return;
    }

    updateText(nextText);

    const position = Math.min(
      selection.start,
      nextText.length,
    );

    const nextSelection = {
      start: position,
      end: position,
    };

    setSelection(nextSelection);
    onSelectionChange?.(nextSelection);
  };

  const findNext = () => {
    if (!searchText) {
      return;
    }

    const startFrom = Math.max(
      selection.end,
      0,
    );

    let index = text.indexOf(
      searchText,
      startFrom,
    );

    if (index === -1) {
      index = text.indexOf(searchText);
    }

    if (index === -1) {
      return;
    }

    const nextSelection = {
      start: index,
      end: index + searchText.length,
    };

    setSelection(nextSelection);
    onSelectionChange?.(nextSelection);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const clearSearch = () => {
    setSearchText('');
    setReplaceText('');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.editorBackground,
        },
      ]}
    >
      {/* BARRE D'OUTILS */}
      <View
        style={[
          styles.toolbar,
          {
            backgroundColor: colors.glass,
            borderBottomColor: colors.border,
            paddingHorizontal: spacing.xs,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Rechercher"
          accessibilityState={{
            selected: searchVisible,
          }}
          onPress={() => {
            setSearchVisible(
              (current) => !current
            );
            setReplaceVisible(false);
          }}
          hitSlop={4}
          style={({ pressed }) => [
            styles.toolButton,
            {
              backgroundColor: searchVisible
                ? colors.primarySoft
                : colors.glassSoft,
              borderColor: searchVisible
                ? colors.primary
                : colors.border,
              borderRadius: radius.md,
              opacity: pressed ? 0.68 : 1,
              transform: [
                {
                  scale: pressed ? 0.94 : 1,
                },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.toolText,
              {
                color: searchVisible
                  ? colors.primary
                  : colors.textSecondary,
              },
            ]}
          >
            🔎
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remplacer"
          accessibilityState={{
            selected: replaceVisible,
          }}
          onPress={() => {
            setReplaceVisible(
              (current) => !current
            );
            setSearchVisible(true);
          }}
          hitSlop={4}
          style={({ pressed }) => [
            styles.toolButton,
            {
              backgroundColor: replaceVisible
                ? colors.primarySoft
                : colors.glassSoft,
              borderColor: replaceVisible
                ? colors.primary
                : colors.border,
              borderRadius: radius.md,
              opacity: pressed ? 0.68 : 1,
              transform: [
                {
                  scale: pressed ? 0.94 : 1,
                },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.toolText,
              {
                color: replaceVisible
                  ? colors.primary
                  : colors.textSecondary,
              },
            ]}
          >
            ⇄
          </Text>
        </Pressable>

        <View style={styles.toolbarSpacer} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Annuler"
          accessibilityState={{
            disabled: undoStack.length === 0,
          }}
          onPress={handleUndo}
          disabled={undoStack.length === 0}
          hitSlop={4}
          style={({ pressed }) => [
            styles.toolButton,
            {
              backgroundColor: colors.glassSoft,
              borderColor: colors.border,
              borderRadius: radius.md,
              opacity:
                undoStack.length === 0
                  ? 0.3
                  : pressed
                    ? 0.68
                    : 1,
              transform: [
                {
                  scale:
                    pressed &&
                    undoStack.length > 0
                      ? 0.94
                      : 1,
                },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.toolText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            ↶
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Rétablir"
          accessibilityState={{
            disabled: redoStack.length === 0,
          }}
          onPress={handleRedo}
          disabled={redoStack.length === 0}
          hitSlop={4}
          style={({ pressed }) => [
            styles.toolButton,
            {
              backgroundColor: colors.glassSoft,
              borderColor: colors.border,
              borderRadius: radius.md,
              opacity:
                redoStack.length === 0
                  ? 0.3
                  : pressed
                    ? 0.68
                    : 1,
              transform: [
                {
                  scale:
                    pressed &&
                    redoStack.length > 0
                      ? 0.94
                      : 1,
                },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.toolText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            ↷
          </Text>
        </Pressable>
      </View>

      {/* RECHERCHE / REMPLACEMENT */}
      {searchVisible ? (
        <View
          style={[
            styles.searchPanel,
            {
              backgroundColor: colors.glass,
              borderBottomColor: colors.border,
              paddingHorizontal: spacing.sm,
            },
          ]}
        >
          <View style={styles.searchRow}>
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Rechercher..."
              placeholderTextColor={
                colors.textMuted
              }
              style={[
                styles.searchInput,
                {
                  backgroundColor:
                    colors.glassStrong,
                  borderColor: colors.border,
                  color: colors.text,
                  borderRadius: radius.md,
                },
              ]}
              returnKeyType="search"
              onSubmitEditing={findNext}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Résultat suivant"
              onPress={findNext}
              hitSlop={4}
              style={({ pressed }) => [
                styles.searchButton,
                {
                  backgroundColor:
                    colors.primarySoft,
                  borderColor: colors.primary,
                  borderRadius: radius.md,
                  opacity: pressed ? 0.68 : 1,
                  transform: [
                    {
                      scale: pressed ? 0.94 : 1,
                    },
                  ],
                },
              ]}
            >
              <Text
                style={[
                  styles.searchButtonText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                ↓
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Effacer la recherche"
              onPress={clearSearch}
              hitSlop={4}
              style={({ pressed }) => [
                styles.searchButton,
                {
                  backgroundColor:
                    colors.glassSoft,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  opacity: pressed ? 0.68 : 1,
                  transform: [
                    {
                      scale: pressed ? 0.94 : 1,
                    },
                  ],
                },
              ]}
            >
              <Text
                style={[
                  styles.searchButtonText,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                ×
              </Text>
            </Pressable>
          </View>

          {replaceVisible ? (
            <View style={styles.searchRow}>
              <TextInput
                value={replaceText}
                onChangeText={setReplaceText}
                placeholder="Remplacer par..."
                placeholderTextColor={
                  colors.textMuted
                }
                style={[
                  styles.searchInput,
                  {
                    backgroundColor:
                      colors.glassStrong,
                    borderColor: colors.border,
                    color: colors.text,
                    borderRadius: radius.md,
                  },
                ]}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remplacer le résultat"
                onPress={handleReplace}
                hitSlop={4}
                style={({ pressed }) => [
                  styles.replaceButton,
                  {
                    backgroundColor:
                      colors.glassSoft,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    opacity: pressed ? 0.68 : 1,
                    transform: [
                      {
                        scale: pressed ? 0.96 : 1,
                      },
                    ],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.replaceText,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Remplacer
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tout remplacer"
                onPress={handleReplaceAll}
                hitSlop={4}
                style={({ pressed }) => [
                  styles.replaceButton,
                  {
                    backgroundColor:
                      colors.primarySoft,
                    borderColor: colors.primary,
                    borderRadius: radius.md,
                    opacity: pressed ? 0.68 : 1,
                    transform: [
                      {
                        scale: pressed ? 0.96 : 1,
                      },
                    ],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.replaceText,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  Tout
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* ZONE ÉDITEUR */}
      <View style={styles.editorArea}>
        <ScrollView
          style={[
            styles.lineNumbersScroll,
            {
              backgroundColor: colors.editorSurface,
              borderRightColor: colors.border,
            },
          ]}
          contentContainerStyle={
            styles.lineNumbersContent
          }
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        >
          {lines.map((_, index) => (
            <Text
              key={`line-${index}`}
              style={[
                styles.lineNumber,
                {
                  color: colors.lineNumber,
                },
              ]}
            >
              {String(index + 1).padStart(3, ' ')}
            </Text>
          ))}
        </ScrollView>

        <View
          style={[
            styles.codeArea,
            {
              backgroundColor:
                colors.editorBackground,
            },
          ]}
        >
          <ScrollView
            style={styles.highlightScroll}
            contentContainerStyle={
              styles.highlightContent
            }
            showsVerticalScrollIndicator
            showsHorizontalScrollIndicator
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.highlightWrapper}>
              <SyntaxHighlight
                code={text}
                language={language}
              />

              <TextInput
                ref={inputRef}
                value={text}
                onChangeText={updateText}
                multiline
                scrollEnabled={false}
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
                textAlignVertical="top"
                selection={selection}
                onSelectionChange={
                  handleSelectionChange
                }
                style={[
                  styles.input,
                  {
                    color: 'transparent',
                    backgroundColor:
                      'transparent',
                    caretColor: colors.text,
                  },
                ]}
                placeholderTextColor={
                  colors.textMuted
                }
                selectionColor={colors.primary}
              />
            </View>
          </ScrollView>
        </View>
      </View>

      {/* PIED DE L'ÉDITEUR */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.glass,
            borderTopColor: colors.border,
            paddingHorizontal: spacing.sm,
          },
        ]}
      >
        <Text
          style={[
            styles.footerText,
            {
              color: colors.textMuted,
            },
          ]}
        >
          {lineCount} lignes
        </Text>

        <Text
          style={[
            styles.footerText,
            {
              color: colors.textMuted,
            },
          ]}
        >
          {selectedCharacters > 0
            ? `${selectedCharacters} caractères sélectionnés`
            : 'Aucune sélection'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
  },

  toolbar: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  toolButton: {
    width: 38,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth:
      StyleSheet.hairlineWidth,
    marginHorizontal: 2,
  },

  toolText: {
    fontSize: 17,
    fontWeight: '600',
  },

  toolbarSpacer: {
    flex: 1,
  },

  searchPanel: {
    paddingVertical: 7,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },

  searchInput: {
    flex: 1,
    minHeight: 38,
    borderWidth:
      StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
  },

  searchButton: {
    minWidth: 38,
    height: 38,
    marginLeft: 5,
    borderWidth:
      StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },

  replaceButton: {
    minHeight: 38,
    paddingHorizontal: 10,
    marginLeft: 5,
    borderWidth:
      StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },

  replaceText: {
    fontSize: 11,
    fontWeight: '700',
  },

  editorArea: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
  },

  lineNumbersScroll: {
    width: 48,
    borderRightWidth:
      StyleSheet.hairlineWidth,
  },

  lineNumbersContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },

  lineNumber: {
    height: LINE_HEIGHT,
    lineHeight: LINE_HEIGHT,
    fontSize: FONT_SIZE,
    fontFamily: 'monospace',
    textAlign: 'right',
    paddingRight: 7,
    includeFontPadding: false,
  },

  codeArea: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },

  highlightScroll: {
    flex: 1,
  },

  highlightContent: {
    minWidth: '100%',
    paddingBottom: 30,
  },

  highlightWrapper: {
    position: 'relative',
    minHeight: 100,
  },

  input: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    minHeight: '100%',
    padding: 8,
    margin: 0,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    fontFamily: 'monospace',
    includeFontPadding: false,
    textAlignVertical: 'top',
  },

  footer: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth:
      StyleSheet.hairlineWidth,
  },

  footerText: {
    fontSize: 9,
    fontWeight: '600',
  },
});
