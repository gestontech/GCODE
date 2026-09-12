GCODE Mobile V3

GCODE est un environnement de développement mobile moderne permettant de créer, modifier, organiser et prévisualiser des projets directement depuis un appareil mobile.

L’objectif de GCODE est de proposer une expérience de développement professionnelle, pensée spécialement pour les smartphones et tablettes.

🚀 GCODE Mobile V3

Cette version V3 repose sur :

* React Native
* Expo SDK 54
* React 19
* React Native 0.81
* AsyncStorage
* React Native WebView
* GitHub Actions pour la compilation Android

✨ Fonctionnalités actuelles

🏠 Accueil

* Dashboard mobile
* Accès rapide aux projets
* Création de nouveaux projets
* Ouverture des projets existants
* Accès rapide à la prévisualisation

📁 Gestion des projets

* Création de projets
* Suppression de projets
* Ouverture de projets
* Persistance locale des projets
* Synchronisation de l’état des projets

📂 Gestionnaire de fichiers

* Création de fichiers
* Suppression de fichiers
* Renommage de fichiers
* Sélection du fichier actif
* Navigation entre les fichiers du projet

💻 Éditeur de code

* Édition réelle du code
* Numéros de lignes synchronisés
* Historique des modifications
* Annuler / rétablir
* Recherche
* Remplacement
* Sauvegarde manuelle
* Sauvegarde automatique configurable
* Indicateur de modification du fichier

🌐 Preview

* Prévisualisation HTML réelle
* Génération du document à partir des fichiers du projet
* Affichage dans WebView
* Accès direct à la preview depuis l’éditeur

⚙️ Paramètres

* Mode clair / sombre
* Auto-save configurable
* Numéros de lignes configurables
* Préparation pour les futures préférences de l’éditeur

💾 Stockage local

Les projets et paramètres sont conservés localement sur l’appareil grâce à AsyncStorage.

Aucune API externe n’est obligatoire pour utiliser les fonctionnalités principales de GCODE.

🧱 Structure principale

GCODE/
├── App.js
├── package.json
├── README.md
│
├── src/
│   ├── components/
│   │   └── BottomNav.js
│   │
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   ├── ProjectsScreen.js
│   │   ├── WorkbenchScreen.js
│   │   ├── PreviewScreen.js
│   │   └── SettingsScreen.js
│   │
│   ├── storage/
│   │   ├── projectStorage.js
│   │   └── editorSettings.js
│   │
│   └── theme/
│       └── ThemeContext.js
│
└── .github/
    └── workflows/
        └── android.yml

📦 Installation

Installer les dépendances :

npm install

Lancer GCODE :

npx expo start

Pour vérifier le projet :

npx expo-doctor

📱 Tester sur Android

Après avoir lancé Expo, le projet peut être testé avec Expo Go pendant le développement.

Pour produire une application Android native, le workflow GitHub Actions permet de générer automatiquement l’APK.

🤖 Compilation Android avec GitHub Actions

Le projet contient :

.github/workflows/android.yml

Le workflow :

1. récupère le dépôt ;
2. installe Node.js ;
3. installe les dépendances ;
4. vérifie Expo ;
5. génère le projet Android ;
6. configure Java ;
7. compile la version Release ;
8. vérifie l’APK ;
9. publie l’APK comme artifact GitHub Actions.

L’APK généré est nommé :

GCODE-Mobile-V3.apk

🛠️ Technologies

Technologie	Utilisation
React Native	Application mobile
Expo	Framework mobile
AsyncStorage	Stockage local
WebView	Prévisualisation web
GitHub Actions	Build Android
Gradle	Compilation Android
Java 17	Environnement de build

🔐 Fonctionnement hors ligne

Les fonctions principales de l’application ne nécessitent pas de serveur externe.

Les projets peuvent être créés et modifiés localement.

Les paramètres de l’éditeur sont également sauvegardés localement.

🔮 Évolution prévue

Les prochaines versions pourront intégrer progressivement :

* système de fichiers plus avancé ;
* import/export de projets ;
* gestion ZIP ;
* terminal réellement sécurisé ;
* intégration Git/GitHub réelle ;
* authentification ;
* synchronisation cloud ;
* collaboration ;
* assistant IA optionnel ;
* support avancé de différents frameworks ;
* outils de développement supplémentaires ;
* amélioration du moteur de preview ;
* système de plugins/extensions ;
* personnalisation avancée de l’éditeur.

Ces fonctionnalités seront ajoutées progressivement afin de conserver une application stable et réellement fonctionnelle.

🎯 Objectif du projet

GCODE a pour objectif de devenir un environnement de développement complet pour mobile, avec une expérience adaptée aux écrans tactiles et aux contraintes des smartphones.

Le projet privilégie :

* la stabilité ;
* les fonctionnalités réelles ;
* la simplicité d’utilisation ;
* la performance ;
* la sécurité ;
* l’expérience mobile ;
* l’absence de dépendances obligatoires à des services externes.

📄 Version

GCODE Mobile V3.0.0

Projet privé/public selon la configuration du dépôt GitHub.

⸻

Made with ❤️ for mobile developers.
