# README frontend

Guide rapide pour reprendre le frontend PayFlow. Lire d’abord le [README racine](../README.md).

## Entrées de l’application

- `main.jsx` monte la landing page.
- `dashboard/main.jsx` monte le dashboard.
- `components/landing/` contient les sections de la landing page.
- `components/dashboard/` contient les vues et composants du dashboard.
- `components/auth/` contient l’interface de connexion / création de compte.
- `pages/` contient les pages réutilisables.
- `services/api.js` centralise les requêtes HTTP vers l’API.
- `utils/` contient les fonctions partagées, notamment le formatage et les calculs de transactions.

Le code est actuellement en JavaScript/JSX. Aucune migration TypeScript/TSX n’est confirmée.

## Flux du dashboard

`DashboardApp.jsx` récupère la session, charge statistiques, transactions, liens, clients et configuration API, puis affiche la vue sélectionnée. Les changements de statut déclenchent un rafraîchissement des données. Examiner ce flux avant de déplacer l’état ou de créer une nouvelle page.

## Principes UX et métier

- Conserver des pages/composants séparés ; ne pas regrouper l’application dans un seul gros JSX.
- Afficher clairement les erreurs comme erreurs et les confirmations comme succès.
- Les liens sont générés pour être copiés/partagés ; ne pas déclencher un envoi direct automatique.
- Les mises à jour `paid` dans l’interface restent manuelles et locales.
- Ne jamais inclure la clé API dans le frontend, les URLs de navigation ou les logs.
- Garder les textes utilisateur en français, conformément à l’interface existante.

## API frontend

Utiliser `services/api.js` plutôt que de disperser des appels `fetch`. Cette couche vérifie déjà les réponses JSON et remonte les erreurs HTTP. Avant d’utiliser un endpoint, vérifier qu’il est réellement défini dans `../server/routes/api.js`.

## Commandes

Depuis la racine :

```bash
npm run dev
npm run build
```

`npm run build` est la vérification frontend disponible observée. Vite émet actuellement un avertissement de taille pour le bundle du dashboard ; ne pas masquer cet avertissement sans traiter ou justifier le découpage.
