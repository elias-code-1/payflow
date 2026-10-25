# Sécurité et bonnes pratiques

## Sécurité actuelle

- Sessions locales gérées avec cookie HttpOnly
- Hashage des mots de passe via scrypt
- Clés API stockées par compte local
- Isolation par `user_id`
- Exports et sauvegardes limitées au compte de la session
- Paramètre `token` masqué dans les exports; non retiré des URL conservées dans les sauvegardes
- Checksum SHA-256 des sauvegardes pour détecter une altération accidentelle

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
- Les sauvegardes JSON ne sont ni chiffrées ni signées. Elles contiennent coordonnées, notes privées et des URLs de paiement pouvant embarquer un token fournisseur; les stocker dans un emplacement protégé.
- Le checksum d’une sauvegarde garantit seulement une vérification d’intégrité du contenu contre une altération non coordonnée; il ne garantit ni confidentialité ni authenticité.
- Les exports CSV suppriment le paramètre `token` des URL, ce qui rend ces URL exportées non directement utilisables.
