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

function createDefaultFiles() {
  return [
    {
      id: 'index.html',
      name: 'index.html',
      language: 'html',
      content: DEFAULT_HTML,
    },
    {
      id: 'style.css',
      name: 'style.css',
      language: 'css',
      content: DEFAULT_CSS,
    },
    {
      id: 'script.js',
      name: 'script.js',
      language: 'javascript',
      content: DEFAULT_JS,
    },
  ];
}

export function createProject(name = 'Nouveau projet') {
  const now = Date.now();

  return {
    id: `project-${now}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,

    name,

    createdAt: now,
    updatedAt: now,

    files: createDefaultFiles(),

    // Compatibilité avec les anciennes versions
    code: DEFAULT_HTML,
  };
}

function migrateProject(project) {
  if (!project || typeof project !== 'object') {
    return null;
  }

  const migrated = {
    ...project,
  };

  // Ancienne version : project.code uniquement
  if (
    !Array.isArray(migrated.files) ||
    migrated.files.length === 0
  ) {
    const files = createDefaultFiles();

    if (
      typeof migrated.code === 'string' &&
      migrated.code.trim().length > 0
    ) {
      files[0].content = migrated.code;
    }

    migrated.files = files;
  } else {
    migrated.files = migrated.files.map(
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
          detectLanguage(file.name),

        content:
          typeof file.content === 'string'
            ? file.content
            : '',
      })
    );
  }

  // Garantit qu'un index.html existe
  const hasHtml = migrated.files.some(
    (file) =>
      file.name === 'index.html'
  );

  if (!hasHtml) {
    migrated.files.unshift({
      id: 'index.html',
      name: 'index.html',
      language: 'html',
      content:
        typeof migrated.code === 'string'
          ? migrated.code
          : DEFAULT_HTML,
    });
  }

  const htmlFile = migrated.files.find(
    (file) =>
      file.name === 'index.html'
  );

  migrated.code =
    htmlFile?.content ||
    migrated.code ||
    '';

  migrated.createdAt =
    migrated.createdAt || Date.now();

  migrated.updatedAt =
    migrated.updatedAt || Date.now();

  migrated.name =
    migrated.name || 'Nouveau projet';

  migrated.id =
    migrated.id ||
    `project-${Date.now()}`;

  return migrated;
}

function detectLanguage(fileName = '') {
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

  return 'plaintext';
}

export async function loadProjects() {
  try {
    const stored =
      await AsyncStorage.getItem(
        STORAGE_KEY
      );

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

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

export async function saveProjects(
  projects
) {
  try {
    const safeProjects = Array.isArray(
      projects
    )
      ? projects
          .map(migrateProject)
          .filter(Boolean)
      : [];

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(safeProjects)
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

export function updateProjectFile(
  project,
  fileId,
  content
) {
  if (!project) {
    return project;
  }

  const files = Array.isArray(
    project.files
  )
    ? project.files
    : createDefaultFiles();

  const updatedFiles = files.map(
    (file) =>
      file.id === fileId
        ? {
            ...file,
            content,
          }
        : file
  );

  const updatedFile =
    updatedFiles.find(
      (file) => file.id === fileId
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
