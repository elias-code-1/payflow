# Release notes

## Version actuelle

La version actuelle est un dashboard local de gestion de liens de paiement, avec :

- comptes isolés
- liens et statuts manuels
- analytics locales
- landing page
- backend Express + SQLite

## Implémentation des neuf modules

- Encaissements manuels avec historique des modifications
- Fiches clients avec fusion et archivage
- Catalogue et liens associés
- Gestion avancée des liens avec expiration locale et historique
- QR codes PNG/SVG générés localement
- Exports CSV/JSON filtrés
- Sauvegardes JSON par compte avec vérification et restauration
- Analytique séparée par devise
- Relances rédigées et enregistrées manuellement

Cette première implémentation n’a pas été compilée ou testée dans cette livraison. Les messages restent manuels; aucun webhook ni service d’envoi n’est ajouté.

## Historique attendu

- Lot 1 : stabilisation dashboard local
- Lot 2 : encaissements et clients avancés
- Lot 3 : exports / QR / relances
- Lot 4 : sécurité et migration de données
