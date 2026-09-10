# GCODE — vraie base mobile Expo

Cette version est une application React Native/Expo mobile-first.

## Fonctionnel dans cette V1
- Interface GCODE sombre premium
- Dashboard
- Projets persistés localement avec AsyncStorage
- Création de projets
- Gestionnaire de fichiers UI
- Éditeur de code avec sauvegarde locale
- Preview HTML dans WebView
- Terminal UI
- Git/GitHub UI
- Assistant IA UI
- Paramètres
- Navigation mobile

## Lancer
```bash
npm install
npx expo start
```

Sur iPhone, installer Expo Go puis scanner le QR code.

## Build iOS
Le projet est préparé pour EAS Build.
```bash
npm install -g eas-cli
eas login
eas build --platform ios --profile production
eas submit --platform ios
```

Un compte Apple Developer payant est nécessaire pour publier sur l'App Store.

## À connecter pour une V2 production
- vrai fournisseur IA + backend sécurisé
- authentification
- GitHub OAuth/API
- cloud sync
- import/export ZIP complet
- vrai système de fichiers multi-projets
- terminal sandboxé (ne jamais exécuter des commandes arbitraires non isolées)
- moteur de preview/build complet pour React/Node/Python/PHP
- paiements/abonnements si nécessaires
