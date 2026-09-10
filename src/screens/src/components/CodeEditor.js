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

  const [searchVisible, setSearchVisible] =
    useState(false);

  const [replaceVisible, setReplaceVisible] =
    useState(false);

  const [searchText, setSearchText] =
    useState('');

  const [replaceText, setReplaceText] =
    useState('');

  const [currentMatch, setCurrentMatch] =
    useState(0);

  const undoStack = useRef([]);
  const redoStack = useRef([]);

  const internalChange = useRef(false);

  useEffect(() => {
    if (
      value !== text &&
      !internalChange.current
    ) {
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

  function applyTextChange(nextText) {
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

  function getMatches() {
    if (!searchText) {
      return [];
    }

    const matches = [];
    let start = 0;

    while (true) {
      const index = text.indexOf(
        searchText,
        start
      );

      if (index === -1) {
        break;
      }

      matches.push(index);

      start =
        index + Math.max(searchText.length, 1);
    }

    return matches;
  }

  const matches = getMatches();

  function openSearch() {
    setSearchVisible(true);
    setReplaceVisible(false);

    setTimeout(() => {
      // Le champ de recherche reçoit le focus
    }, 50);
  }

  function closeSearch() {
    setSearchVisible(false);
    setReplaceVisible(false);
    setSearchText('');
    setReplaceText('');
    setCurrentMatch(0);
  }

  function nextMatch() {
    if (!matches.length) {
      return;
    }

    setCurrentMatch(
      (currentMatch + 1) % matches.length
    );
  }

  function previousMatch() {
    if (!matches.length) {
      return;
    }

    setCurrentMatch(
      (currentMatch - 1 + matches.length) %
        matches.length
    );
  }

  function replaceCurrent() {
    if (!searchText || !matches.length) {
      return;
    }

    const index =
      matches[
        Math.min(
          currentMatch,
          matches.length - 1
        )
      ];

    const nextText =
      text.slice(0, index) +
      replaceText +
      text.slice(index + searchText.length);

    applyTextChange(nextText);

    const newMatches =
      nextText.indexOf(searchText);

    if (newMatches === -1) {
      setCurrentMatch(0);
    } else {
      setCurrentMatch(
        Math.min(
          currentMatch,
          Math.max(
            0,
            getMatches().length - 1
          )
        )
      );
    }
  }

  function replaceAll() {
    if (!searchText) {
      return;
    }

    const nextText =
      text.split(searchText).join(replaceText);

    if (nextText === text) {
      return;
    }

    applyTextChange(nextText);

    setCurrentMatch(0);
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
      {/* BARRE PRINCIPALE */}
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
              { color: colors.text },
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
              { color: colors.text },
            ]}
          >
            ↷
          </Text>
        </Pressable>

        <Pressable
          onPress={openSearch}
          style={({ pressed }) => [
            styles.toolButton,
            {
              backgroundColor: colors.panel2,
              opacity: pressed ? 0.55 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.toolText,
              { color: colors.text },
            ]}
          >
            ⌕
          </Text>
        </Pressable>

        <View style={styles.toolbarSpacer} />

        <Text
          style={[
            styles.editorLabel,
            { color: colors.muted },
          ]}
        >
          ÉDITEUR
        </Text>
      </View>

      {/* RECHERCHE */}
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
              onChangeText={(textValue) => {
                setSearchText(textValue);
                setCurrentMatch(0);
              }}
              autoFocus
              autoCorrect={false}
              autoCapitalize="none"
              placeholder="Rechercher..."
              placeholderTextColor={colors.muted}
              style={[
                styles.searchInput,
                {
                  color: colors.text,
                  backgroundColor:
                    colors.panel2,
                  borderColor: colors.border,
                },
              ]}
            />

            <Pressable
              onPress={previousMatch}
              style={[
                styles.smallButton,
                {
                  backgroundColor:
                    colors.panel2,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.text,
                }}
              >
                ↑
              </Text>
            </Pressable>

            <Pressable
              onPress={nextMatch}
              style={[
                styles.smallButton,
                {
                  backgroundColor:
                    colors.panel2,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.text,
                }}
              >
                ↓
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                setReplaceVisible(
                  !replaceVisible
                )
              }
              style={[
                styles.smallButton,
                {
                  backgroundColor:
                    replaceVisible
                      ? colors.purple
                      : colors.panel2,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.text,
                }}
              >
                ⇄
              </Text>
            </Pressable>

            <Pressable
              onPress={closeSearch}
              style={[
                styles.smallButton,
                {
                  backgroundColor:
                    colors.panel2,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.text,
                }}
              >
                ×
              </Text>
            </Pressable>
          </View>

          <View style={styles.searchInfoRow}>
            <Text
              style={[
                styles.searchInfo,
                {
                  color: colors.muted,
                },
              ]}
            >
              {searchText
                ? matches.length
                  ? `${currentMatch + 1} / ${matches.length}`
                  : 'Aucun résultat'
                : 'Rechercher dans le fichier'}
            </Text>
          </View>

          {/* REMPLACEMENT */}
          {replaceVisible && (
            <View style={styles.replaceRow}>
              <TextInput
                value={replaceText}
                onChangeText={setReplaceText}
                autoCorrect={false}
                autoCapitalize="none"
                placeholder="Remplacer par..."
                placeholderTextColor={
                  colors.muted
                }
                style={[
                  styles.searchInput,
                  {
                    color: colors.text,
                    backgroundColor:
                      colors.panel2,
                    borderColor:
                      colors.border,
                  },
                ]}
              />

              <Pressable
                onPress={replaceCurrent}
                style={[
                  styles.replaceButton,
                  {
                    backgroundColor:
                      colors.panel2,
                  },
                ]}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 10,
                    fontWeight: '800',
                  }}
                >
                  Remplacer
                </Text>
              </Pressable>

              <Pressable
                onPress={replaceAll}
                style={[
                  styles.replaceButton,
                  {
                    backgroundColor:
                      colors.purple,
                  },
                ]}
              >
                <Text
                  style={{
                    color: '#ffffff',
                    fontSize: 10,
                    fontWeight: '800',
                  }}
                >
                  Tout
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

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
                backgroundColor:
                  colors.editor,
                borderRightColor:
                  colors.border,
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
                backgroundColor:
                  colors.editor,
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
          {searchText
            ? `${matches.length} résultat${
                matches.length > 1 ? 's' : ''
              }`
            : 'GCODE Editor'}
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

  searchPanel: {
    borderBottomWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  searchInput: {
    flex: 1,
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 10,
    fontSize: 12,
  },

  smallButton: {
    width: 34,
    height: 34,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchInfoRow: {
    paddingHorizontal: 3,
    paddingTop: 5,
  },

  searchInfo: {
    fontSize: 9,
  },

  replaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 7,
  },

  replaceButton: {
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
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
