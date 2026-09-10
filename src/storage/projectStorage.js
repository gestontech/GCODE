import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@gcode_projects_v3';

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Mon projet GCODE</title>
</head>
<body>
  <h1>Bienvenue dans GCODE</h1>
  <p>Commencez à créer votre projet.</p>
</body>
</html>`;

const DEFAULT_CSS = `body {
  margin: 0;
  padding: 40px;
  font-family: Arial, sans-serif;
  background: #070914;
  color: white;
}

h1 {
  margin-bottom: 10px;
}`;

const DEFAULT_JS = `console.log('GCODE Mobile V3');`;

function createId(prefix = 'item') {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function detectLanguage(fileName = '') {
  const extension =
    fileName.split('.').pop()?.toLowerCase();

  if (extension === 'html') {
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

  if (extension === 'xml') {
    return 'xml';
  }

  if (extension === 'md') {
    return 'markdown';
  }

  return 'plaintext';
}

function getDefaultContent(fileName = '') {
  const language = detectLanguage(fileName);

  if (language === 'html') {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Nouveau fichier</title>
</head>
<body>

</body>
</html>`;
  }

  if (language === 'css') {
    return `/* Nouveau fichier CSS */`;
  }

  if (language === 'javascript') {
    return `// Nouveau fichier JavaScript
`;
  }

  if (language === 'typescript') {
    return `// Nouveau fichier TypeScript
`;
  }

  if (language === 'json') {
    return `{
}`;
  }

  return '';
}

function createDefaultFiles() {
  return [
    {
      id: 'index.html',
      name: 'index.html',
      language: 'html',
      content: DEFAULT_HTML,
      folderId: null,
    },
    {
      id: 'style.css',
      name: 'style.css',
      language: 'css',
      content: DEFAULT_CSS,
      folderId: null,
    },
    {
      id: 'script.js',
      name: 'script.js',
      language: 'javascript',
      content: DEFAULT_JS,
      folderId: null,
    },
  ];
}

export function createProject(
  name = 'Nouveau projet'
) {
  const now = Date.now();

  return {
    id: createId('project'),

    name,

    createdAt: now,
    updatedAt: now,

    files: createDefaultFiles(),

    folders: [],

    // Compatibilité avec les anciennes versions
    code: DEFAULT_HTML,
  };
}

function migrateProject(project) {
  if (
    !project ||
    typeof project !== 'object'
  ) {
    return null;
  }

  const migrated = {
    ...project,
  };

  /*
   * MIGRATION DES FICHIERS
   */
  if (
    !Array.isArray(migrated.files) ||
    migrated.files.length === 0
  ) {
    const files = createDefaultFiles();

    if (
      typeof migrated.code === 'string' &&
      migrated.code.trim().length > 0
    ) {
      files[0].content =
        migrated.code;
    }

    migrated.files = files;
  } else {
    migrated.files =
      migrated.files.map(
        (file, index) => ({
          id:
            file.id ||
            file.name ||
            `file-${index}`,

          name:
            file.name ||
            file.id ||
            `file-${index}`,

          language:
            file.language ||
            detectLanguage(
              file.name || file.id
            ),

          content:
            typeof file.content ===
            'string'
              ? file.content
              : '',

          folderId:
            file.folderId ||
            file.parentId ||
            null,
        })
      );
  }

  /*
   * MIGRATION DES DOSSIERS
   */
  if (
    !Array.isArray(
      migrated.folders
    )
  ) {
    migrated.folders = [];
  } else {
    migrated.folders =
      migrated.folders.map(
        (folder, index) => ({
          id:
            folder.id ||
            `folder-${index}`,

          name:
            folder.name ||
            `Dossier ${index + 1}`,

          parentId:
            folder.parentId ||
            null,
        })
      );
  }

  /*
   * GARANTIT index.html
   */
  const hasHtml =
    migrated.files.some(
      (file) =>
        file.name === 'index.html'
    );

  if (!hasHtml) {
    migrated.files.unshift({
      id: 'index.html',
      name: 'index.html',
      language: 'html',
      content:
        typeof migrated.code ===
        'string'
          ? migrated.code
          : DEFAULT_HTML,
      folderId: null,
    });
  }

  /*
   * SYNCHRONISATION project.code
   */
  const htmlFile =
    migrated.files.find(
      (file) =>
        file.name === 'index.html'
    );

  migrated.code =
    htmlFile?.content ||
    migrated.code ||
    '';

  migrated.createdAt =
    migrated.createdAt ||
    Date.now();

  migrated.updatedAt =
    migrated.updatedAt ||
    Date.now();

  migrated.name =
    migrated.name ||
    'Nouveau projet';

  migrated.id =
    migrated.id ||
    createId('project');

  return migrated;
}

/*
 * CHARGER LES PROJETS
 */
export async function loadProjects() {
  try {
    const stored =
      await AsyncStorage.getItem(
        STORAGE_KEY
      );

    if (!stored) {
      return [];
    }

    const parsed =
      JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(migrateProject)
      .filter(Boolean);
  } catch (error) {
    console.error(
      'Impossible de charger les projets:',
      error
    );

    return [];
  }
}

/*
 * SAUVEGARDER LES PROJETS
 */
export async function saveProjects(
  projects
) {
  try {
    const safeProjects =
      Array.isArray(projects)
        ? projects
            .map(migrateProject)
            .filter(Boolean)
        : [];

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        safeProjects
      )
    );

    return true;
  } catch (error) {
    console.error(
      'Impossible de sauvegarder les projets:',
      error
    );

    return false;
  }
}

/*
 * SUPPRIMER UN PROJET
 */
export function deleteProject(
  projects,
  id
) {
  if (!Array.isArray(projects)) {
    return [];
  }

  return projects.filter(
    (project) =>
      project.id !== id
  );
}

/*
 * MODIFIER LE CONTENU D'UN FICHIER
 */
export function updateProjectFile(
  project,
  fileId,
  content
) {
  if (!project) {
    return project;
  }

  const files =
    Array.isArray(project.files)
      ? project.files
      : createDefaultFiles();

  const updatedFiles =
    files.map((file) =>
      file.id === fileId
        ? {
            ...file,
            content,
          }
        : file
    );

  const updatedFile =
    updatedFiles.find(
      (file) =>
        file.id === fileId
    );

  return {
    ...project,

    files: updatedFiles,

    code:
      updatedFile?.name ===
      'index.html'
        ? content
        : project.code,

    updatedAt: Date.now(),
  };
}

/*
 * CRÉER UN FICHIER
 */
export function createFile(
  project,
  name,
  content = '',
  folderId = null
) {
  if (!project) {
    return project;
  }

  const cleanName =
    String(name || '').trim();

  if (!cleanName) {
    return project;
  }

  const files =
    Array.isArray(project.files)
      ? project.files
      : [];

  const folders =
    Array.isArray(project.folders)
      ? project.folders
      : [];

  const duplicate =
    files.some(
      (file) =>
        file.folderId === folderId &&
        file.name.toLowerCase() ===
          cleanName.toLowerCase()
    );

  if (duplicate) {
    return project;
  }

  if (
    cleanName.includes('/') ||
    cleanName.includes('\\')
  ) {
    return project;
  }

  const file = {
    id: createId('file'),
    name: cleanName,
    language:
      detectLanguage(cleanName),
    content:
      typeof content === 'string'
        ? content
        : '',
    folderId:
      folders.some(
        (folder) =>
          folder.id === folderId
      )
        ? folderId
        : null,
  };

  return {
    ...project,

    files: [
      ...files,
      file,
    ],

    folders,

    updatedAt: Date.now(),
  };
}

/*
 * CRÉER UN DOSSIER
 */
export function createFolder(
  project,
  name,
  parentId = null
) {
  if (!project) {
    return project;
  }

  const cleanName =
    String(name || '').trim();

  if (!cleanName) {
    return project;
  }

  const folders =
    Array.isArray(project.folders)
      ? project.folders
      : [];

  const duplicate =
    folders.some(
      (folder) =>
        folder.parentId ===
          parentId &&
        folder.name.toLowerCase() ===
          cleanName.toLowerCase()
    );

  if (duplicate) {
    return project;
  }

  const validParent =
    parentId === null ||
    folders.some(
      (folder) =>
        folder.id === parentId
    );

  if (!validParent) {
    return project;
  }

  const folder = {
    id: createId('folder'),
    name: cleanName,
    parentId,
  };

  return {
    ...project,

    folders: [
      ...folders,
      folder,
    ],

    files:
      Array.isArray(project.files)
        ? project.files
        : [],

    updatedAt: Date.now(),
  };
}

/*
 * RENOMMER UN FICHIER
 */
export function renameFile(
  project,
  fileId,
  newName
) {
  if (!project) {
    return project;
  }

  const cleanName =
    String(newName || '').trim();

  if (
    !cleanName ||
    cleanName.includes('/') ||
    cleanName.includes('\\')
  ) {
    return project;
  }

  const files =
    Array.isArray(project.files)
      ? project.files
      : [];

  const target =
    files.find(
      (file) =>
        file.id === fileId
    );

  if (!target) {
    return project;
  }

  const duplicate =
    files.some(
      (file) =>
        file.id !== fileId &&
        file.folderId ===
          target.folderId &&
        file.name.toLowerCase() ===
          cleanName.toLowerCase()
    );

  if (duplicate) {
    return project;
  }

  const updatedFiles =
    files.map((file) =>
      file.id === fileId
        ? {
            ...file,
            name: cleanName,
            language:
              detectLanguage(
                cleanName
              ),
          }
        : file
    );

  return {
    ...project,

    files: updatedFiles,

    code:
      target.name ===
      'index.html'
        ? (
            updatedFiles.find(
              (file) =>
                file.id === fileId
            )?.content ||
            project.code
          )
        : project.code,

    updatedAt: Date.now(),
  };
}

/*
 * SUPPRIMER UN FICHIER
 */
export function deleteFile(
  project,
  fileId
) {
  if (!project) {
    return project;
  }

  const files =
    Array.isArray(project.files)
      ? project.files
      : [];

  const target =
    files.find(
      (file) =>
        file.id === fileId
    );

  if (!target) {
    return project;
  }

  /*
   * On protège index.html
   * car le preview en dépend.
   */
  if (
    target.name === 'index.html'
  ) {
    return project;
  }

  return {
    ...project,

    files: files.filter(
      (file) =>
        file.id !== fileId
    ),

    updatedAt: Date.now(),
  };
}

/*
 * RENOMMER UN DOSSIER
 */
export function renameFolder(
  project,
  folderId,
  newName
) {
  if (!project) {
    return project;
  }

  const cleanName =
    String(newName || '').trim();

  if (!cleanName) {
    return project;
  }

  const folders =
    Array.isArray(project.folders)
      ? project.folders
      : [];

  const target =
    folders.find(
      (folder) =>
        folder.id === folderId
    );

  if (!target) {
    return project;
  }

  const duplicate =
    folders.some(
      (folder) =>
        folder.id !== folderId &&
        folder.parentId ===
          target.parentId &&
        folder.name.toLowerCase() ===
          cleanName.toLowerCase()
    );

  if (duplicate) {
    return project;
  }

  return {
    ...project,

    folders: folders.map(
      (folder) =>
        folder.id === folderId
          ? {
              ...folder,
              name: cleanName,
            }
          : folder
    ),

    updatedAt: Date.now(),
  };
}

/*
 * SUPPRIMER UN DOSSIER
 *
 * Supprime également :
 * - les sous-dossiers
 * - les fichiers contenus
 */
export function deleteFolder(
  project,
  folderId
) {
  if (!project) {
    return project;
  }

  const folders =
    Array.isArray(project.folders)
      ? project.folders
      : [];

  const files =
    Array.isArray(project.files)
      ? project.files
      : [];

  const target =
    folders.find(
      (folder) =>
        folder.id === folderId
    );

  if (!target) {
    return project;
  }

  const folderIdsToDelete =
    new Set([folderId]);

  let changed = true;

  while (changed) {
    changed = false;

    folders.forEach(
      (folder) => {
        if (
          folder.parentId &&
          folderIdsToDelete.has(
            folder.parentId
          ) &&
          !folderIdsToDelete.has(
            folder.id
          )
        ) {
          folderIdsToDelete.add(
            folder.id
          );

          changed = true;
        }
      }
    );
  }

  return {
    ...project,

    folders:
      folders.filter(
        (folder) =>
          !folderIdsToDelete.has(
            folder.id
          )
      ),

    files:
      files.filter(
        (file) =>
          !file.folderId ||
          !folderIdsToDelete.has(
            file.folderId
          )
      ),

    updatedAt: Date.now(),
  };
}
