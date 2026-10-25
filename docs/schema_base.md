# Schéma de base SQLite

Le schéma est initialisé dans `server/db.js`. La migration versionnée `approved-business-features` ajoute les champs métier et crée les tables d’historique, relances et sauvegardes. Les identifiants métier sont limités au `user_id` authentifié dans les modèles.

## Tables principales

### `users`, `user_settings`

Comptes locaux et paramètres par compte. La clé PayGateGlobal se trouve dans `user_settings`; elle n’est pas incluse dans les sauvegardes exportées par compte.

### `payment_links`

`id`, `user_id`, `identifier`, `description`, `amount`, `display_amount`, `currency`, `payment_method`, `phone_number`, `payment_url`, `status`, `status_updated_at`, `expires_at`, `archived_at`, `customer_id`, `catalog_item_id`, `created_at`.

`expires_at` et `archived_at` sont des valeurs locales à PayFlow. Elles ne désactivent pas le lien externe.

### `manual_payments`

`id`, `user_id`, `payment_link_id` nullable, `customer_id` nullable, `amount`, `currency`, `method`, `reference`, `paid_at`, `note`, `status` (`confirmed` / `void`), `created_at`, `updated_at`.

### `customer_profiles`

`id`, `user_id`, `full_name`, `phone_number`, `email`, `company`, `address`, `tags`, `notes`, `archived_at`, `created_at`, `updated_at`. Plusieurs fiches peuvent partager un téléphone; les doublons sont détectés par l’application et fusionnés explicitement.

### `catalog_items`

`id`, `user_id`, `name`, `description`, `sku`, `amount`, `currency`, `category`, `archived_at`, `created_at`, `updated_at`.

### Historiques et outils

- `manual_payment_history`: auteur via `user_id`, encaissement, motif, anciennes/nouvelles valeurs et date.
- `payment_link_history`: lien, action, anciennes/nouvelles valeurs, motif et date.
- `payment_reminders`: lien, texte, canal, état (`prepared` / `sent`), dates.
- `backup_snapshots`: compte, checksum, version, taille, source et document JSON de sauvegarde.
- `schema_migrations`: versions de migration déjà appliquées.

### Autres tables

- `payments`: structure historique conservée pour compatibilité; elle n’est pas alimentée par un webhook.
- `leads`, `newsletter`: données des formulaires de la landing page.
- `app_settings`: paramètres applicatifs historiques.

## Cohérence et revenus

- Toutes les lectures/écritures métier sont filtrées par `user_id`.
- Une confirmation de règlement est toujours saisie manuellement.
- Un encaissement confirmé lié à un lien payé remplace ce lien dans les transactions agrégées afin d’éviter le double comptage; un encaissement annulé reste consultable mais est exclu des revenus.
- Les revenus sont ventilés par devise et ne sont pas additionnés entre monnaies.
- Les sauvegardes account-scoped incluent les URLs stockées, qui peuvent contenir un token fournisseur; elles n’incluent pas les paramètres `user_settings`.
