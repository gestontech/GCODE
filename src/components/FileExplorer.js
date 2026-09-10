import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

function getFileIcon(name = '') {
  const extension = name.split('.').pop()?.toLowerCase();

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
  const extension = name.split('.').pop()?.toLowerCase();

  if (extension === 'html' || extension === 'htm') {
    return 'html';
  }

  if (extension === 'css') {
    return 'css';
  }

  if (['js', 'jsx'].includes(extension)) {
    return 'javascript';
  }

  if (['ts', 'tsx'].includes(extension)) {
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

function createId(prefix = 'file') {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
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
  const { colors, spacing, radius } = useTheme();

  const [expandedFolders, setExpandedFolders] = useState(
    new Set(['root'])
  );

  const [menuVisible, setMenuVisible] = useState(false);

  const files = useMemo(() => {
    if (!Array.isArray(project?.files)) {
      return [];
    }

    return project.files;
  }, [project?.files]);

  const folders = useMemo(() => {
    if (!Array.isArray(project?.folders)) {
      return [];
    }

    return project.folders;
  }, [project?.folders]);

  const toggleFolder = (folderId) => {
    setExpandedFolders((previous) => {
      const next = new Set(previous);

      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }

      return next;
    });
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const requestCreateFile = () => {
    closeMenu();

    if (onCreateFile) {
      onCreateFile();
      return;
    }

    Alert.alert(
      'Nouveau fichier',
      'La création réelle sera raccordée au stockage à l’étape suivante.'
    );
  };

  const requestCreateFolder = () => {
    closeMenu();

    if (onCreateFolder) {
      onCreateFolder();
      return;
    }

    Alert.alert(
      'Nouveau dossier',
      'La création réelle sera raccordée au stockage à l’étape suivante.'
    );
  };

  const requestRenameFile = (file) => {
    Alert.prompt?.(
      'Renommer le fichier',
      `Nouveau nom pour ${file.name}`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Renommer',
          onPress: (value) => {
            const name = value?.trim();

            if (!name) {
              return;
            }

            onRenameFile?.(file, name);
          },
        },
      ],
      'plain-text',
      file.name
    );

    if (!Alert.prompt) {
      Alert.alert(
        'Renommer',
        'La saisie du nouveau nom sera activée dans la prochaine étape.'
      );
    }
  };

  const requestDeleteFile = (file) => {
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
          onPress: () => {
            onDeleteFile?.(file);
          },
        },
      ]
    );
  };

  const requestRenameFolder = (folder) => {
    Alert.prompt?.(
      'Renommer le dossier',
      `Nouveau nom pour ${folder.name}`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Renommer',
          onPress: (value) => {
            const name = value?.trim();

            if (!name) {
              return;
            }

            onRenameFolder?.(folder, name);
          },
        },
      ],
      'plain-text',
      folder.name
    );

    if (!Alert.prompt) {
      Alert.alert(
        'Renommer',
        'La saisie du nouveau nom sera activée dans la prochaine étape.'
      );
    }
  };

  const requestDeleteFolder = (folder) => {
    Alert.alert(
      'Supprimer le dossier',
      `Voulez-vous vraiment supprimer « ${folder.name} » et son contenu ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            onDeleteFolder?.(folder);
          },
        },
      ]
    );
  };

  const renderFile = (file, index) => {
    const isActive = activeFile?.id === file.id;

    return (
      <View key={file.id || `${file.name}-${index}`}>
        <Pressable
          onPress={() => onOpenFile?.(file)}
          onLongPress={() => {
            Alert.alert(
              file.name,
              'Choisissez une action',
              [
                {
                  text: 'Renommer',
                  onPress: () => requestRenameFile(file),
                },
                {
                  text: 'Supprimer',
                  style: 'destructive',
                  onPress: () => requestDeleteFile(file),
                },
                {
                  text: 'Annuler',
                  style: 'cancel',
                },
              ]
            );
          }}
          style={({ pressed }) => [
            styles.file,
            {
              paddingLeft: 40,
              backgroundColor: isActive
                ? colors.panel2
                : 'transparent',
              opacity: pressed ? 0.7 : 1,
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
            {getFileIcon(file.name)}
          </Text>

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

          <Text style={styles.language}>
            {getLanguage(file.name)}
          </Text>
        </Pressable>
      </View>
    );
  };

  const renderFolder = (folder, index) => {
    const folderId =
      folder.id || folder.path || `folder-${index}`;

    const expanded = expandedFolders.has(folderId);

    const folderFiles = files.filter((file) => {
      const parentId =
        file.folderId ||
        file.parentId ||
        '';

      return parentId === folderId;
    });

    return (
      <View key={folderId}>
        <Pressable
          onPress={() => toggleFolder(folderId)}
          onLongPress={() => {
            Alert.alert(
              folder.name,
              'Choisissez une action',
              [
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
          }}
          style={({ pressed }) => [
            styles.folder,
            {
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.arrow,
              { color: colors.muted },
            ]}
          >
            {expanded ? '⌄' : '›'}
          </Text>

          <Text
            style={[
              styles.folderIcon,
              { color: colors.purple },
            ]}
          >
            □
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.folderName,
              { color: colors.text },
            ]}
          >
            {folder.name}
          </Text>
        </Pressable>

        {expanded &&
          folderFiles.map((file, fileIndex) =>
            renderFile(file, fileIndex)
          )}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.panel,
        },
      ]}
    >
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerText}>
          <Text
            style={[
              styles.title,
              { color: colors.muted },
            ]}
          >
            EXPLORATEUR
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.projectName,
              { color: colors.text },
            ]}
          >
            {project?.name || 'GCODE'}
          </Text>
        </View>

        <Pressable
          onPress={() =>
            setMenuVisible((value) => !value)
          }
          style={({ pressed }) => [
            styles.moreButton,
            {
              backgroundColor: colors.panel2,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.moreText,
              { color: colors.text },
            ]}
          >
            ⋮
          </Text>
        </Pressable>
      </View>

      {menuVisible && (
        <View
          style={[
            styles.actionMenu,
            {
              backgroundColor: colors.panel2,
              borderColor: colors.border,
              borderRadius: radius.md,
            },
          ]}
        >
          <Pressable
            onPress={requestCreateFile}
            style={styles.menuItem}
          >
            <Text
              style={[
                styles.menuIcon,
                { color: colors.blue },
              ]}
            >
              ＋
            </Text>

            <Text
              style={[
                styles.menuText,
                { color: colors.text },
              ]}
            >
              Nouveau fichier
            </Text>
          </Pressable>

          <Pressable
            onPress={requestCreateFolder}
            style={styles.menuItem}
          >
            <Text
              style={[
                styles.menuIcon,
                { color: colors.purple },
              ]}
            >
              □
            </Text>

            <Text
              style={[
                styles.menuText,
                { color: colors.text },
              ]}
            >
              Nouveau dossier
            </Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: spacing.lg,
          },
        ]}
      >
        <Pressable
          onPress={() => toggleFolder('root')}
          style={styles.rootFolder}
        >
          <Text
            style={[
              styles.arrow,
              { color: colors.muted },
            ]}
          >
            {expandedFolders.has('root')
              ? '⌄'
              : '›'}
          </Text>

          <Text
            style={[
              styles.folderIcon,
              { color: colors.purple },
            ]}
          >
            □
          </Text>

          <Text
            style={[
              styles.folderName,
              { color: colors.text },
            ]}
          >
            projet
          </Text>
        </Pressable>

        {expandedFolders.has('root') && (
          <>
            {folders.map(renderFolder)}

            {files
              .filter(
                (file) =>
                  !file.folderId &&
                  !file.parentId
              )
              .map(renderFile)}

            {folders.length === 0 &&
              files.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text
                    style={[
                      styles.emptyTitle,
                      { color: colors.text },
                    ]}
                  >
                    Aucun fichier
                  </Text>

                  <Text
                    style={[
                      styles.emptyText,
                      { color: colors.muted },
                    ]}
                  >
                    Utilise ＋ pour commencer.
                  </Text>
                </View>
              )}
          </>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
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
          {files.length} fichier
          {files.length !== 1 ? 's' : ''}
          {folders.length > 0
            ? ` • ${folders.length} dossier${
                folders.length !== 1 ? 's' : ''
              }`
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
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  projectName: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 5,
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
    lineHeight: 24,
    fontWeight: '700',
  },

  actionMenu: {
    position: 'absolute',
    top: 62,
    right: 12,
    zIndex: 50,
    minWidth: 210,
    borderWidth: 1,
    paddingVertical: 6,
    elevation: 8,
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
    fontWeight: '800',
  },

  menuText: {
    fontSize: 13,
    fontWeight: '600',
  },

  content: {
    paddingVertical: 8,
  },

  rootFolder: {
    height: 40,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  folder: {
    minHeight: 40,
    paddingLeft: 24,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  arrow: {
    width: 20,
    fontSize: 17,
    textAlign: 'center',
  },

  folderIcon: {
    fontSize: 15,
    marginRight: 8,
  },

  folderName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },

  file: {
    minHeight: 40,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  fileIcon: {
    width: 28,
    fontSize: 13,
    fontWeight: '800',
  },

  fileName: {
    flex: 1,
    fontSize: 13,
  },

  language: {
    display: 'none',
  },

  emptyContainer: {
    paddingHorizontal: 38,
    paddingVertical: 22,
  },

  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
  },

  emptyText: {
    marginTop: 5,
    fontSize: 12,
  },

  footer: {
    minHeight: 32,
    borderTopWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },

  footerText: {
    fontSize: 10,
  },
});
