# README documentation

Lire d’abord le [README racine](../README.md), qui décrit l’état courant vérifié et les tâches qui restent à faire.

## Pour reprendre le projet avec une IA

1. Consulter le [README racine](../README.md).
2. Lire le README du sous-système concerné : [backend](../server/README.md), [frontend](../src/README.md) ou [packaging desktop](../desktop/README.md).
3. Vérifier les affirmations de cette documentation dans le code avant de les traiter comme des fonctionnalités existantes.
4. Demander confirmation avant de commencer une piste de roadmap qui n’a pas été explicitement validée.

## Documents de contexte disponibles

- [fonctionnalites.md](./fonctionnalites.md) — fonctionnalités et pistes produit
- [ia.md](./ia.md) — conventions pour les assistants
- [parcours_utilisateur.md](./parcours_utilisateur.md) — parcours visé
- [architecture.md](./architecture.md) — architecture décrite
- [api.md](./api.md) — endpoints décrits
- [schema_base.md](./schema_base.md) — schéma décrit
- [packaging.md](./packaging.md) — notes desktop / Android
- [securite.md](./securite.md) — précautions
- [roadmap.md](./roadmap.md) — pistes de développement
- [developer_guide.md](./developer_guide.md) — aide au développement
- [contributing.md](./contributing.md) — contribution
- [release_notes.md](./release_notes.md) — résumé des versions
- [support.md](./support.md) — support et don
- [operations.md](./operations.md) — maintenance
- [guide des outils SQLite](../tools/README.md) — sauvegarde Python et vérification C

Ces documents décrivent l’implémentation actuelle et les limites encore connues; le code reste la source de vérité. Avant tout changement, vérifier les routes dans `../server/routes/api.js`, le schéma dans `../server/db.js` et les écrans dans `../src/components/`.
