# README packaging desktop

Notes de reprise pour l’application desktop. Lire d’abord le [README racine](../README.md).

## État observé

- `main.cjs` est le point d’entrée Electron.
- Electron démarre le backend et SQLite dans le profil local de l’utilisateur (`app.getPath('userData')`). Les copies quotidiennes sont dans son sous-dossier `backups`; les sauvegardes téléchargées vont dans le dossier Téléchargements du système.
- `package.json` déclare les scripts `package:win` et `package:linux`.
- Les projets natifs Android et iOS sont générés pendant les workflows et ignorés par Git.
- La configuration de packaging est dans `package.json`.
- `public/payflow-icon.svg` sert de favicon et de source aux icônes PNG Linux dans `build/linux-icons`; `build/payflow-icon.ico` sert à l’installeur Windows et `build/payflow-icon.png` à la fenêtre Electron.
- Les builds APK/EXE ne sont pas confirmés comme ayant été exécutés ou validés.
- Les workflows GitHub Actions de build sont dans `.github/workflows/build-desktop.yml` et `.github/workflows/build-mobile.yml`.

## Règles

- Le packaging vise le dashboard ; ne pas intégrer la landing page comme une fonctionnalité privée du dashboard.
- Pour Android/iOS hébergé, configurer `CAPACITOR_SERVER_URL` avec la base Render; sans cette variable le wrapper cible l’URL Android Emulator de développement.
- Ne jamais embarquer `.env`, la base SQLite locale ou des clés utilisateur dans un artefact.
- Vérifier comment l’API locale et le stockage SQLite sont démarrés dans Electron avant tout changement.
- Ne pas promettre la portabilité des données ou un déploiement multi-utilisateur sans l’avoir implémenté et testé.

## Scripts déclarés

Depuis la racine du projet :

```bash
npm run build
npm run package:win
npm run package:linux
npm run cap:add:android
npm run cap:sync
npm run package:apk
```

Les outils de plateforme (Windows, JDK, Android SDK/Gradle) peuvent être nécessaires. Vérifier leur disponibilité et lire les scripts/configurations avant de lancer un packaging. Un script déclaré ne signifie pas que le build fonctionne sur la machine actuelle.
