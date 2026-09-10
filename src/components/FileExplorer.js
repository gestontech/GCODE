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
  const {
    colors,
    spacing,
    radius,
  } = useTheme();

  const [expandedFolders, setExpandedFolders] =
    useState(
      new Set(['root'])
    );

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

  /*
   * Ouvre/ferme un dossier.
   */
  function toggleFolder(folderId) {
    setExpandedFolders(
      (previous) => {
        const next =
          new Set(previous);

        if (
          next.has(folderId)
        ) {
          next.delete(folderId);
        } else {
          next.add(folderId);
        }

        return next;
      }
    );
  }

  /*
   * Menu création.
   */
  function requestCreateFile() {
    setMenuVisible(false);
    onCreateFile?.();
  }

  function requestCreateFolder() {
    setMenuVisible(false);
    onCreateFolder?.();
  }

  /*
   * Actions fichier.
   */
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

    if (
      file.name === 'index.html'
    ) {
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

  /*
   * Actions dossier.
   */
  function requestRenameFolder(
    folder
  ) {
    if (!folder) {
      return;
    }

    onRenameFolder?.(folder);
  }

  function requestDeleteFolder(
    folder
  ) {
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
            onDeleteFolder?.(
              folder
            ),
        },
      ]
    );
  }

  /*
   * Menu contextuel fichier.
   */
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
            requestRenameFile(
              file
            ),
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () =>
            requestDeleteFile(
              file
            ),
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  }

  /*
   * Menu contextuel dossier.
   */
  function showFolderActions(
    folder
  ) {
    Alert.alert(
      folder.name,
      'Choisissez une action',
      [
        {
          text: 'Ouvrir / Fermer',
          onPress: () =>
            toggleFolder(
              folder.id
            ),
        },
        {
          text: 'Renommer',
          onPress: () =>
            requestRenameFolder(
              folder
            ),
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () =>
            requestDeleteFolder(
              folder
            ),
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  }

  /*
   * Récupère les fichiers d'un dossier.
   */
  function getFilesForFolder(
    folderId
  ) {
    return files.filter(
      (file) =>
        (file.folderId ||
          file.parentId ||
          null) === folderId
    );
  }

  /*
   * Récupère les sous-dossiers.
   */
  function getChildrenForFolder(
    folderId
  ) {
    return folders.filter(
      (folder) =>
        (folder.parentId ||
          null) === folderId
    );
  }

  /*
   * Rend un fichier.
   */
  function renderFile(
    file,
    depth = 0
  ) {
    const isActive =
      activeFile?.id ===
      file.id;

    return (
      <Pressable
        key={file.id}
        onPress={() =>
          onOpenFile?.(file)
        }
        onLongPress={() =>
          showFileActions(file)
        }
        style={({ pressed }) => [
          styles.file,
          {
            paddingLeft:
              14 +
              depth * 18,
            backgroundColor:
              isActive
                ? colors.panel2
                : 'transparent',
            opacity:
              pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.fileIcon,
            {
              color: isActive
                ? colors.blue
                : colors.purple,
            },
          ]}
        >
          {getFileIcon(
            file.name
          )}
        </Text>

        <View
          style={
            styles.fileInfo
          }
        >
          <Text
            numberOfLines={1}
            style={[
              styles.fileName,
              {
                color: isActive
                  ? colors.text
                  : colors.muted,
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
                  colors.muted,
              },
            ]}
          >
            {getLanguage(
              file.name
            )}
          </Text>
        </View>
      </Pressable>
    );
  }

  /*
   * Rend récursivement un dossier.
   */
  function renderFolder(
    folder,
    depth = 0
  ) {
    const folderId =
      folder.id;

    const expanded =
      expandedFolders.has(
        folderId
      );

    const childFolders =
      getChildrenForFolder(
        folderId
      );

    const folderFiles =
      getFilesForFolder(
        folderId
      );

    return (
      <View
        key={folderId}
      >
        <Pressable
          onPress={() =>
            toggleFolder(
              folderId
            )
          }
          onLongPress={() =>
            showFolderActions(
              folder
            )
          }
          style={({ pressed }) => [
            styles.folder,
            {
              paddingLeft:
                8 +
                depth * 18,
              opacity:
                pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.arrow,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            {expanded
              ? '⌄'
              : '›'}
          </Text>

          <Text
            style={[
              styles.folderIcon,
              {
                color:
                  colors.purple,
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

            {childFolders.length ===
              0 &&
              folderFiles.length ===
                0 && (
                <Text
                  style={[
                    styles.emptyFolder,
                    {
                      color:
                        colors.muted,
                      paddingLeft:
                        36 +
                        depth *
                          18,
                    },
                  ]}
                >
                  Dossier vide
                </Text>
              )}
          </View>
        )}
      </View>
    );
  }

  /*
   * Fichiers racine.
   */
  const rootFiles =
    files.filter(
      (file) =>
        !file.folderId &&
        !file.parentId
    );

  /*
   * Dossiers racine.
   */
  const rootFolders =
    folders.filter(
      (folder) =>
        !folder.parentId
    );

  const rootExpanded =
    expandedFolders.has(
      'root'
    );

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
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <View
          style={
            styles.headerText
          }
        >
          <Text
            style={[
              styles.title,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            EXPLORATEUR
          </Text>

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
            {project?.name ||
              'GCODE'}
          </Text>
        </View>

        <Pressable
          onPress={() =>
            setMenuVisible(
              (value) =>
                !value
            )
          }
          style={({ pressed }) => [
            styles.moreButton,
            {
              backgroundColor:
                colors.panel2,
              borderColor:
                colors.border,
              opacity:
                pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.moreText,
              {
                color:
                  colors.text,
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
                colors.panel2,
              borderColor:
                colors.border,
              borderRadius:
                radius.md,
            },
          ]}
        >
          <Pressable
            onPress={
              requestCreateFile
            }
            style={
              styles.menuItem
            }
          >
            <Text
              style={[
                styles.menuIcon,
                {
                  color:
                    colors.blue,
                },
              ]}
            >
              ＋
            </Text>

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
          </Pressable>

          <Pressable
            onPress={
              requestCreateFolder
            }
            style={
              styles.menuItem
            }
          >
            <Text
              style={[
                styles.menuIcon,
                {
                  color:
                    colors.purple,
                },
              ]}
            >
              □
            </Text>

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
          </Pressable>
        </View>
      )}

      {/* ARBRE */}
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
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
          onPress={() =>
            toggleFolder(
              'root'
            )
          }
          style={styles.rootFolder}
        >
          <Text
            style={[
              styles.arrow,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            {rootExpanded
              ? '⌄'
              : '›'}
          </Text>

          <Text
            style={[
              styles.folderIcon,
              {
                color:
                  colors.purple,
              },
            ]}
          >
            {rootExpanded
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
            projet
          </Text>
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

            {rootFolders.length ===
              0 &&
              rootFiles.length ===
                0 && (
                <View
                  style={
                    styles.emptyContainer
                  }
                >
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
                          colors.muted,
                      },
                    ]}
                  >
                    Utilise ⋮ pour
                    créer un fichier
                    ou un dossier.
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
            borderTopColor:
              colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.footerText,
            {
              color:
                colors.muted,
            },
          ]}
        >
          {files.length} fichier
          {files.length !== 1
            ? 's'
            : ''}
          {' • '}
          {folders.length} dossier
          {folders.length !== 1
            ? 's'
            : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    minHeight: 70,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerText: {
    flex: 1,
    paddingRight: 10,
  },

  title: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.9,
  },

  projectName: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },

  moreButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  moreText: {
    fontSize: 22,
    lineHeight: 22,
    fontWeight: '900',
  },

  actionMenu: {
    position: 'absolute',
    top: 62,
    right: 10,
    zIndex: 100,
    elevation: 12,
    minWidth: 190,
    borderWidth: 1,
    paddingVertical: 6,
  },

  menuItem: {
    minHeight: 46,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuIcon: {
    width: 28,
    fontSize: 17,
    fontWeight: '900',
  },

  menuText: {
    fontSize: 13,
    fontWeight: '700',
  },

  content: {
    paddingTop: 8,
  },

  rootFolder: {
    minHeight: 40,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  folder: {
    minHeight: 38,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  arrow: {
    width: 20,
    textAlign: 'center',
    fontSize: 17,
  },

  folderIcon: {
    width: 24,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },

  folderName: {
    flex: 1,
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '700',
  },

  file: {
    minHeight: 42,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  fileIcon: {
    width: 30,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '900',
  },

  fileInfo: {
    flex: 1,
    marginLeft: 3,
  },

  fileName: {
    fontSize: 12,
    fontWeight: '700',
  },

  fileLanguage: {
    fontSize: 9,
    marginTop: 2,
  },

  emptyContainer: {
    paddingHorizontal: 22,
    paddingVertical: 30,
  },

  emptyTitle: {
    fontSize: 13,
    fontWeight: '800',
  },

  emptyText: {
    fontSize: 11,
    marginTop: 5,
    lineHeight: 17,
  },

  emptyFolder: {
    fontSize: 10,
    fontStyle: 'italic',
    paddingVertical: 8,
  },

  footer: {
    minHeight: 32,
    borderTopWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  footerText: {
    fontSize: 9,
  },
});
