# Architecture PayFlow

## Vue générale

Le projet est divisé en 3 couches principales :

1. Frontend React / Vite
2. Backend Express
3. Base SQLite locale ou sur disque persistant mono-instance

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
├─ services/                  # planification et stockage des sauvegardes
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
- `customer_profiles`
- `manual_payments`
- `catalog_items`
- `manual_payment_history`
- `payment_link_history`
- `payment_reminders`
- `backup_snapshots`
- `schema_migrations`
- `leads`
- `newsletter`

La migration versionnée `approved-business-features` ajoute les champs manquants, reconstruit `customer_profiles` sans unicité globale du téléphone, puis crée les tables d’historique et de sauvegarde. Les modèles `FeatureModel` et `DataToolsModel` limitent les données métier par `user_id`.

## Flux principal

1. Compte local créé
2. Session cookie créée
3. Dashboard charge les statistiques du compte
4. Le marchand crée un lien
5. Le lien est enregistré dans SQLite
6. Le marchand vérifie le paiement puis modifie manuellement le statut
7. Le dashboard calcule les transactions sans double compter un lien payé associé à un encaissement confirmé; les totaux restent séparés par devise

## Modules du dashboard

`DashboardApp.tsx` monte les pages Encaissements, Clients, Catalogue, Liens, QR codes, Exports, Sauvegardes, Analytique et Relances depuis `FeaturePages.tsx`. Les contrats frontend se trouvent dans `src/types/index.ts`, les appels HTTP dans `src/services/api.ts`, les routes Express dans `server/routes/api.js` et leurs contrôleurs dans `server/controllers/featureController.js`.

`dashboard.html` est une entrée Vite minimale : elle contient le point de montage `#root`; toutes les vues du dashboard sont rendues par les composants React/TSX. `DashboardPageBoundary.tsx` affiche une récupération si le rendu de la page courante échoue. Les scripts autonomes de sauvegarde sont dans `tools/`.

`server/services/dailyBackup.js` écrit une copie JSON par compte dans `PAYFLOW_BACKUP_DIR`, au démarrage puis une fois par jour. La restauration automatique cherche le dernier fichier du compte authentifié. Les applications Electron rangent ce répertoire à côté de la base du profil local; le service Render Blueprint monte la base et les copies sous `/var/data`.

Le logo source est `public/payflow-icon.svg`, utilisé comme favicon et dans les interfaces. Les icônes Linux sont ses versions PNG multi-tailles dans `build/linux-icons`; les artefacts desktop utilisent aussi les versions raster de `build/` pour la fenêtre Electron et Windows.

Les QR sont générés localement par la bibliothèque `qrcode`. Les exports CSV protègent les cellules contre l’exécution de formules et masquent le paramètre `token` des URL. Les sauvegardes JSON incluent les données métier du compte courant et son historique, mais pas les paramètres d’API; les URL de paiement sauvegardées peuvent néanmoins contenir un token fournisseur. Elles ne sont pas chiffrées.

## Limites de conception

- SQLite peut servir une installation locale ou un premier déploiement sur une seule instance; un disque Render persistant est requis.
- Un service Render avec disque ne peut pas être mis à l’échelle sur plusieurs instances. Pour plusieurs instances ou une charge élevée, migrer le stockage vers PostgreSQL et adapter les modèles; changer seulement le chemin de base ne suffit pas.
- Les sauvegardes automatiques locales nécessitent que l’application desktop soit ouverte au moins une fois dans la journée; si elle est fermée, la tâche est rattrapée au prochain démarrage.
- Aucun webhook ou notification fournisseur n’est utilisé ; les statuts sont manuels
