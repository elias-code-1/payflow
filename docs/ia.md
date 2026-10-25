# Règles IA pour PayFlow

## 1. Objectif de l’IA

L’IA doit aider à maintenir, documenter, développer et améliorer le projet sans introduire de logique de paiement automatique non validée.

## 2. Règles importantes

- Ne pas supposer un webhook fournisseur actif.
- Ne pas transformer le dashboard en système de paiement automatique sans callback officiel.
- Toujours traiter les statuts payés comme des confirmations locales ou manuelles.
- Ne pas pousser une logique “direct send” ou “paiement envoyé automatiquement” sans consentement explicite.
- Préserver l’isolation des comptes et les données locales.

## 3. Conventions de code

- Code JavaScript / React actuel, avec possibilité de passer en TypeScript dans le futur.
- Les modules frontend doivent rester séparés : composants, pages, services, utils.
- Les modèles serveur doivent rester dans `server/models`.
- Les contrôleurs doivent rester dans `server/controllers`.
- Les routes doivent rester dans `server/routes`.
- Les dépendances lourdes et optionnelles doivent rester isolées.

## 4. Règles de sécurité

- Ne pas exposer les tokens ou clés dans le code source.
- Ne pas enregistrer de secrets dans le dépôt Git.
- Vérifier les impacts de la persistance SQLite avant toute migration en base distante.
- Tout hébergement public doit utiliser HTTPS et une configuration sécurisée.

## 5. Conventions de commit / PR

- Les changements doivent rester précis.
- Les fichiers docs sont à mettre à jour lorsqu’un nouveau module ou flux est ajouté.
- Les features de paiement doivent toujours rester explicites sur leur mode de validation.

## 6. Règles pour les IA embarquées

- Les assistants doivent d’abord lire les docs avant de modifier le code.
- Toute nouvelle feature doit être déclarée dans les docs avant d’être intégrée.
- Un assistant ne doit pas promettre de build APK/EXE si l’environnement de build n’est pas prêt.
- Les règles “local-first” doivent être respectées dans les nouvelles fonctionnalités.
