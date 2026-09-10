import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

import ActivityBar from '../components/ActivityBar';
import FileExplorer from '../components/FileExplorer';
import EditorTabs from '../components/EditorTabs';
import BottomPanel from '../components/BottomPanel';
import StatusBar from '../components/StatusBar';

import { useTheme } from '../theme/ThemeContext';

export default function WorkbenchScreen({
  project,
  onChange,
  onBack,
  onPreview,
}) {
  const { colors, spacing, radius } = useTheme();

  const files = project?.files || [];

  const [activeFileId, setActiveFileId] =
    useState(null);

  const [bottomPanel, setBottomPanel] =
    useState('terminal');

  const activeFile = useMemo(() => {
    if (!files.length) {
      return null;
    }

    return (
      files.find(
        (file) => file.id === activeFileId
      ) || files[0]
    );
  }, [files, activeFileId]);

  useEffect(() => {
    if (!activeFileId && files.length) {
      setActiveFileId(files[0].id);
      return;
    }

    if (
      activeFileId &&
      !files.some(
        (file) => file.id === activeFileId
      )
    ) {
      setActiveFileId(
        files[0]?.id || null
      );
    }
  }, [files, activeFileId]);

  function selectFile(file) {
    if (!file) {
      return;
    }

    setActiveFileId(file.id);
  }

  function updateCode(text) {
    if (!activeFile) {
      return;
    }

    const updatedProject = {
      ...project,
      files: files.map((file) =>
        file.id === activeFile.id
          ? {
              ...file,
              content: text,
            }
          : file
      ),
      code:
        activeFile.name === 'index.html'
          ? text
          : project.code,
    };

    onChange?.(updatedProject);
  }

  function getCursorPosition(text) {
    const value = text || '';

    const lines = value.split('\n');

    return {
      line: lines.length,
      column:
        (lines[lines.length - 1]?.length || 0) + 1,
    };
  }

  const cursor = getCursorPosition(
    activeFile?.content || ''
  );

  const language =
    activeFile?.language ||
    activeFile?.name?.split('.').pop() ||
    'text';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.panel,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            {
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.backIcon,
              { color: colors.text },
            ]}
          >
            ‹
          </Text>
        </Pressable>

        <View style={styles.projectInfo}>
          <Text
            numberOfLines={1}
            style={[
              styles.projectName,
              { color: colors.text },
            ]}
          >
            {project?.name ||
              'Projet sans nom'}
          </Text>

          <Text
            style={[
              styles.projectStatus,
              { color: colors.muted },
            ]}
          >
            GCODE Mobile
          </Text>
        </View>

        <Pressable
          onPress={onPreview}
          style={({ pressed }) => [
            styles.previewButton,
            {
              backgroundColor:
                colors.purple,
              borderRadius: radius.sm,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={styles.previewText}>
            ▶
          </Text>

          <Text style={styles.previewLabel}>
            Preview
          </Text>
        </Pressable>
      </View>

      {/* IDE */}
      <View style={styles.ide}>
        {/* ACTIVITY BAR */}
        <ActivityBar />

        {/* MAIN AREA */}
        <View style={styles.main}>
          {/* FILE EXPLORER */}
          <View
            style={[
              styles.sidebar,
              {
                backgroundColor:
                  colors.panel,
                borderRightColor:
                  colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.sidebarHeader,
                {
                  borderBottomColor:
                    colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sidebarTitle,
                  { color: colors.text },
                ]}
              >
                EXPLORATEUR
              </Text>
            </View>

            <FileExplorer
              project={project}
              activeFile={activeFile}
              onOpenFile={selectFile}
            />
          </View>

          {/* EDITOR */}
          <View
            style={[
              styles.editorArea,
              {
                backgroundColor:
                  colors.editor,
              },
            ]}
          >
            <EditorTabs
              files={files}
              activeFile={activeFile}
              onSelect={selectFile}
            />

            <View
              style={[
                styles.editorHeader,
                {
                  backgroundColor:
                    colors.panel,
                  borderBottomColor:
                    colors.border,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.fileName,
                  { color: colors.text },
                ]}
              >
                {activeFile?.name ||
                  'Aucun fichier'}
              </Text>

              <Text
                style={[
                  styles.language,
                  { color: colors.muted },
                ]}
              >
                {language}
              </Text>
            </View>

            <View
              style={[
                styles.editor,
                {
                  backgroundColor:
                    colors.editor,
                },
              ]}
            >
              {activeFile ? (
                <View style={styles.editorContent}>
                  <View
                    style={[
                      styles.lineNumbers,
                      {
                        borderRightColor:
                          colors.border,
                      },
                    ]}
                  >
                    {(activeFile.content || '')
                      .split('\n')
                      .map((_, index) => (
                        <Text
                          key={index}
                          style={[
                            styles.lineNumber,
                            {
                              color:
                                colors.muted,
                            },
                          ]}
                        >
                          {index + 1}
                        </Text>
                      ))}
                  </View>

                  <Text
                    selectable
                    style={[
                      styles.code,
                      {
                        color:
                          colors.editorText,
                      },
                    ]}
                  >
                    {activeFile.content || ''}
                  </Text>
                </View>
              ) : (
                <View style={styles.noFile}>
                  <Text
                    style={[
                      styles.noFileTitle,
                      { color: colors.text },
                    ]}
                  >
                    Aucun fichier ouvert
                  </Text>

                  <Text
                    style={[
                      styles.noFileText,
                      { color: colors.muted },
                    ]}
                  >
                    Sélectionne un fichier dans
                    l'explorateur.
                  </Text>
                </View>
              )}
            </View>

            {/* TOOLBAR */}
            <View
              style={[
                styles.toolbar,
                {
                  backgroundColor:
                    colors.panel,
                  borderTopColor:
                    colors.border,
                },
              ]}
            >
              <Tool
                label="↶"
                colors={colors}
                onPress={() => {}}
              />

              <Tool
                label="↷"
                colors={colors}
                onPress={() => {}}
              />

              <Tool
                label="⌕"
                colors={colors}
                onPress={() =>
                  setBottomPanel('problems')
                }
              />

              <View style={styles.toolbarSpacer} />

              <Tool
                label="▶"
                colors={colors}
                onPress={onPreview}
                active
              />
            </View>
          </View>
        </View>
      </View>

      {/* BOTTOM PANEL */}
      <View
        style={[
          styles.bottom,
          {
            backgroundColor:
              colors.panel,
            borderTopColor:
              colors.border,
          },
        ]}
      >
        <BottomPanel
          active={bottomPanel}
          onChange={setBottomPanel}
        />
      </View>

      {/* STATUS BAR */}
      <StatusBar
        language={language}
        line={cursor.line}
        column={cursor.column}
      />
    </View>
  );
}

function Tool({
  label,
  colors,
  onPress,
  active = false,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tool,
        {
          backgroundColor: active
            ? colors.purple
            : colors.panel2,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.toolText,
          {
            color: active
              ? '#ffffff'
              : colors.text,
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

  header: {
    height: 58,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backIcon: {
    fontSize: 34,
    fontWeight: '300',
  },

  projectInfo: {
    flex: 1,
    marginLeft: 4,
  },

  projectName: {
    fontSize: 14,
    fontWeight: '900',
  },

  projectStatus: {
    fontSize: 10,
    marginTop: 2,
  },

  previewButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  previewText: {
    color: '#ffffff',
    fontSize: 12,
  },

  previewLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },

  ide: {
    flex: 1,
    flexDirection: 'row',
  },

  main: {
    flex: 1,
    flexDirection: 'row',
  },

  sidebar: {
    width: 170,
    borderRightWidth: 1,
  },

  sidebarHeader: {
    height: 38,
    borderBottomWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  sidebarTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  editorArea: {
    flex: 1,
  },

  editorHeader: {
    height: 35,
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  fileName: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },

  language: {
    fontSize: 10,
    marginLeft: 8,
  },

  editor: {
    flex: 1,
  },

  editorContent: {
    flex: 1,
    flexDirection: 'row',
  },

  lineNumbers: {
    width: 38,
    borderRightWidth: 1,
    paddingTop: 10,
    alignItems: 'flex-end',
    paddingRight: 7,
  },

  lineNumber: {
    fontSize: 11,
    lineHeight: 19,
    fontFamily: 'monospace',
  },

  code: {
    flex: 1,
    padding: 10,
    fontSize: 12,
    lineHeight: 19,
    fontFamily: 'monospace',
  },

  noFile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  noFileTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  noFileText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },

  toolbar: {
    height: 46,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 7,
  },

  tool: {
    width: 36,
    height: 34,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  toolText: {
    fontSize: 15,
    fontWeight: '800',
  },

  toolbarSpacer: {
    flex: 1,
  },

  bottom: {
    borderTopWidth: 1,
    minHeight: 50,
  },
});
