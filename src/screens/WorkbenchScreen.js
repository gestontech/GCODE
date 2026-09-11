import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const DEFAULT_CODE = `// Bienvenue dans GCODE
// Commence à coder ici.

function hello() {
  console.log("Hello from GCODE!");
}

hello();`;

export default function WorkbenchScreen({
  project,
  onBack,
  onPreview,
}) {
  const { colors, spacing, radius } = useTheme();

  const [code, setCode] = useState(
    project?.code || DEFAULT_CODE
  );

  const [activeFile, setActiveFile] = useState(
    project?.fileName || 'index.js'
  );

  const [isSaved, setIsSaved] = useState(true);
  const [showExplorer, setShowExplorer] = useState(true);

  const lines = useMemo(() => {
    return code.split('\n');
  }, [code]);

  const handleChange = (value) => {
    setCode(value);
    setIsSaved(false);
  };

  const handleSave = () => {
    setIsSaved(true);
  };

  const insertText = (text) => {
    setCode((current) => `${current}${text}`);
    setIsSaved(false);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* TOP BAR */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.panel,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backButton,
            {
              opacity: pressed ? 0.55 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.backIcon,
              {
                color: colors.text,
              },
            ]}
          >
            ‹
          </Text>
        </Pressable>

        <View style={styles.projectHeader}>
          <Text
            numberOfLines={1}
            style={[
              styles.projectName,
              {
                color: colors.textStrong,
              },
            ]}
          >
            {project?.name || 'Nouveau projet'}
          </Text>

          <View style={styles.fileStatus}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isSaved
                    ? colors.green
                    : colors.yellow,
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: colors.muted,
                },
              ]}
            >
              {isSaved ? 'Enregistré' : 'Modifié'}
            </Text>
          </View>
        </View>

        <View style={styles.topActions}>
          <Pressable
            onPress={handleSave}
            hitSlop={8}
            style={({ pressed }) => [
              styles.topAction,
              {
                opacity: pressed ? 0.55 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.actionIcon,
                {
                  color: isSaved
                    ? colors.muted
                    : colors.purple,
                },
              ]}
            >
              ●
            </Text>
          </Pressable>

          <Pressable
            onPress={onPreview}
            hitSlop={8}
            style={({ pressed }) => [
              styles.runButton,
              {
                backgroundColor: colors.purple,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={styles.runIcon}>▶</Text>
          </Pressable>
        </View>
      </View>

      {/* FILE TABS */}
      <View
        style={[
          styles.tabsBar,
          {
            backgroundColor: colors.panel2,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          style={[
            styles.tab,
            {
              borderBottomColor: colors.purple,
            },
          ]}
        >
          <Text
            style={[
              styles.fileIcon,
              {
                color: colors.purple,
              },
            ]}
          >
            JS
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.tabText,
              {
                color: colors.text,
              },
            ]}
          >
            {activeFile}
          </Text>

          {!isSaved && (
            <View
              style={[
                styles.modifiedDot,
                {
                  backgroundColor: colors.yellow,
                },
              ]}
            />
          )}
        </Pressable>

        <Pressable
          onPress={() => setShowExplorer((value) => !value)}
          style={({ pressed }) => [
            styles.explorerToggle,
            {
              opacity: pressed ? 0.55 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.explorerIcon,
              {
                color: colors.muted,
              },
            ]}
          >
            ☰
          </Text>
        </Pressable>
      </View>

      <View style={styles.workspace}>
        {/* EXPLORER */}
        {showExplorer && (
          <View
            style={[
              styles.explorer,
              {
                backgroundColor: colors.panel,
                borderRightColor: colors.border,
              },
            ]}
          >
            <View style={styles.explorerHeader}>
              <Text
                style={[
                  styles.explorerTitle,
                  {
                    color: colors.muted,
                  },
                ]}
              >
                EXPLORER
              </Text>

              <Text
                style={[
                  styles.explorerAction,
                  {
                    color: colors.muted,
                  },
                ]}
              >
                +
              </Text>
            </View>

            <View
              style={[
                styles.folder,
                {
                  backgroundColor: colors.panel2,
                },
              ]}
            >
              <Text
                style={[
                  styles.folderArrow,
                  {
                    color: colors.muted,
                  },
                ]}
              >
                ▾
              </Text>

              <Text
                style={[
                  styles.folderIcon,
                  {
                    color: colors.yellow,
                  },
                ]}
              >
                ■
              </Text>

              <Text
                numberOfLines={1}
                style={[
                  styles.folderName,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {project?.name || 'project'}
              </Text>
            </View>

            <Pressable
              style={[
                styles.fileItem,
                {
                  backgroundColor: colors.panel2,
                  borderLeftColor: colors.purple,
                },
              ]}
            >
              <Text
                style={[
                  styles.fileType,
                  {
                    color: colors.yellow,
                  },
                ]}
              >
                JS
              </Text>

              <Text
                numberOfLines={1}
                style={[
                  styles.fileName,
                  {
                    color: colors.textStrong,
                  },
                ]}
              >
                index.js
              </Text>
            </Pressable>

            <View style={styles.fileItem}>
              <Text
                style={[
                  styles.fileType,
                  {
                    color: colors.red,
                  },
                ]}
              >
                #
              </Text>

              <Text
                style={[
                  styles.fileName,
                  {
                    color: colors.muted,
                  },
                ]}
              >
                README.md
              </Text>
            </View>

            <View style={styles.fileItem}>
              <Text
                style={[
                  styles.fileType,
                  {
                    color: colors.blue,
                  },
                ]}
              >
                JSON
              </Text>

              <Text
                style={[
                  styles.fileName,
                  {
                    color: colors.muted,
                  },
                ]}
              >
                package.json
              </Text>
            </View>
          </View>
        )}

        {/* EDITOR */}
        <KeyboardAvoidingView
          style={styles.editorContainer}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.editorScroll}
          >
            <View
              style={[
                styles.editor,
                {
                  backgroundColor: colors.editor,
                },
              ]}
            >
              {/* LINE NUMBERS */}
              <View style={styles.lineNumbers}>
                {lines.map((_, index) => (
                  <Text
                    key={index}
                    style={[
                      styles.lineNumber,
                      {
                        color: colors.muted2,
                      },
                    ]}
                  >
                    {String(index + 1).padStart(3, ' ')}
                  </Text>
                ))}
              </View>

              {/* CODE */}
              <TextInput
                value={code}
                onChangeText={handleChange}
                multiline
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                scrollEnabled={false}
                style={[
                  styles.codeInput,
                  {
                    color: colors.editorText,
                    backgroundColor: colors.editor,
                  },
                ]}
              />
            </View>
          </ScrollView>

          {/* TOOLBAR */}
          <View
            style={[
              styles.toolbar,
              {
                backgroundColor: colors.panel2,
                borderTopColor: colors.border,
              },
            ]}
          >
            <ToolbarButton
              label="TAB"
              onPress={() => insertText('  ')}
              colors={colors}
            />

            <ToolbarButton
              label="{ }"
              onPress={() => insertText('{}')}
              colors={colors}
            />

            <ToolbarButton
              label="( )"
              onPress={() => insertText('()')}
              colors={colors}
            />

            <ToolbarButton
              label="[ ]"
              onPress={() => insertText('[]')}
              colors={colors}
            />

            <ToolbarButton
              label="="
              onPress={() => insertText(' = ')}
              colors={colors}
            />

            <ToolbarButton
              label=";"
              onPress={() => insertText(';')}
              colors={colors}
            />

            <ToolbarButton
              label="→"
              onPress={() => insertText(' => ')}
              colors={colors}
            />

            <ToolbarButton
              label="⌫"
              onPress={() => setCode((value) => value.slice(0, -1))}
              colors={colors}
            />
          </View>

          {/* STATUS BAR */}
          <View
            style={[
              styles.statusBar,
              {
                backgroundColor: colors.purple,
              },
            ]}
          >
            <Text style={styles.statusBarText}>
              JavaScript
            </Text>

            <Text style={styles.statusBarText}>
              UTF-8
            </Text>

            <Text style={styles.statusBarText}>
              {lines.length} lignes
            </Text>

            <Text style={styles.statusBarText}>
              {isSaved ? 'Saved' : 'Unsaved'}
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

function ToolbarButton({
  label,
  onPress,
  colors,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolbarButton,
        {
          backgroundColor: colors.panel,
          borderColor: colors.border,
          opacity: pressed ? 0.55 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.toolbarButtonText,
          {
            color: colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },

  backButton: {
    width: 40,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backIcon: {
    fontSize: 32,
    fontWeight: '300',
    marginTop: -3,
  },

  projectHeader: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 5,
  },

  projectName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },

  fileStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusText: {
    fontSize: 9,
  },

  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  topAction: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionIcon: {
    fontSize: 17,
  },

  runButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  runIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 2,
  },

  tabsBar: {
    height: 43,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
  },

  tab: {
    minWidth: 150,
    maxWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 2,
  },

  fileIcon: {
    fontSize: 8,
    fontWeight: '900',
    marginRight: 7,
  },

  tabText: {
    fontSize: 11,
    fontWeight: '600',
  },

  modifiedDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginLeft: 7,
  },

  explorerToggle: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },

  explorerIcon: {
    fontSize: 17,
  },

  workspace: {
    flex: 1,
    flexDirection: 'row',
  },

  explorer: {
    width: 142,
    borderRightWidth: 1,
  },

  explorerHeader: {
    height: 43,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },

  explorerTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  explorerAction: {
    fontSize: 21,
    fontWeight: '300',
  },

  folder: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
  },

  folderArrow: {
    fontSize: 11,
    marginRight: 5,
  },

  folderIcon: {
    fontSize: 9,
    marginRight: 6,
  },

  folderName: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
  },

  fileItem: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 22,
    paddingRight: 6,
    borderLeftWidth: 2,
  },

  fileType: {
    fontSize: 7,
    fontWeight: '900',
    width: 25,
  },

  fileName: {
    flex: 1,
    fontSize: 10,
  },

  editorContainer: {
    flex: 1,
    minWidth: 0,
  },

  editorScroll: {
    flexGrow: 1,
  },

  editor: {
    minHeight: '100%',
    flexDirection: 'row',
    paddingTop: 12,
    paddingRight: 30,
  },

  lineNumbers: {
    width: 42,
    alignItems: 'flex-end',
    paddingRight: 10,
  },

  lineNumber: {
    height: 20,
    lineHeight: 20,
    fontSize: 10,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },

  codeInput: {
    minWidth: 500,
    minHeight: 600,
    padding: 0,
    margin: 0,
    fontSize: 12,
    lineHeight: 20,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },

  toolbar: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderTopWidth: 1,
    gap: 5,
  },

  toolbarButton: {
    minWidth: 35,
    height: 32,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },

  toolbarButtonText: {
    fontSize: 10,
    fontWeight: '700',
  },

  statusBar: {
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },

  statusBarText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '600',
  },
});
