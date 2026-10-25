# PayFlow — passation projet

Ce README est le point d’entrée pour toute personne ou IA qui reprend le projet. Il décrit l’état observé du code, pas une promesse de fonctionnalités futures.

## Consignes prioritaires pour la prochaine IA

1. Lire ce fichier, puis [`docs/README.md`](docs/README.md), [`server/README.md`](server/README.md) et [`src/README.md`](src/README.md).
2. Inspecter le code concerné avant de modifier quoi que ce soit. Certains documents de contexte peuvent être en avance sur l’implémentation.
3. Ne jamais lire, afficher ou copier le contenu de `.env`, de `database.sqlite` ou d’autres secrets/données locales.
4. Garder le flux de paiement manuel : le marchand crée et partage un lien, puis peut mettre à jour son statut dans le dashboard. Ne pas ajouter d’envoi automatique ni de webhook sans demande explicite.
5. Préserver l’isolation des comptes dans chaque requête et requête SQL.
6. Ne pas publier, pousser, committer ou déployer sans demande explicite.
7. Ne pas commencer les fonctionnalités proposées, la migration TypeScript ou l’utilitaire C avant d’avoir vérifié l’état courant et reçu une validation claire.

## État actuel vérifié

- Frontend React avec Vite, en JavaScript/JSX.
- Backend Express et persistance SQLite.
- Authentification locale avec sessions cookie et comptes distincts.
- Dashboard avec vue d’ensemble, transactions, liens, clients, analytique et paramètres.
- Création de liens PayGateGlobal à partir de la clé API configurée par compte.
- Statut des liens modifiable manuellement (`pending`, `paid`, `cancelled`).
- Landing page et dashboard ont des entrées séparées.
- Aucun webhook de paiement n’est nécessaire au parcours actuel.
- La compilation `npm run build` a réussi lors de la dernière vérification. Vite signale un bundle dashboard supérieur à 500 kB.
- Environnement local déjà lancé lors de la dernière session : Vite sur `http://127.0.0.1:5173/`, API sur `http://localhost:3001`. Vérifier qu’il est encore actif avant d’en lancer un autre.

## Ce qui n’est pas encore réalisé ou confirmé

- Les fonctionnalités supplémentaires de la roadmap ne sont pas toutes implémentées.
- Le projet est toujours en `.js` / `.jsx` ; la migration TypeScript/TSX n’a pas été faite.
- L’utilitaire C de validation de sauvegarde SQLite n’a pas été créé.
- La création/p publication d’un dépôt GitHub et le push ne sont pas confirmés.
- Aucun workflow GitHub Actions de build n’est confirmé.
- Les builds APK et EXE ne sont pas validés ici.
- Ne pas considérer le projet prêt pour un déploiement public multi-utilisateur sans audit et durcissement.

## Démarrage et vérification

Depuis la racine du projet :

```bash
npm install
npm run dev
```

Vite sert le frontend sur le port `5173` et `server.js` démarre l’API sur le port `3001`. Les ports et chemins de configuration sont définis dans le code du projet ; ne pas supposer qu’ils sont configurés par une valeur secrète.

Build frontend :

```bash
npm run build
```

Le build crée `dist/`. Ne pas traiter `dist/` comme le code source.

## Architecture observée

```text
server.js                         démarrage et initialisation SQLite
server/
  app.js                          middleware, API et fichiers statiques
  config.js                       configuration serveur / chemin SQLite
  db.js                           schéma SQLite et migrations
  controllers/                    logique des endpoints
  middleware/                     authentification
  models/                         accès aux données
  routes/api.js                   routes `/api`
src/
  main.jsx                        entrée landing page
  dashboard/main.jsx              entrée dashboard
  components/                     composants React
  pages/                          pages
  services/api.js                 appels frontend vers `/api`
  utils/                          formatage et calculs analytiques
docs/                             documentation produit et technique
desktop/main.cjs                  point d’entrée Electron
```

Les routes réellement présentes sont déclarées dans `server/routes/api.js`. Relire ce fichier avant de documenter ou d’utiliser l’API ; ne pas supposer qu’une fonctionnalité décrite dans la roadmap possède déjà une route.

## Données et sécurité

- `.env`, `database.sqlite` et fichiers SQLite associés sont ignorés par Git selon `.gitignore`.
- Ne jamais modifier ou supprimer les données SQLite de l’utilisateur pour tester.
- Avant une migration SQLite, examiner les données existantes et prévoir une migration non destructive.
- Toutes les requêtes de données marchandes doivent être limitées à l’utilisateur authentifié.
- Les statuts `paid` résultant d’une action dans le dashboard sont des confirmations locales, pas une confirmation indépendante du fournisseur.
- L’app locale n’est pas automatiquement adaptée à un hébergement public ; examiner les sessions, secrets, stockage et modèle d’instance avant tout déploiement.

## Suite de travail suggérée

Avant de coder, demander à l’utilisateur de confirmer la prochaine tâche. Les pistes précédemment évoquées, mais non commencées ou non finalisées, comprennent :

- améliorer la gestion des paiements manuels et des clients ;
- catalogue de produits, QR codes, exports, sauvegardes et relances ;
- migration progressive vers TypeScript/TSX ;
- utilitaire C pour vérifier l’intégrité d’une sauvegarde SQLite ;
- workflow GitHub Actions pour builds desktop et Android.

Pour toute tâche validée : faire une modification ciblée, mettre à jour la documentation concernée, puis lancer le build ou les tests les plus proches du changement.

## Documentation

- [Index des README et docs](docs/README.md)
- [README backend](server/README.md)
- [README frontend](src/README.md)
- [README packaging desktop](desktop/README.md)
