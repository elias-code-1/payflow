# Sécurité et bonnes pratiques

## Sécurité actuelle

- Sessions locales gérées avec cookie HttpOnly
- Hashage des mots de passe via scrypt
- Clés API stockées par compte local
- Isolation par `user_id`

## À renforcer avant ouverture publique

- HTTPS obligatoire
- Variables d’environnement sécurisées
- Rotation des secrets
- Rate limiting sur auth + API
- Sauvegardes régulières
- Chiffrement de certaines données sensibles
- Limitation des tentatives de connexion
- Audit des dépendances

## Points de vigilance

- SQLite local non adapté à un usage public multi-utilisateur sans architecture dédiée
- Les données ne doivent pas être laissées sur un disque volatil sans sauvegardes
- Les tokens PayGateGlobal ne doivent pas être exposés ou téléchargés dans un dépôt public
