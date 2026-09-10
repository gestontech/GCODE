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
  const { colors } = useTheme();

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
    const nextSelection = event?.nativeEvent?.selection;

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

    const previousText = undoStack[undoStack.length - 1];

    setUndoStack((current) => current.slice(0, -1));

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

    const nextText = redoStack[redoStack.length - 1];

    setRedoStack((current) => current.slice(0, -1));

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

    const nextText = text.split(searchText).join(replaceText);

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
          backgroundColor: colors.editor,
        },
      ]}
    >
      {/* OUTILS ÉDITEUR */}
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
          onPress={() => {
            setSearchVisible((current) => !current);
            setReplaceVisible(false);
          }}
          style={({ pressed }) => [
            styles.toolButton,
            {
              backgroundColor: searchVisible
                ? colors.panel2
                : 'transparent',
              opacity: pressed ? 0.65 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.toolText,
              { color: colors.text },
            ]}
          >
            🔎
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setReplaceVisible((current) => !current);
            setSearchVisible(true);
          }}
          style={({ pressed }) => [
            styles.toolButton,
            {
              backgroundColor: replaceVisible
                ? colors.panel2
                : 'transparent',
              opacity: pressed ? 0.65 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.toolText,
              { color: colors.text },
            ]}
          >
            ⇄
          </Text>
        </Pressable>

        <View style={styles.toolbarSpacer} />

        <Pressable
          onPress={handleUndo}
          disabled={undoStack.length === 0}
          style={({ pressed }) => [
            styles.toolButton,
            {
              opacity:
                undoStack.length === 0
                  ? 0.3
                  : pressed
                    ? 0.65
                    : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.toolText,
              { color: colors.text },
            ]}
          >
            ↶
          </Text>
        </Pressable>

        <Pressable
          onPress={handleRedo}
          disabled={redoStack.length === 0}
          style={({ pressed }) => [
            styles.toolButton,
            {
              opacity:
                redoStack.length === 0
                  ? 0.3
                  : pressed
                    ? 0.65
                    : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.toolText,
              { color: colors.text },
            ]}
          >
            ↷
          </Text>
        </Pressable>
      </View>

      {/* RECHERCHE / REMPLACEMENT */}
      {searchVisible && (
        <View
          style={[
            styles.searchPanel,
            {
              backgroundColor: colors.panel,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.searchRow}>
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Rechercher..."
              placeholderTextColor={colors.muted}
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.panel2,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              returnKeyType="search"
              onSubmitEditing={findNext}
            />

            <Pressable
              onPress={findNext}
              style={({ pressed }) => [
                styles.searchButton,
                {
                  backgroundColor: colors.purple,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.searchButtonText,
                  { color: '#ffffff' },
                ]}
              >
                ↓
              </Text>
            </Pressable>

            <Pressable
              onPress={clearSearch}
              style={({ pressed }) => [
                styles.searchButton,
                {
                  backgroundColor: colors.panel2,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.searchButtonText,
                  { color: colors.text },
                ]}
              >
                ×
              </Text>
            </Pressable>
          </View>

          {replaceVisible && (
            <View style={styles.searchRow}>
              <TextInput
                value={replaceText}
                onChangeText={setReplaceText}
                placeholder="Remplacer par..."
                placeholderTextColor={colors.muted}
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: colors.panel2,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />

              <Pressable
                onPress={handleReplace}
                style={({ pressed }) => [
                  styles.replaceButton,
                  {
                    backgroundColor: colors.panel2,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.replaceText,
                    { color: colors.text },
                  ]}
                >
                  Remplacer
                </Text>
              </Pressable>

              <Pressable
                onPress={handleReplaceAll}
                style={({ pressed }) => [
                  styles.replaceButton,
                  {
                    backgroundColor: colors.purple,
                    borderColor: colors.purple,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.replaceText,
                    { color: '#ffffff' },
                  ]}
                >
                  Tout
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* ÉDITEUR */}
      <View style={styles.editorArea}>
        <ScrollView
          style={styles.lineNumbersScroll}
          contentContainerStyle={styles.lineNumbersContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        >
          {lines.map((_, index) => (
            <Text
              key={`line-${index}`}
              style={[
                styles.lineNumber,
                {
                  color: colors.muted,
                },
              ]}
            >
              {String(index + 1).padStart(3, ' ')}
            </Text>
          ))}
        </ScrollView>

        <View style={styles.codeArea}>
          <ScrollView
            style={styles.highlightScroll}
            contentContainerStyle={styles.highlightContent}
            showsVerticalScrollIndicator={true}
            showsHorizontalScrollIndicator={true}
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
                onSelectionChange={handleSelectionChange}
                style={[
                  styles.input,
                  {
                    color: 'transparent',
                    backgroundColor: 'transparent',
                    caretColor: colors.text,
                  },
                ]}
                placeholderTextColor={colors.muted}
                selectionColor={colors.purple}
              />
            </View>
          </ScrollView>
        </View>
      </View>

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
            { color: colors.muted },
          ]}
        >
          {lineCount} lignes
        </Text>

        <Text
          style={[
            styles.footerText,
            { color: colors.muted },
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
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderBottomWidth: 1,
  },

  toolButton: {
    width: 38,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
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
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },

  searchInput: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
  },

  searchButton: {
    minWidth: 38,
    height: 38,
    marginLeft: 5,
    borderRadius: 8,
    borderWidth: 1,
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
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  replaceText: {
    fontSize: 11,
    fontWeight: '600',
  },

  editorArea: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
  },

  lineNumbersScroll: {
    width: 43,
    backgroundColor: 'transparent',
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
    minHeight: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderTopWidth: 1,
  },

  footerText: {
    fontSize: 9,
  },
});
