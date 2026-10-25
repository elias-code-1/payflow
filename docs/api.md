# API PayFlow

## Endpoints publics

### Authentification

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `GET /api/auth/status`

## Endpoints protégés par session

### Dashboard

- `GET /api/stats`
- `GET /api/payments`
- `GET /api/customers`
- `GET /api/payment-links`
- `GET /api/leads`
- `POST /api/contact`
- `POST /api/newsletter`

### Paiements

- `POST /api/payment`
- `PATCH /api/payment-links/:id/status`
- `PATCH /api/payment/status` (compatibilité)
- `GET /api/settings/payment`
- `PUT /api/settings/payment`

## Réponses

Les réponses utilisent du JSON. Les erreurs renvoient un message explicite en français.

## Notes

- La clé API du fournisseur est enregistrée par compte.
- Les statuts sont gérés localement dans l’application.
- Aucune notification serveur n’est générée automatiquement par la plateforme.
