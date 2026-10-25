# README packaging desktop

Notes de reprise pour l’application desktop. Lire d’abord le [README racine](../README.md).

## État observé

- `main.cjs` est le point d’entrée Electron.
- `package.json` déclare les scripts `package:win` et `package:linux`.
- Le projet Android est optionnel et ignoré par Git.
- La configuration de packaging est dans `package.json`.
- Les builds APK/EXE ne sont pas confirmés comme ayant été exécutés ou validés.
- Aucun workflow GitHub Actions de build n’est confirmé.

## Règles

- Le packaging vise le dashboard ; ne pas intégrer la landing page comme une fonctionnalité privée du dashboard.
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
