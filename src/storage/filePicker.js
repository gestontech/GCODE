import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

/**
 * Extensions texte acceptées par GCODE.
 */
const TEXT_EXTENSIONS = [
  'html',
  'htm',
  'css',
  'js',
  'jsx',
  'ts',
  'tsx',
  'json',
  'md',
  'txt',
  'xml',
  'svg',
  'php',
  'py',
  'java',
  'kt',
  'kts',
  'c',
  'cpp',
  'h',
  'hpp',
  'cs',
  'swift',
  'dart',
  'go',
  'rs',
  'sql',
  'sh',
  'yaml',
  'yml',
  'toml',
  'ini',
  'env',
  'gcode',
  'nc',
  'ngc',
  'log',
];

/**
 * Retourne l'extension d'un fichier.
 */
function getExtension(name = '') {
  const cleanName = String(name)
    .trim()
    .toLowerCase();

  const lastDot = cleanName.lastIndexOf('.');

  if (lastDot === -1) {
    return '';
  }

  return cleanName.slice(lastDot + 1);
}

/**
 * Vérifie si le fichier est un fichier texte exploitable
 * par l'éditeur GCODE.
 */
export function isSupportedTextFile(name = '') {
  const extension = getExtension(name);

  return (
    !extension ||
    TEXT_EXTENSIONS.includes(extension)
  );
}

/**
 * Nettoie le nom fourni par Android.
 */
export function sanitizeFileName(name = 'untitled.txt') {
  const value = String(name)
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_');

  return value || 'untitled.txt';
}

/**
 * Ouvre le vrai sélecteur de fichiers Android/iOS.
 *
 * Cette fonction ne simule rien :
 * elle ouvre réellement DocumentPicker.
 */
export async function pickFile() {
  const result =
    await DocumentPicker.getDocumentAsync({
      type: 'text/*',
      copyToCacheDirectory: true,
      multiple: false,
    });

  if (
    result.canceled ||
    !result.assets ||
    result.assets.length === 0
  ) {
    return {
      canceled: true,
      asset: null,
      content: null,
    };
  }

  const asset = result.assets[0];

  const name =
    sanitizeFileName(
      asset.name || 'untitled.txt'
    );

  if (!isSupportedTextFile(name)) {
    throw new Error(
      `Le fichier "${name}" n'est pas un fichier texte pris en charge par GCODE.`
    );
  }

  if (!asset.uri) {
    throw new Error(
      'Le sélecteur de fichiers n’a retourné aucun URI.'
    );
  }

  const sourceFile =
    new File(asset.uri);

  let content = '';

  try {
    content =
      await sourceFile.text();
  } catch (error) {
    throw new Error(
      `Impossible de lire "${name}" : ${
        error?.message ||
        'erreur inconnue'
      }`
    );
  }

  return {
    canceled: false,
    asset,
    name,
    content,
    uri: asset.uri,
    mimeType:
      asset.mimeType || 'text/plain',
    size:
      typeof asset.size === 'number'
        ? asset.size
        : null,
    lastModified:
      typeof asset.lastModified === 'number'
        ? asset.lastModified
        : null,
  };
}

/**
 * Sélectionne un fichier puis retourne
 * directement son contenu texte.
 */
export async function pickTextFile() {
  return pickFile();
}

export default {
  pickFile,
  pickTextFile,
  isSupportedTextFile,
  sanitizeFileName,
};
