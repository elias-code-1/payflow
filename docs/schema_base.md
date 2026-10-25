# Schéma de base SQLite

## tables principales

### users
- id
- email
- password_hash
- created_at

### user_settings
- user_id
- key
- value

### payment_links
- id
- user_id
- identifier
- description
- amount
- display_amount
- currency
- payment_method
- phone_number
- payment_url
- status
- status_updated_at
- expires_at
- archived_at
- created_at

### payments
- id
- user_id
- tx_reference
- identifier
- status
- amount
- payment_method
- phone_number
- created_at

### manual_payments
- id
- user_id
- payment_link_id
- amount
- currency
- method
- reference
- paid_at
- note
- created_at

### customer_profiles
- id
- user_id
- phone_number
- full_name
- email
- tags
- notes
- created_at
- updated_at

### catalog_items
- id
- user_id
- name
- description
- amount
- currency
- created_at

### leads
- id
- user_id
- full_name
- email
- company
- project
- message
- created_at

### newsletter
- id
- user_id
- email
- created_at

## Règles de cohérence

- Chaque compte ne voit que ses propres données.
- Les tables de paiement et liens doivent rester liées à `user_id`.
- Les statuts locaux doivent être distingués des confirmations fournisseur.
