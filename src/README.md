# README frontend

Guide rapide pour reprendre le frontend PayFlow. Lire d’abord le [README racine](../README.md).

## Entrées de l’application

- `main.tsx` monte la landing page.
- `dashboard/main.tsx` monte le dashboard.
- `components/landing/` contient les sections de la landing page.
- `components/dashboard/` contient les vues et composants du dashboard.
- `components/auth/` contient l’interface de connexion / création de compte.
- `pages/` contient les pages réutilisables.
- `services/api.ts` centralise les requêtes HTTP typées vers l’API.
- `utils/` contient les fonctions partagées, notamment le formatage et les calculs de transactions.

Le frontend est migré en TypeScript/TSX avec la configuration de base dans `../tsconfig.json`. Le backend Express reste en JavaScript. Vite transpile TSX pour le build; un type-check séparé est à ajouter quand TypeScript et les types React seront disponibles dans l’environnement npm.

## Flux du dashboard

`DashboardApp.tsx` récupère la session et les données du dashboard puis affiche les pages métier. `FeaturePages.tsx` contient les écrans d’encaissements, clients, catalogue, cycle de vie des liens, QR codes, exports, sauvegardes, analytique et relances. `DashboardPageBoundary.tsx` protège le rendu de la page sélectionnée et propose un retour à la vue d’ensemble en cas d’erreur. Les appels typés sont centralisés dans `services/api.ts`; les données réutilisées par l’écran parent sont rafraîchies après une modification. Examiner ce flux avant de déplacer l’état ou de créer une nouvelle page.

`data/reminderTemplates.ts` contient la bibliothèque de 224 messages en français. La page Sauvegardes privilégie le téléchargement et la restauration guidés; les commandes Python/C sont regroupées dans ses options avancées. La navigation mobile utilise une liste de pages avec libellés plutôt qu’une barre d’icônes sans texte.

## Principes UX et métier

- Conserver des pages/composants séparés ; ne pas regrouper l’application dans un seul gros JSX.
- Afficher clairement les erreurs comme erreurs et les confirmations comme succès.
- Les liens sont générés pour être copiés/partagés ; ne pas déclencher un envoi direct automatique.
- Les mises à jour `paid` dans l’interface restent manuelles et locales.
- Les transactions et graphiques gardent les devises séparées; un encaissement confirmé lié à un lien payé remplace le lien dans les agrégats.
- Les QR codes sont générés localement. Les liens archivés ou expirés peuvent toujours être actifs chez le fournisseur.
- Les exports masquent le paramètre `token` des URL; les sauvegardes JSON du compte peuvent conserver ces URL et ne sont pas chiffrées.
- Le panneau Sauvegardes montre le code Python/C en plus des commandes; ces scripts locaux ne sont jamais exécutés par le serveur.
- Ne jamais inclure la clé API dans le frontend, les URLs de navigation ou les logs.
- Garder les textes utilisateur en français, conformément à l’interface existante.

## API frontend

Utiliser `services/api.ts` plutôt que de disperser des appels `fetch`. Cette couche vérifie déjà les réponses JSON et remonte les erreurs HTTP. Avant d’utiliser un endpoint, vérifier qu’il est réellement défini dans `../server/routes/api.js`.

## Commandes

Depuis la racine :

```bash
npm run dev
npm run build
```

`npm run build` est la vérification frontend disponible observée. Vite émet actuellement un avertissement de taille pour le bundle du dashboard ; ne pas masquer cet avertissement sans traiter ou justifier le découpage.
