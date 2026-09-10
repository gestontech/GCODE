import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'gcode.v3.projects';

const starterCode = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mon projet GCODE</title>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #080a16;
  color: white;
  font-family: Arial, sans-serif;
}

.card {
  width: min(90%, 420px);
  padding: 40px;
  border-radius: 24px;
  background: #13172b;
  text-align: center;
}

h1 {
  margin-bottom: 10px;
}

button {
  border: 0;
  border-radius: 12px;
  padding: 14px 22px;
  background: #713cff;
  color: white;
  font-weight: bold;
}
</style>
</head>

<body>
  <main class="card">
    <h1>Bienvenue sur GCODE</h1>
    <p>Code. Build. Create.</p>
    <button>Commencer</button>
  </main>
</body>
</html>`;

export async function loadProjects() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);

    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('GCODE storage error:', error);
  }

  return [
    {
      id: 'starter-1',
      name: 'Portfolio Web',
      type: 'HTML · CSS · JS',
      code: starterCode,
      updatedAt: Date.now(),
    },
  ];
}

export async function saveProjects(projects) {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(projects)
    );
  } catch (error) {
    console.log('GCODE save error:', error);
  }
}

export function createProject(name) {
  return {
    id: `${Date.now()}-${Math.random()}`,
    name,
    type: 'HTML · CSS · JS',
    code: starterCode,
    updatedAt: Date.now(),
  };
}

export function deleteProject(projects, id) {
  return projects.filter((project) => project.id !== id);
}
