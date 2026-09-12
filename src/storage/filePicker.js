import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

const TEXT_EXTENSIONS = [
  'html', 'htm', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'md', 'txt',
  'xml', 'svg', 'php', 'py', 'java', 'kt', 'kts', 'c', 'cpp', 'h', 'hpp',
  'cs', 'swift', 'dart', 'go', 'rs', 'sql', 'sh', 'yaml', 'yml', 'toml',
  'ini', 'env', 'gcode', 'nc', 'ngc', 'log',
];

function getExtension(name = '') {
  const cleanName = String(name).trim().toLowerCase();
  const lastDot = cleanName.lastIndexOf('.');

  return lastDot === -1 ? '' : cleanName.slice(lastDot + 1);
}

export function isSupportedTextFile(name = '') {
  const extension = getExtension(name);

  // Les fichiers sans extension sont également acceptés.
  return !extension || TEXT_EXTENSIONS.includes(extension);
}

export function sanitizeFileName(name = 'untitled.txt') {
  const value = String(name)
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_');

  return value || 'untitled.txt';
}

export async function pickFile() {
  const result = await DocumentPicker.getDocumentAsync({
    // * / * permet de sélectionner les fichiers de code
    // même lorsque Android leur attribue un type MIME générique.
    type: '*/*',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) {
    return {
      canceled: true,
      asset: null,
      content: null,
    };
  }

  const asset = result.assets[0];

  const name = sanitizeFileName(
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

  try {
    const sourceFile = new File(asset.uri);
    const content = await sourceFile.text();

    return {
      canceled: false,
      asset,
      name,
      content,
      uri: asset.uri,
      mimeType: asset.mimeType || 'text/plain',
      size:
        typeof asset.size === 'number'
          ? asset.size
          : null,
      lastModified:
        typeof asset.lastModified === 'number'
          ? asset.lastModified
          : null,
    };
  } catch (error) {
    throw new Error(
      `Impossible de lire "${name}" : ${
        error?.message || 'erreur inconnue'
      }`
    );
  }
}

export async function pickTextFile() {
  return pickFile();
}

export default {
  pickFile,
  pickTextFile,
  isSupportedTextFile,
  sanitizeFileName,
};
