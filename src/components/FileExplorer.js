import React, {
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

function getFileIcon(name = '') {
  const extension =
    name.split('.').pop()?.toLowerCase();

  const icons = {
    html: '◇',
    htm: '◇',
    css: '#',
    js: 'JS',
    jsx: 'JS',
    ts: 'TS',
    tsx: 'TS',
    json: '{}',
    md: 'M',
    txt: 'T',
    xml: '◇',
    svg: '◇',
  };

  return icons[extension] || '•';
}

function getLanguage(name = '') {
  const extension =
    name.split('.').pop()?.toLowerCase();

  if (
    extension === 'html' ||
    extension === 'htm'
  ) {
    return 'html';
  }

  if (extension === 'css') {
    return 'css';
  }

  if (
    extension === 'js' ||
    extension === 'jsx'
  ) {
    return 'javascript';
  }

  if (
    extension === 'ts' ||
    extension === 'tsx'
  ) {
    return 'typescript';
  }

  if (extension === 'json') {
    return 'json';
  }

  if (extension === 'md') {
    return 'markdown';
  }

  return 'plaintext';
}

export default function FileExplorer({
  project,
  activeFile,
  onOpenFile,
  onCreateFile,
  onCreateFolder,
  onRenameFile,
  onDeleteFile,
  onRenameFolder,
  onDeleteFolder,
}) {
  const { theme } = useTheme();
  const {
    colors,
    spacing,
    radius,
  } = theme;

  const [expandedFolders, setExpandedFolders] =
    useState(new Set(['root']));

  const [menuVisible, setMenuVisible] =
    useState(false);

  const files = useMemo(() => {
    return Array.isArray(project?.files)
      ? project.files
      : [];
  }, [project?.files]);

  const folders = useMemo(() => {
    return Array.isArray(project?.folders)
      ? project.folders
      : [];
  }, [project?.folders]);

  function toggleFolder(folderId) {
    setExpandedFolders((previous) => {
      const next = new Set(previous);

      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }

      return next;
    });
  }

  function requestCreateFile() {
    setMenuVisible(false);
    onCreateFile?.();
  }

  function requestCreateFolder() {
    setMenuVisible(false);
    onCreateFolder?.();
  }

  function requestRenameFile(file) {
    if (!file) {
      return;
    }

    onRenameFile?.(file);
  }

  function requestDeleteFile(file) {
    if (!file) {
      return;
    }

    if (file.name === 'index.html') {
      Alert.alert(
        'Fichier protégé',
        'index.html est nécessaire au Preview de GCODE et ne peut pas être supprimé.',
        [
          {
            text: 'OK',
          },
        ]
      );

      return;
    }

    Alert.alert(
      'Supprimer le fichier',
      `Voulez-vous vraiment supprimer « ${file.name} » ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () =>
            onDeleteFile?.(file),
        },
      ]
    );
  }

  function requestRenameFolder(folder) {
    if (!folder) {
      return;
    }

    onRenameFolder?.(folder);
  }

  function requestDeleteFolder(folder) {
    if (!folder) {
      return;
    }

    Alert.alert(
      'Supprimer le dossier',
      `Voulez-vous supprimer « ${folder.name} » et tout son contenu ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () =>
            onDeleteFolder?.(folder),
        },
      ]
    );
  }

  function showFileActions(file) {
    Alert.alert(
      file.name,
      'Choisissez une action',
      [
        {
          text: 'Ouvrir',
          onPress: () =>
            onOpenFile?.(file),
        },
        {
          text: 'Renommer',
          onPress: () =>
            requestRenameFile(file),
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () =>
            requestDeleteFile(file),
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  }

  function showFolderActions(folder) {
    Alert.alert(
      folder.name,
      'Choisissez une action',
      [
        {
          text: 'Ouvrir / Fermer',
          onPress: () =>
            toggleFolder(folder.id),
        },
        {
          text: 'Renommer',
          onPress: () =>
            requestRenameFolder(folder),
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () =>
            requestDeleteFolder(folder),
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  }

  function getFilesForFolder(folderId) {
    return files.filter(
      (file) =>
        (file.folderId ||
          file.parentId ||
          null) === folderId
    );
  }

  function getChildrenForFolder(folderId) {
    return folders.filter(
      (folder) =>
        (folder.parentId ||
          null) === folderId
    );
  }

  function renderFile(file, depth = 0) {
    const isActive =
      activeFile?.id === file.id;

    return (
      <Pressable
        key={file.id}
        accessibilityRole="button"
        accessibilityLabel={`Ouvrir ${file.name}`}
        onPress={() =>
          onOpenFile?.(file)
        }
        onLongPress={() =>
          showFileActions(file)
        }
        hitSlop={2}
        style={({ pressed }) => [
          styles.file,
          {
            paddingLeft:
              10 +
              depth * 18,

            backgroundColor:
              isActive
                ? colors.primarySoft
                : colors.glassSoft,

            borderColor:
              isActive
                ? colors.primary
                : colors.border,

            borderRadius:
              radius.md,

            marginHorizontal: 6,
            marginVertical: 2,

            opacity:
              pressed ? 0.65 : 1,

            transform: [
              {
                scale:
                  pressed ? 0.985 : 1,
              },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.fileIconContainer,
            {
              backgroundColor:
                isActive
                  ? colors.glassStrong
                  : colors.glass,
              borderColor:
                colors.border,
              borderRadius:
                radius.sm,
            },
          ]}
        >
          <Text
            style={[
              styles.fileIcon,
              {
                color:
                  isActive
                    ? colors.primary
                    : colors.accent,
              },
            ]}
          >
            {getFileIcon(file.name)}
          </Text>
        </View>

        <View style={styles.fileInfo}>
          <Text
            numberOfLines={1}
            style={[
              styles.fileName,
              {
                color:
                  isActive
                    ? colors.text
                    : colors.textSecondary,
              },
            ]}
          >
            {file.name}
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.fileLanguage,
              {
                color:
                  colors.textMuted,
              },
            ]}
          >
            {getLanguage(file.name)}
          </Text>
        </View>
      </Pressable>
    );
  }

  function renderFolder(folder, depth = 0) {
    const folderId =
      folder.id;

    const expanded =
      expandedFolders.has(folderId);

    const childFolders =
      getChildrenForFolder(folderId);

    const folderFiles =
      getFilesForFolder(folderId);

    return (
      <View key={folderId}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            expanded
              ? `Fermer ${folder.name}`
              : `Ouvrir ${folder.name}`
          }
          onPress={() =>
            toggleFolder(folderId)
          }
          onLongPress={() =>
            showFolderActions(folder)
          }
          hitSlop={2}
          style={({ pressed }) => [
            styles.folder,
            {
              paddingLeft:
                8 +
                depth * 18,

              backgroundColor:
                colors.glassSoft,

              borderColor:
                colors.border,

              borderRadius:
                radius.md,

              marginHorizontal: 6,
              marginVertical: 2,

              opacity:
                pressed ? 0.65 : 1,

              transform: [
                {
                  scale:
                    pressed ? 0.985 : 1,
                },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.arrowContainer,
              {
                backgroundColor:
                  colors.glass,
                borderColor:
                  colors.border,
                borderRadius:
                  radius.sm,
              },
            ]}
          >
            <Text
              style={[
                styles.arrow,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              {expanded
                ? '⌄'
                : '›'}
            </Text>
          </View>

          <Text
            style={[
              styles.folderIcon,
              {
                color:
                  colors.accent,
              },
            ]}
          >
            {expanded
              ? '▾'
              : '□'}
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.folderName,
              {
                color:
                  colors.text,
              },
            ]}
          >
            {folder.name}
          </Text>
        </Pressable>

        {expanded && (
          <View>
            {childFolders.map(
              (child) =>
                renderFolder(
                  child,
                  depth + 1
                )
            )}

            {folderFiles.map(
              (file) =>
                renderFile(
                  file,
                  depth + 1
                )
            )}

            {childFolders.length === 0 &&
              folderFiles.length === 0 && (
                <View
                  style={[
                    styles.emptyFolderContainer,
                    {
                      marginLeft:
                        34 +
                        depth * 18,
                      backgroundColor:
                        colors.glassSoft,
                      borderColor:
                        colors.border,
                      borderRadius:
                        radius.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.emptyFolder,
                      {
                        color:
                          colors.textMuted,
                      },
                    ]}
                  >
                    Dossier vide
                  </Text>
                </View>
              )}
          </View>
        )}
      </View>
    );
  }

  const rootFiles =
    files.filter(
      (file) =>
        !file.folderId &&
        !file.parentId
    );

  const rootFolders =
    folders.filter(
      (folder) =>
        !folder.parentId
    );

  const rootExpanded =
    expandedFolders.has('root');

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
            backgroundColor:
              colors.glass,

            borderBottomColor:
              colors.border,

            borderBottomWidth:
              StyleSheet.hairlineWidth,
          },
        ]}
      >
        <View style={styles.headerText}>
          <View
            style={[
              styles.sectionBadge,
              {
                backgroundColor:
                  colors.glassStrong,

                borderColor:
                  colors.border,

                borderRadius:
                  radius.pill,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    colors.success,
                },
              ]}
            />

            <Text
              style={[
                styles.title,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              EXPLORATEUR
            </Text>
          </View>

          <Text
            numberOfLines={1}
            style={[
              styles.projectName,
              {
                color:
                  colors.text,
              },
            ]}
          >
            {project?.name || 'GCODE'}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Créer un fichier ou un dossier"
          onPress={() =>
            setMenuVisible(
              (value) => !value
            )
          }
          hitSlop={4}
          style={({ pressed }) => [
            styles.moreButton,
            {
              backgroundColor:
                menuVisible
                  ? colors.primarySoft
                  : colors.glassStrong,

              borderColor:
                menuVisible
                  ? colors.primary
                  : colors.border,

              borderRadius:
                radius.pill,

              opacity:
                pressed ? 0.65 : 1,

              transform: [
                {
                  scale:
                    pressed ? 0.92 : 1,
                },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.moreText,
              {
                color:
                  menuVisible
                    ? colors.primary
                    : colors.text,
              },
            ]}
          >
            ⋮
          </Text>
        </Pressable>
      </View>

      {/* MENU */}

      {menuVisible && (
        <View
          style={[
            styles.actionMenu,
            {
              backgroundColor:
                colors.glassStrong,

              borderColor:
                colors.borderStrong,

              borderRadius:
                radius.xl,

              shadowColor:
                colors.shadow,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nouveau fichier"
            onPress={
              requestCreateFile
            }
            style={({ pressed }) => [
              styles.menuItem,
              {
                backgroundColor:
                  pressed
                    ? colors.primarySoft
                    : colors.glassSoft,

                borderRadius:
                  radius.lg,

                opacity:
                  pressed ? 0.72 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.menuIconContainer,
                {
                  backgroundColor:
                    colors.primarySoft,

                  borderColor:
                    colors.border,

                  borderRadius:
                    radius.md,
                },
              ]}
            >
              <Text
                style={[
                  styles.menuIcon,
                  {
                    color:
                      colors.primary,
                  },
                ]}
              >
                ＋
              </Text>
            </View>

            <View>
              <Text
                style={[
                  styles.menuText,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Nouveau fichier
              </Text>

              <Text
                style={[
                  styles.menuHint,
                  {
                    color:
                      colors.textMuted,
                  },
                ]}
              >
                Créer un fichier
              </Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nouveau dossier"
            onPress={
              requestCreateFolder
            }
            style={({ pressed }) => [
              styles.menuItem,
              {
                backgroundColor:
                  pressed
                    ? colors.primarySoft
                    : colors.glassSoft,

                borderRadius:
                  radius.lg,

                opacity:
                  pressed ? 0.72 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.menuIconContainer,
                {
                  backgroundColor:
                    colors.glass,

                  borderColor:
                    colors.border,

                  borderRadius:
                    radius.md,
                },
              ]}
            >
              <Text
                style={[
                  styles.menuIcon,
                  {
                    color:
                      colors.accent,
                  },
                ]}
              >
                □
              </Text>
            </View>

            <View>
              <Text
                style={[
                  styles.menuText,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Nouveau dossier
              </Text>

              <Text
                style={[
                  styles.menuHint,
                  {
                    color:
                      colors.textMuted,
                  },
                ]}
              >
                Organiser le projet
              </Text>
            </View>
          </Pressable>
        </View>
      )}

      {/* ARBRE */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              spacing.lg,
          },
        ]}
      >
        {/* RACINE */}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            rootExpanded
              ? 'Fermer le projet'
              : 'Ouvrir le projet'
          }
          onPress={() =>
            toggleFolder('root')
          }
          style={({ pressed }) => [
            styles.rootFolder,
            {
              backgroundColor:
                colors.glass,

              borderColor:
                colors.borderStrong,

              borderRadius:
                radius.lg,

              marginHorizontal: 6,

              opacity:
                pressed ? 0.7 : 1,

              transform: [
                {
                  scale:
                    pressed ? 0.99 : 1,
                },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.arrowContainer,
              {
                backgroundColor:
                  colors.glassStrong,

                borderColor:
                  colors.border,

                borderRadius:
                  radius.sm,
              },
            ]}
          >
            <Text
              style={[
                styles.arrow,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              {rootExpanded
                ? '⌄'
                : '›'}
            </Text>
          </View>

          <Text
            style={[
              styles.folderIcon,
              {
                color:
                  colors.primary,
              },
            ]}
          >
            {rootExpanded
              ? '▾'
              : '□'}
          </Text>

          <View style={styles.rootInfo}>
            <Text
              style={[
                styles.folderName,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              projet
            </Text>

            <Text
              style={[
                styles.rootHint,
                {
                  color:
                    colors.textMuted,
                },
              ]}
            >
              {files.length +
                folders.length}{' '}
              élément
              {files.length +
                folders.length !==
              1
                ? 's'
                : ''}
            </Text>
          </View>
        </Pressable>

        {rootExpanded && (
          <>
            {rootFolders.map(
              (folder) =>
                renderFolder(
                  folder,
                  0
                )
            )}

            {rootFiles.map(
              (file) =>
                renderFile(
                  file,
                  0
                )
            )}

            {rootFolders.length === 0 &&
              rootFiles.length === 0 && (
                <View
                  style={[
                    styles.emptyContainer,
                    {
                      backgroundColor:
                        colors.glassSoft,

                      borderColor:
                        colors.border,

                      borderRadius:
                        radius.xl,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.emptyIcon,
                      {
                        backgroundColor:
                          colors.glass,

                        borderColor:
                          colors.border,

                        borderRadius:
                          radius.pill,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.emptyIconText,
                        {
                          color:
                            colors.primary,
                        },
                      ]}
                    >
                      ＋
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.emptyTitle,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    Aucun fichier
                  </Text>

                  <Text
                    style={[
                      styles.emptyText,
                      {
                        color:
                          colors.textMuted,
                      },
                    ]}
                  >
                    Utilise le bouton ⋮
                    pour créer un
                    fichier ou un dossier.
                  </Text>
                </View>
              )}
          </>
        )}
      </ScrollView>

      {/* FOOTER */}

      <View
        style={[
          styles.footer,
          {
            backgroundColor:
              colors.glass,

            borderTopColor:
              colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.footerPill,
            {
              backgroundColor:
                colors.glassSoft,

              borderColor:
                colors.border,

              borderRadius:
                radius.pill,
            },
          ]}
        >
          <Text
            style={[
              styles.footerText,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            {files.length} fichier
            {files.length !== 1
              ? 's'
              : ''}
            {'  •  '}
            {folders.length} dossier
            {folders.length !== 1
              ? 's'
              : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    minHeight: 76,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerText: {
    flex: 1,
    paddingRight: 10,
  },

  sectionBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    marginRight: 6,
  },

  title: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.9,
  },

  projectName: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 5,
  },

  moreButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },

  moreText: {
    fontSize: 23,
    lineHeight: 24,
    fontWeight: '900',
  },

  actionMenu: {
    position: 'absolute',
    top: 68,
    right: 10,
    zIndex: 100,
    elevation: 16,
    minWidth: 230,
    borderWidth: 1,
    padding: 7,
  },

  menuItem: {
    minHeight: 58,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },

  menuIconContainer: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 10,
  },

  menuIcon: {
    fontSize: 19,
    fontWeight: '900',
  },

  menuText: {
    fontSize: 13,
    fontWeight: '800',
  },

  menuHint: {
    fontSize: 9,
    marginTop: 2,
    fontWeight: '500',
  },

  content: {
    paddingTop: 8,
  },

  rootFolder: {
    minHeight: 52,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },

  rootInfo: {
    flex: 1,
    marginLeft: 5,
  },

  rootHint: {
    fontSize: 9,
    marginTop: 2,
  },

  folder: {
    minHeight: 42,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },

  arrowContainer: {
    width: 23,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },

  arrow: {
    fontSize: 17,
    lineHeight: 19,
    textAlign: 'center',
  },

  folderIcon: {
    width: 26,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
    marginLeft: 2,
  },

  folderName: {
    flex: 1,
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '750',
  },

  file: {
    minHeight: 50,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },

  fileIconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },

  fileIcon: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '900',
  },

  fileInfo: {
    flex: 1,
    marginLeft: 7,
  },

  fileName: {
    fontSize: 12,
    fontWeight: '750',
  },

  fileLanguage: {
    fontSize: 9,
    marginTop: 2,
  },

  emptyFolderContainer: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginVertical: 2,
    borderWidth: StyleSheet.hairlineWidth,
  },

  emptyFolder: {
    fontSize: 9,
    fontStyle: 'italic',
  },

  emptyContainer: {
    marginHorizontal: 10,
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },

  emptyIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },

  emptyIconText: {
    fontSize: 22,
    fontWeight: '500',
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: '850',
  },

  emptyText: {
    fontSize: 10,
    marginTop: 6,
    lineHeight: 16,
    textAlign: 'center',
  },

  footer: {
    minHeight: 38,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  footerPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },

  footerText: {
    fontSize: 9,
    fontWeight: '600',
  },
});
