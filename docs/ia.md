# Règles IA pour PayFlow

## 1. Objectif de l’IA

L’IA doit aider à maintenir, documenter, développer et améliorer le projet sans introduire de logique de paiement automatique non validée.

## 2. Règles importantes

- PayFlow n’utilise aucun webhook et ne reçoit aucune notification de paiement.
- Ne pas ajouter de callback ou de traitement de paiement automatique.
- Tous les liens et encaissements affichés comme payés viennent d’une action manuelle dans le compte local.
- Ne pas pousser une logique “direct send” ou “paiement envoyé automatiquement” sans consentement explicite.
- Préserver l’isolation des comptes et les données locales.

## 3. Conventions de code

- Le frontend utilise TypeScript/TSX et des types partagés dans `src/types`. Le backend reste en CommonJS JavaScript.
- Vite transpile le frontend. Ne pas annoncer de vérification TypeScript stricte tant que `typescript` et les types React ne sont pas installés et qu’un script typecheck n’existe pas.
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
- Toute fonctionnalité proposée doit être présentée à l’utilisateur et approuvée avant son implémentation.
- Toute modification fonctionnelle doit mettre à jour les documents concernés dans `docs/` dans le même changement.
- Un assistant ne doit pas promettre de build APK/EXE si l’environnement de build n’est pas prêt.
- Les règles “local-first” doivent être respectées dans les nouvelles fonctionnalités.
