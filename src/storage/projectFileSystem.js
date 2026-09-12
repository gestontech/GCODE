import { Directory, File, Paths } from 'expo-file-system';

/*
 * ============================================================
 * GCODE V3 — REAL PROJECT FILESYSTEM
 * ============================================================
 *
 * Chaque projet GCODE possède maintenant un vrai dossier
 * physique dans le stockage privé de l'application.
 *
 * Structure :
 *
 * document/
 *   GCODE/
 *     projects/
 *       <projectId>/
 *         index.html
 *         style.css
 *         script.js
 *         README.md
 *         package.json
 *
 * AsyncStorage reste utilisé pour les métadonnées du projet.
 * Ce module gère les fichiers physiques.
 * ============================================================
 */

const ROOT_FOLDER = 'GCODE';
const PROJECTS_FOLDER = 'projects';

/* ------------------------------------------------------------
 * Sécurité des noms
 * ---------------------------------------------------------- */

function sanitizeSegment(value) {
  return String(value ?? '')
    .trim()
    .replace(/[<>:"|?*\x00-\x1F]/g, '_')
    .replace(/\\/g, '_')
    .replace(/\//g, '_')
    .replace(/\.\./g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 120);
}

function normalizeRelativePath(value = '') {
  return String(value)
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .filter((segment) => segment !== '.' && segment !== '..')
    .join('/');
}

/* ------------------------------------------------------------
 * Racine GCODE
 * ---------------------------------------------------------- */

function getGcodeDirectory() {
  return new Directory(
    Paths.document,
    ROOT_FOLDER
  );
}

function getProjectsDirectory() {
  return new Directory(
    getGcodeDirectory(),
    PROJECTS_FOLDER
  );
}

/* ------------------------------------------------------------
 * Projet
 * ---------------------------------------------------------- */

export function getProjectDirectory(projectId) {
  const safeId = sanitizeSegment(projectId);

  if (!safeId) {
    throw new Error(
      'Identifiant de projet invalide.'
    );
  }

  return new Directory(
    getProjectsDirectory(),
    safeId
  );
}

export function getProjectDirectoryUri(projectId) {
  return getProjectDirectory(projectId).uri;
}

/* ------------------------------------------------------------
 * Initialisation
 * ---------------------------------------------------------- */

export function ensureFilesystem() {
  const gcodeDirectory =
    getGcodeDirectory();

  gcodeDirectory.create({
    idempotent: true,
    intermediates: true,
  });

  const projectsDirectory =
    getProjectsDirectory();

  projectsDirectory.create({
    idempotent: true,
    intermediates: true,
  });

  return projectsDirectory;
}

/* ------------------------------------------------------------
 * Création du projet
 * ---------------------------------------------------------- */

export function ensureProjectDirectory(
  projectId
) {
  ensureFilesystem();

  const projectDirectory =
    getProjectDirectory(projectId);

  projectDirectory.create({
    idempotent: true,
    intermediates: true,
  });

  return projectDirectory;
}

/* ------------------------------------------------------------
 * Chemin sécurisé vers un fichier
 * ---------------------------------------------------------- */

export function getProjectFile(
  projectId,
  relativePath
) {
  const projectDirectory =
    ensureProjectDirectory(projectId);

  const cleanPath =
    normalizeRelativePath(relativePath);

  if (!cleanPath) {
    throw new Error(
      'Chemin de fichier invalide.'
    );
  }

  const segments =
    cleanPath.split('/');

  const fileName =
    segments.pop();

  if (!fileName) {
    throw new Error(
      'Nom de fichier invalide.'
    );
  }

  if (segments.length === 0) {
    return new File(
      projectDirectory,
      fileName
    );
  }

  const parentDirectory =
    new Directory(
      projectDirectory,
      ...segments
    );

  parentDirectory.create({
    idempotent: true,
    intermediates: true,
  });

  return new File(
    parentDirectory,
    fileName
  );
}

/* ------------------------------------------------------------
 * Écriture d'un fichier réel
 * ---------------------------------------------------------- */

export function writeProjectFile(
  projectId,
  relativePath,
  content = ''
) {
  const file =
    getProjectFile(
      projectId,
      relativePath
    );

  if (!file.exists) {
    file.create({
      intermediates: true,
    });
  }

  file.write(
    String(content ?? '')
  );

  return {
    uri: file.uri,
    path: relativePath,
    exists: file.exists,
    size: file.size,
  };
}

/* ------------------------------------------------------------
 * Lecture d'un fichier réel
 * ---------------------------------------------------------- */

export function readProjectFile(
  projectId,
  relativePath
) {
  const file =
    getProjectFile(
      projectId,
      relativePath
    );

  if (!file.exists) {
    return null;
  }

  return file.textSync();
}

/* ------------------------------------------------------------
 * Vérification
 * ---------------------------------------------------------- */

export function projectFileExists(
  projectId,
  relativePath
) {
  try {
    const file =
      getProjectFile(
        projectId,
        relativePath
      );

    return file.exists;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------
 * Suppression
 * ---------------------------------------------------------- */

export function deleteProjectFile(
  projectId,
  relativePath
) {
  const file =
    getProjectFile(
      projectId,
      relativePath
    );

  if (!file.exists) {
    return false;
  }

  file.delete();

  return true;
}

/* ------------------------------------------------------------
 * Renommage
 * ---------------------------------------------------------- */

export function renameProjectFile(
  projectId,
  oldPath,
  newName
) {
  const file =
    getProjectFile(
      projectId,
      oldPath
    );

  if (!file.exists) {
    return false;
  }

  const cleanName =
    sanitizeSegment(newName);

  if (!cleanName) {
    throw new Error(
      'Nouveau nom de fichier invalide.'
    );
  }

  file.rename(cleanName);

  return true;
}

/* ------------------------------------------------------------
 * Création d'un dossier
 * ---------------------------------------------------------- */

export function createProjectDirectory(
  projectId,
  relativePath
) {
  const projectDirectory =
    ensureProjectDirectory(projectId);

  const cleanPath =
    normalizeRelativePath(relativePath);

  if (!cleanPath) {
    return projectDirectory;
  }

  const segments =
    cleanPath
      .split('/')
      .map(sanitizeSegment)
      .filter(Boolean);

  if (segments.length === 0) {
    return projectDirectory;
  }

  const directory =
    new Directory(
      projectDirectory,
      ...segments
    );

  directory.create({
    idempotent: true,
    intermediates: true,
  });

  return directory;
}

/* ------------------------------------------------------------
 * Suppression d'un dossier
 * ---------------------------------------------------------- */

export function deleteProjectDirectory(
  projectId,
  relativePath
) {
  const projectDirectory =
    ensureProjectDirectory(projectId);

  const cleanPath =
    normalizeRelativePath(relativePath);

  if (!cleanPath) {
    return false;
  }

  const directory =
    new Directory(
      projectDirectory,
      ...cleanPath.split('/')
    );

  if (!directory.exists) {
    return false;
  }

  directory.delete();

  return true;
}

/* ------------------------------------------------------------
 * Listing
 * ---------------------------------------------------------- */

export function listProjectDirectory(
  projectId,
  relativePath = ''
) {
  const projectDirectory =
    ensureProjectDirectory(projectId);

  const cleanPath =
    normalizeRelativePath(relativePath);

  const directory =
    cleanPath
      ? new Directory(
          projectDirectory,
          ...cleanPath.split('/')
        )
      : projectDirectory;

  if (!directory.exists) {
    return [];
  }

  return directory.list().map((item) => ({
    name: item.name,
    uri: item.uri,
    type:
      item instanceof Directory
        ? 'directory'
        : 'file',
    size:
      item instanceof File
        ? item.size
        : null,
  }));
}

/* ------------------------------------------------------------
 * Synchronisation projet → filesystem
 * ---------------------------------------------------------- */

export function syncProjectToFilesystem(
  project
) {
  if (!project?.id) {
    throw new Error(
      'Projet invalide.'
    );
  }

  const projectDirectory =
    ensureProjectDirectory(
      project.id
    );

  const files =
    project.files &&
    typeof project.files === 'object'
      ? project.files
      : {};

  for (const [
    relativePath,
    content,
  ] of Object.entries(files)) {
    writeProjectFile(
      project.id,
      relativePath,
      content
    );
  }

  return {
    projectId: project.id,
    directory:
      projectDirectory.uri,
    files:
      Object.keys(files),
  };
}

/* ------------------------------------------------------------
 * Synchronisation fichier individuel
 * ---------------------------------------------------------- */

export function syncFileToFilesystem(
  projectId,
  fileName,
  content
) {
  return writeProjectFile(
    projectId,
    fileName,
    content
  );
}

/* ------------------------------------------------------------
 * Informations du projet
 * ---------------------------------------------------------- */

export function getProjectFilesystemInfo(
  projectId
) {
  const directory =
    ensureProjectDirectory(
      projectId
    );

  return {
    projectId,
    uri: directory.uri,
    exists: directory.exists,
    files: directory.list().map(
      (item) => ({
        name: item.name,
        uri: item.uri,
        type:
          item instanceof Directory
            ? 'directory'
            : 'file',
        size:
          item instanceof File
            ? item.size
            : null,
      })
    ),
  };
}

/* ------------------------------------------------------------
 * Suppression complète du projet
 * ---------------------------------------------------------- */

export function deleteProjectFilesystem(
  projectId
) {
  const directory =
    getProjectDirectory(projectId);

  if (!directory.exists) {
    return false;
  }

  directory.delete();

  return true;
}

/* ------------------------------------------------------------
 * Export
 * ---------------------------------------------------------- */

export default {
  ensureFilesystem,

  getProjectDirectory,
  getProjectDirectoryUri,

  ensureProjectDirectory,

  getProjectFile,

  writeProjectFile,
  readProjectFile,
  projectFileExists,

  deleteProjectFile,
  renameProjectFile,

  createProjectDirectory,
  deleteProjectDirectory,

  listProjectDirectory,

  syncProjectToFilesystem,
  syncFileToFilesystem,

  getProjectFilesystemInfo,

  deleteProjectFilesystem,
};
