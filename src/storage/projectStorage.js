import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@gcode_projects_v3';

/*
 * ============================================================
 * GCODE V3 — PROJECT STORAGE
 * ============================================================
 *
 * Stockage local persistant avec AsyncStorage.
 *
 * Nouveau projet :
 *   index.html
 *   style.css
 *   script.js
 *   README.md
 *   package.json
 *
 * Aucun serveur ni API externe obligatoire.
 * ============================================================
 */

const createDefaultFiles = (projectName = 'Mon projet GCODE') => ({
  'index.html': `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>${projectName}</title>
  <link rel="stylesheet" href="style.css" />
</head>

<body>
  <main class="app">
    <section class="card">
      <div class="badge">GCODE V3</div>

      <h1>Bienvenue dans GCODE</h1>

      <p>
        Ton projet fonctionne maintenant avec
        HTML, CSS et JavaScript.
      </p>

      <button id="helloButton">
        Tester JavaScript
      </button>

      <p id="message"></p>
    </section>
  </main>

  <script src="script.js"></script>
</body>
</html>
`,

  'style.css': `* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  background: #070914;
  color: #f5f7ff;
}

body {
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.card {
  width: 100%;
  max-width: 560px;
  padding: 32px;
  border-radius: 24px;
  background: #111525;
  border: 1px solid #252b42;
  text-align: center;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.35);
}

.badge {
  display: inline-flex;
  padding: 7px 12px;
  border-radius: 999px;
  background: #241b45;
  color: #b99cff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

h1 {
  margin: 20px 0 12px;
  font-size: 32px;
}

p {
  color: #9da6bd;
  line-height: 1.6;
}

button {
  margin-top: 16px;
  border: 0;
  border-radius: 12px;
  padding: 13px 20px;
  background: #7c4dff;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

button:active {
  transform: scale(0.98);
}

#message {
  min-height: 24px;
  margin-top: 18px;
  color: #70e0a3;
  font-weight: 600;
}
`,

  'script.js': `const button =
  document.getElementById('helloButton');

const message =
  document.getElementById('message');

button?.addEventListener('click', () => {
  message.textContent =
    'JavaScript fonctionne correctement dans GCODE !';

  console.log(
    'GCODE Preview : JavaScript fonctionne.'
  );
});
`,

  'README.md': `# ${projectName}

Projet créé avec **GCODE V3**.

## Fichiers

- \`index.html\` — structure de la page
- \`style.css\` — styles
- \`script.js\` — logique JavaScript
- \`README.md\` — documentation
- \`package.json\` — informations du projet

## Preview

Le projet peut être exécuté directement
dans le Preview intégré de GCODE.

## GCODE

Créé avec GCODE Mobile V3.
`,

  'package.json': `{
  "name": "${projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || 'gcode-project'}",
  "version": "1.0.0",
  "private": true,
  "description": "Projet créé avec GCODE V3"
}
`,
});

function normalizeProject(project) {
  if (!project || typeof project !== 'object') {
    return null;
  }

  const files =
    project.files &&
    typeof project.files === 'object'
      ? project.files
      : {};

  const fileNames = Object.keys(files);

  const activeFile =
    project.activeFile &&
    Object.prototype.hasOwnProperty.call(
      files,
      project.activeFile
    )
      ? project.activeFile
      : fileNames[0] || null;

  return {
    ...project,
    files,
    activeFile,
    fileName:
      activeFile || project.fileName || null,
    code:
      activeFile
        ? files[activeFile] ?? ''
        : project.code || '',
    local: true,
  };
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
      .map(normalizeProject)
      .filter(Boolean);
  } catch (error) {
    console.warn(
      '[GCODE] Impossible de charger les projets :',
      error
    );

    return [];
  }
}

export async function saveProjects(
  projects
) {
  try {
    const normalizedProjects =
      Array.isArray(projects)
        ? projects
            .map(normalizeProject)
            .filter(Boolean)
        : [];

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalizedProjects)
    );

    return true;
  } catch (error) {
    console.warn(
      '[GCODE] Impossible de sauvegarder les projets :',
      error
    );

    return false;
  }
}

export async function createProject(
  name = 'Nouveau projet'
) {
  const projects =
    await loadProjects();

  const projectName =
    String(name).trim() ||
    'Nouveau projet';

  const now =
    new Date().toISOString();

  const files =
    createDefaultFiles(projectName);

  const project = {
    id: `project_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`,

    name: projectName,

    createdAt: now,
    updatedAt: now,

    fileName: 'index.html',
    activeFile: 'index.html',

    code: files['index.html'],

    files,

    preview: '',

    language: 'html',

    local: true,

    version: 3,
  };

  const updatedProjects = [
    project,
    ...projects,
  ];

  await saveProjects(
    updatedProjects
  );

  return project;
}

export async function updateProject(
  projectId,
  changes = {}
) {
  const projects =
    await loadProjects();

  const index =
    projects.findIndex(
      (project) =>
        project.id === projectId
    );

  if (index === -1) {
    return null;
  }

  const current =
    projects[index];

  const updatedProject =
    normalizeProject({
      ...current,
      ...changes,
      updatedAt:
        new Date().toISOString(),
    });

  const updatedProjects = [
    ...projects,
  ];

  updatedProjects[index] =
    updatedProject;

  const saved =
    await saveProjects(
      updatedProjects
    );

  return saved
    ? updatedProject
    : null;
}

export async function saveProjectFile(
  projectId,
  fileName,
  content
) {
  const projects =
    await loadProjects();

  const index =
    projects.findIndex(
      (project) =>
        project.id === projectId
    );

  if (index === -1) {
    return null;
  }

  const project =
    projects[index];

  const files = {
    ...(project.files || {}),
    [fileName]: String(
      content ?? ''
    ),
  };

  const updatedProject =
    normalizeProject({
      ...project,

      files,

      fileName,

      activeFile: fileName,

      code: String(
        content ?? ''
      ),

      updatedAt:
        new Date().toISOString(),
    });

  const updatedProjects = [
    ...projects,
  ];

  updatedProjects[index] =
    updatedProject;

  const saved =
    await saveProjects(
      updatedProjects
    );

  return saved
    ? updatedProject
    : null;
}

export async function getProjectFile(
  projectId,
  fileName
) {
  const project =
    await getProject(projectId);

  if (!project?.files) {
    return null;
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      project.files,
      fileName
    )
  ) {
    return null;
  }

  return project.files[fileName];
}

export async function addProjectFile(
  projectId,
  fileName,
  content = ''
) {
  const projects =
    await loadProjects();

  const index =
    projects.findIndex(
      (project) =>
        project.id === projectId
    );

  if (index === -1) {
    return null;
  }

  const cleanName =
    String(fileName).trim();

  if (!cleanName) {
    return null;
  }

  const project =
    projects[index];

  const files = {
    ...(project.files || {}),
  };

  if (
    Object.prototype.hasOwnProperty.call(
      files,
      cleanName
    )
  ) {
    return project;
  }

  files[cleanName] =
    String(content ?? '');

  const updatedProject =
    normalizeProject({
      ...project,
      files,
      activeFile: cleanName,
      fileName: cleanName,
      code: files[cleanName],
      updatedAt:
        new Date().toISOString(),
    });

  const updatedProjects = [
    ...projects,
  ];

  updatedProjects[index] =
    updatedProject;

  const saved =
    await saveProjects(
      updatedProjects
    );

  return saved
    ? updatedProject
    : null;
}

export async function deleteProjectFile(
  projectId,
  fileName
) {
  const projects =
    await loadProjects();

  const index =
    projects.findIndex(
      (project) =>
        project.id === projectId
    );

  if (index === -1) {
    return null;
  }

  const project =
    projects[index];

  const files = {
    ...(project.files || {}),
  };

  const fileExists =
    Object.prototype.hasOwnProperty.call(
      files,
      fileName
    );

  if (!fileExists) {
    return project;
  }

  delete files[fileName];

  const remainingFiles =
    Object.keys(files);

  if (
    remainingFiles.length === 0
  ) {
    return project;
  }

  const activeFile =
    project.activeFile === fileName
      ? remainingFiles[0]
      : Object.prototype.hasOwnProperty.call(
          files,
          project.activeFile
        )
        ? project.activeFile
        : remainingFiles[0];

  const updatedProject =
    normalizeProject({
      ...project,

      files,

      activeFile,

      fileName: activeFile,

      code:
        files[activeFile] || '',

      updatedAt:
        new Date().toISOString(),
    });

  const updatedProjects = [
    ...projects,
  ];

  updatedProjects[index] =
    updatedProject;

  const saved =
    await saveProjects(
      updatedProjects
    );

  return saved
    ? updatedProject
    : null;
}

export async function renameProjectFile(
  projectId,
  oldName,
  newName
) {
  const projects =
    await loadProjects();

  const index =
    projects.findIndex(
      (project) =>
        project.id === projectId
    );

  if (index === -1) {
    return null;
  }

  const project =
    projects[index];

  const files = {
    ...(project.files || {}),
  };

  const oldFileExists =
    Object.prototype.hasOwnProperty.call(
      files,
      oldName
    );

  if (!oldFileExists) {
    return project;
  }

  const cleanNewName =
    String(newName).trim();

  if (!cleanNewName) {
    return project;
  }

  if (
    oldName !== cleanNewName &&
    Object.prototype.hasOwnProperty.call(
      files,
      cleanNewName
    )
  ) {
    return project;
  }

  files[cleanNewName] =
    files[oldName];

  delete files[oldName];

  const activeFile =
    project.activeFile === oldName
      ? cleanNewName
      : project.activeFile;

  const updatedProject =
    normalizeProject({
      ...project,

      files,

      activeFile,

      fileName:
        project.fileName === oldName
          ? cleanNewName
          : project.fileName,

      code:
        activeFile
          ? files[activeFile] || ''
          : '',

      updatedAt:
        new Date().toISOString(),
    });

  const updatedProjects = [
    ...projects,
  ];

  updatedProjects[index] =
    updatedProject;

  const saved =
    await saveProjects(
      updatedProjects
    );

  return saved
    ? updatedProject
    : null;
}

export async function deleteProject(
  projectId
) {
  const projects =
    await loadProjects();

  const updatedProjects =
    projects.filter(
      (project) =>
        project.id !== projectId
    );

  const saved =
    await saveProjects(
      updatedProjects
    );

  return saved
    ? updatedProjects
    : projects;
}

export async function clearAllProjects() {
  try {
    await AsyncStorage.removeItem(
      STORAGE_KEY
    );

    return true;
  } catch (error) {
    console.warn(
      '[GCODE] Impossible de supprimer les projets :',
      error
    );

    return false;
  }
}

export async function projectExists(
  projectId
) {
  const projects =
    await loadProjects();

  return projects.some(
    (project) =>
      project.id === projectId
  );
}

export async function getProject(
  projectId
) {
  const projects =
    await loadProjects();

  return (
    projects.find(
      (project) =>
        project.id === projectId
    ) || null
  );
}
