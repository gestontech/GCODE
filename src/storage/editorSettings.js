import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@gcode_editor_settings_v3';

const DEFAULT_SETTINGS = {
  autoSave: true,
  lineNumbers: true,
};

function normalizeSettings(settings) {
  return {
    autoSave:
      typeof settings?.autoSave === 'boolean'
        ? settings.autoSave
        : DEFAULT_SETTINGS.autoSave,

    lineNumbers:
      typeof settings?.lineNumbers === 'boolean'
        ? settings.lineNumbers
        : DEFAULT_SETTINGS.lineNumbers,
  };
}

export async function loadEditorSettings() {
  try {
    const stored =
      await AsyncStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return { ...DEFAULT_SETTINGS };
    }

    const parsed = JSON.parse(stored);

    return normalizeSettings(parsed);
  } catch (error) {
    console.error(
      'Erreur de chargement des paramètres éditeur:',
      error
    );

    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveEditorSettings(settings) {
  const normalized =
    normalizeSettings(settings);

  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalized)
    );

    return normalized;
  } catch (error) {
    console.error(
      'Erreur de sauvegarde des paramètres éditeur:',
      error
    );

    return null;
  }
}

export async function updateEditorSetting(
  key,
  value
) {
  const current =
    await loadEditorSettings();

  const next = normalizeSettings({
    ...current,
    [key]: value,
  });

  return saveEditorSettings(next);
}

export function getDefaultEditorSettings() {
  return { ...DEFAULT_SETTINGS };
}
