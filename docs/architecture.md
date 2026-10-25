# Architecture PayFlow

## Vue générale

Le projet est divisé en 3 couches principales :

1. Frontend React / Vite
2. Backend Express
3. Base SQLite locale

## Frontend

- Landing page publique
- Dashboard marchand protégé par authentification locale
- Pages séparées selon le contexte fonctionnel
- Utilitaires de formatage, de calcul et d’analyse

### Structure actuelle

```text
src/
├─ components/
│  ├─ auth/
│  ├─ common/
│  ├─ dashboard/
│  └─ landing/
├─ pages/
├─ services/
├─ types/                   # contrats TypeScript partagés
├─ utils/
├─ main.tsx
└─ dashboard/main.tsx
```

## Backend

```text
server/
├─ controllers/
├─ models/
├─ routes/
├─ middleware/
├─ app.js
├─ db.js
├─ config.js
└─ ...
```

## Base SQLite

- `users`
- `user_settings`
- `payment_links`
- `payments`
- `customer_profiles` (planifiées / parts déjà ajoutées)
- `manual_payments`
- `catalog_items`
- `leads`
- `newsletter`

## Flux principal

1. Compte local créé
2. Session cookie créée
3. Dashboard charge les statistiques du compte
4. Le marchand crée un lien
5. Le lien est enregistré dans SQLite
6. Le marchand vérifie le paiement puis modifie manuellement le statut
7. Les stats recalculent les revenus et conversions locales à partir des liens payés

## Limites de conception

- SQLite est conçu pour une utilisation locale ou mono-instance
- Le projet n’est pas encore prêt pour un public multi-utilisateur sans migration vers PostgreSQL
- Aucun webhook ou notification fournisseur n’est utilisé ; les statuts sont manuels
