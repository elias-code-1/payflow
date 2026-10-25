# README backend

Guide rapide pour reprendre le backend PayFlow. Lire d’abord le [README racine](../README.md).

## Responsabilités

- `../server.js` initialise la base puis lance l’application Express.
- `app.js` configure Express, les routes `/api` et la livraison des fichiers web compilés.
- `config.js` rassemble la configuration serveur et le chemin de la base.
- `db.js` initialise SQLite et applique les migrations présentes.
- `routes/api.js` déclare les routes.
- `controllers/` traite les requêtes HTTP.
- `models/` regroupe les requêtes et opérations SQLite.
- `middleware/authenticate.js` protège les routes privées.

## Principes à préserver

- Les données marchandes doivent être filtrées par `req.auth.userId`.
- Les requêtes SQL doivent utiliser des paramètres plutôt que concaténer les valeurs utilisateur.
- Les erreurs API doivent rester des réponses JSON avec un statut HTTP explicite.
- Le statut de paiement est manuel dans le flux actuel. Ne pas inventer une confirmation fournisseur ou ajouter un webhook sans demande explicite.
- PayFlow ne reçoit aucune notification fournisseur ; l’ancien endpoint `GET /api/payments` renvoie une liste vide pour préserver la compatibilité du client.
- Ne jamais afficher ou journaliser les clés API, mots de passe ou cookies.
- Ne pas ouvrir ni modifier la base locale de l’utilisateur pour un test destructif.

## Routes actuellement déclarées

Les routes sont la source de vérité ; relire `routes/api.js` avant d’en ajouter ou d’en documenter.

- Auth : `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/session`, `/api/auth/status`
- Données privées : `/api/stats`, `/api/payments` (vide, compatibilité), `/api/customers`, `/api/payment-links`, `/api/leads`
- Création : `/api/payment`, `/api/contact`, `/api/newsletter`
- Statut manuel : `PATCH /api/payment-links/:id/status` et route de compatibilité `PATCH /api/payment/status`
- Paramètres fournisseur : `/api/settings/payment`
- Santé : `/api/health`

Vérifier le middleware effectif : les routes situées après `router.use(authenticate)` sont privées.

## Développement et contrôle

Depuis la racine :

```bash
npm run dev
npm run build
```

Le script `dev` démarre le serveur et Vite ensemble. Le build valide le frontend ; il ne remplace pas des tests d’intégration backend.

## Avant une modification de schéma

1. Lire `db.js` et le modèle impacté.
2. Concevoir une migration compatible avec une base déjà créée.
3. Garder les anciennes données et vérifier les contraintes d’unicité/relations.
4. Tester sur une base temporaire dédiée, jamais sur la base locale utilisateur.
5. Mettre à jour `../docs/schema_base.md` seulement après avoir confirmé le schéma effectif.
