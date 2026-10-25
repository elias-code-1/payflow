# API PayFlow

Les routes privées ci-dessous exigent une session authentifiée. Les identifiants et listes sont toujours limités au compte connecté. Les confirmations de paiement sont des saisies locales; aucune route ne reçoit de webhook ni n’envoie de relance.

## Authentification et socle

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `GET /api/auth/status` — état public indiquant si un compte existe
- `GET /api/health`
- `GET /api/stats`, `GET /api/payments`, `GET /api/customers`
- `GET /api/payment-links`
- `POST /api/payment` — crée un lien auprès de PayGateGlobal avec la clé du compte
- `PATCH /api/payment-links/:id/status` — mise à jour manuelle, motif facultatif
- `POST /api/payment-links/:id/duplicate`
- `GET /api/settings/payment`, `PUT /api/settings/payment`
- Routes de landing page : `GET /api/leads`, `POST /api/contact`, `POST /api/newsletter`

## Encaissements manuels

- `GET /api/manual-payments` — filtres facultatifs `status`, `currency`, `method`, `customerId`, `from`, `to`, `q`
- `POST /api/manual-payments`
- `PUT /api/manual-payments/:id` — `reason` obligatoire
- `PATCH /api/manual-payments/:id/status` — `confirmed` ou `void`, motif obligatoire
- `GET /api/manual-payments/:id/history`

## Clients et catalogue

- `GET /api/customer-profiles` — `q`, `archived` (`true`, `false`, `all`), `from`, `to`
- `POST /api/customer-profiles`, `GET /api/customer-profiles/:id`, `PUT /api/customer-profiles/:id`
- `PATCH /api/customer-profiles/:id/archive`, `DELETE /api/customer-profiles/:id`
- `POST /api/customer-profiles/merge-preview`, `POST /api/customer-profiles/merge`
- `GET /api/catalog` — `q`, `category`, `archived`
- `POST /api/catalog`, `GET /api/catalog/:id`, `PUT /api/catalog/:id`
- `POST /api/catalog/:id/duplicate`, `PATCH /api/catalog/:id/archive`

## Cycle de vie des liens, QR et relances

- `PATCH /api/payment-links/:id/lifecycle` — expiration et archivage locaux
- `GET /api/payment-links/:id/history`
- `PATCH /api/payment-links/bulk-archive` — maximum 100 IDs
- Les QR codes sont calculés dans le frontend depuis l’URL du lien; ils n’appellent pas l’API de paiement.
- `GET /api/reminders`, `POST /api/reminders`, `PATCH /api/reminders/:id`

## Analytique, exports et sauvegardes

- `GET /api/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD` — période en dates UTC inclusives; sans dates, période courante de 30 jours
- `GET /api/exports/preview?type=...` — types : `links`, `receipts`, `customers`, `catalog`, `transactions`
- `GET /api/exports/:type?format=csv|json` — mêmes filtres que la prévisualisation : `from`, `to`, `currency`, `status`, `customerId`, `includeSensitive`
- L’export de liens accepte aussi `ids` (liste séparée par des virgules, maximum 100) pour exporter une sélection groupée.
- `GET /api/backups`, `POST /api/backups`, `GET /api/backups/:id`
- `POST /api/backups/verify` avec `{ "document": ... }`
- `POST /api/backups/restore` avec `{ "document": ..., "confirmed": true }`

Les sauvegardes et restaurations couvrent les données métier du compte courant, pas une copie brute de toute la base. Le token d’API stocké dans les paramètres n’est pas inclus, mais les URL de paiement dans une sauvegarde peuvent contenir un token fournisseur. Les exports masquent toujours le paramètre `token` et masquent aussi le téléphone par défaut; leurs URL ne sont donc pas directement utilisables. Les fichiers ne sont pas chiffrés.

## Réponses et comportement

Les réponses utilisent JSON, sauf les téléchargements d’export. Les erreurs comportent un message français et un statut HTTP explicite. L’archivage ou l’expiration locale ne désactive pas un lien chez PayGateGlobal. Les routes de relance enregistrent un texte préparé ou la déclaration manuelle d’un envoi; elles ne contactent aucun service externe.
