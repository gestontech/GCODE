import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@gcode_projects_v3';

const createDefaultFiles = () => ({
  'index.js': `// Bienvenue dans GCODE
// Commence à coder ici.

function hello() {
  console.log("Hello from GCODE!");
}

hello();`,

  'README.md': `# Mon projet GCODE

Bienvenue dans ton projet.

Créé avec GCODE.`,

  'package.json': `{
  "name": "gcode-project",
  "version": "1.0.0",
  "private": true
}`,
});

export async function loadProjects() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const projects = JSON.parse(stored);

    if (!Array.isArray(projects)) {
      return [];
    }

    return projects;
  } catch (error) {
    console.warn(
      '[GCODE] Impossible de charger les projets :',
      error
    );

    return [];
  }
}

export async function saveProjects(projects) {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(projects)
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
  const projects = await loadProjects();

  const now = new Date().toISOString();
  const defaultFiles = createDefaultFiles();

  const project = {
    id: `project_${Date.now()}`,
    name: name.trim() || 'Nouveau projet',

    createdAt: now,
    updatedAt: now,

    fileName: 'index.js',
    activeFile: 'index.js',

    code: defaultFiles['index.js'],

    files: defaultFiles,

    preview: '',

    language: 'javascript',

    local: true,
  };

  const updatedProjects = [
    project,
    ...projects,
  ];

  await saveProjects(updatedProjects);

  return project;
}

export async function updateProject(
  projectId,
  changes = {}
) {
  const projects = await loadProjects();

  const index = projects.findIndex(
    (project) => project.id === projectId
  );

  if (index === -1) {
    return null;
  }

  const updatedProject = {
    ...projects[index],
    ...changes,
    updatedAt: new Date().toISOString(),
  };

  const updatedProjects = [...projects];

  updatedProjects[index] = updatedProject;

  await saveProjects(updatedProjects);

  return updatedProject;
}

export async function saveProjectFile(
  projectId,
  fileName,
  content
) {
  const projects = await loadProjects();

  const index = projects.findIndex(
    (project) => project.id === projectId
  );

  if (index === -1) {
    return null;
  }

  const project = projects[index];

  const files = {
    ...(project.files || {}),
    [fileName]: content,
  };

  const updatedProject = {
    ...project,

    files,

    fileName,

    activeFile: fileName,

    code: content,

    updatedAt: new Date().toISOString(),
  };

  const updatedProjects = [...projects];

  updatedProjects[index] = updatedProject;

  await saveProjects(updatedProjects);

  return updatedProject;
}

export async function getProjectFile(
  projectId,
  fileName
) {
  const projects = await loadProjects();

  const project = projects.find(
    (item) => item.id === projectId
  );

  if (!project || !project.files) {
    return null;
  }

  return project.files[fileName] ?? null;
}

export async function addProjectFile(
  projectId,
  fileName,
  content = ''
) {
  const projects = await loadProjects();

  const index = projects.findIndex(
    (project) => project.id === projectId
  );

  if (index === -1) {
    return null;
  }

  const project = projects[index];

  const files = {
    ...(project.files || {}),
    [fileName]: content,
  };

  const updatedProject = {
    ...project,
    files,
    updatedAt: new Date().toISOString(),
  };

  const updatedProjects = [...projects];

  updatedProjects[index] = updatedProject;

  await saveProjects(updatedProjects);

  return updatedProject;
}

export async function deleteProjectFile(
  projectId,
  fileName
) {
  const projects = await loadProjects();

  const index = projects.findIndex(
    (project) => project.id === projectId
  );

  if (index === -1) {
    return null;
  }

  const project = projects[index];

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

  const remainingFiles = Object.keys(files);

  const activeFile =
    project.activeFile === fileName
      ? remainingFiles[0] || null
      : project.activeFile;

  const updatedProject = {
    ...project,

    files,

    activeFile,

    fileName: activeFile,

    code: activeFile
      ? files[activeFile] || ''
      : '',

    updatedAt: new Date().toISOString(),
  };

  const updatedProjects = [...projects];

  updatedProjects[index] = updatedProject;

  await saveProjects(updatedProjects);

  return updatedProject;
}

export async function renameProjectFile(
  projectId,
  oldName,
  newName
) {
  const projects = await loadProjects();

  const index = projects.findIndex(
    (project) => project.id === projectId
  );

  if (index === -1) {
    return null;
  }

  const project = projects[index];

  const files = {
    ...(project.files || {}),
  };

  // Important :
  // on vérifie l'existence de la clé,
  // et non la valeur du fichier.
  //
  // Ainsi, un fichier vide ("") peut aussi
  // être correctement renommé.
  const oldFileExists =
    Object.prototype.hasOwnProperty.call(
      files,
      oldName
    );

  if (!oldFileExists) {
    return project;
  }

  if (
    oldName !== newName &&
    Object.prototype.hasOwnProperty.call(
      files,
      newName
    )
  ) {
    return project;
  }

  files[newName] = files[oldName];

  delete files[oldName];

  const activeFile =
    project.activeFile === oldName
      ? newName
      : project.activeFile;

  const updatedProject = {
    ...project,

    files,

    activeFile,

    fileName:
      project.fileName === oldName
        ? newName
        : project.fileName,

    code:
      activeFile
        ? files[activeFile] || ''
        : '',

    updatedAt: new Date().toISOString(),
  };

  const updatedProjects = [...projects];

  updatedProjects[index] = updatedProject;

  await saveProjects(updatedProjects);

  return updatedProject;
}

export async function deleteProject(
  projectId
) {
  const projects = await loadProjects();

  const updatedProjects = projects.filter(
    (project) => project.id !== projectId
  );

  await saveProjects(updatedProjects);

  return updatedProjects;
}

export async function clearAllProjects() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);

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
  const projects = await loadProjects();

  return projects.some(
    (project) => project.id === projectId
  );
}

export async function getProject(
  projectId
) {
  const projects = await loadProjects();

  return (
    projects.find(
      (project) => project.id === projectId
    ) || null
  );
}
