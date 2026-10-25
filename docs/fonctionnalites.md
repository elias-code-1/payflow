# Spécification fonctionnelle PayFlow

> **État :** une première implémentation des neuf modules est présente dans le code. Les critères ci-dessous restent la spécification; ils ne constituent pas une validation de compilation ou de fonctionnement. Le build et les tests n’ont pas été exécutés pour cette livraison.

## 1. Objectif du produit

PayFlow est un outil de gestion des encaissements par lien de paiement. Le marchand configure sa propre clé de fournisseur, crée des liens, les transmet lui-même à ses clients, puis tient son suivi dans l’application.

Le fonctionnement est volontairement **manuel** : PayFlow ne configure pas de webhook, ne reçoit pas de notification de paiement, ne vérifie pas automatiquement le règlement et n’envoie pas de paiement ou de relance au client. Le marchand choisit lui-même quand marquer un lien ou un encaissement comme payé.

## 2. Règles communes à toutes les fonctionnalités

1. **Aucune dépendance à un webhook.** Les calculs ne supposent pas l’existence d’événements reçus du fournisseur.
2. **Statut explicitement manuel.** Toute confirmation saisie dans PayFlow est une déclaration locale du marchand, jamais une preuve du fournisseur.
3. **Isolation des comptes.** Chaque lecture, écriture, export, sauvegarde restaurée et recherche doit respecter le compte connecté (`user_id`). Une requête d’un compte ne doit jamais révéler les données d’un autre.
4. **SQLite local.** Les modifications doivent préserver les données existantes et utiliser des migrations versionnées, vérifiables et non destructives.
5. **Pas de double comptage.** Un lien payé et un encaissement associé ne doivent pas être comptés deux fois dans les revenus ou les transactions.
6. **Devises séparées.** Ne jamais additionner des montants de monnaies différentes comme s’ils étaient comparables. Toute conversion éventuelle doit afficher son taux, sa date et son caractère fixe ou actualisé.
7. **Pas de fausse promesse sur le fournisseur.** Une expiration ou une archive PayFlow ne désactive pas le lien externe, sauf prise en charge officielle vérifiée par le fournisseur.
8. **Une page dédiée par module.** Chaque fonctionnalité ci-dessous possède sa page du dashboard, son état vide, ses erreurs, ses actions principales et ses sous-fonctionnalités.
9. **Documentation à jour.** À chaque évolution, mettre à jour ce fichier et les documents techniques concernés dans `docs/`.

## 3. État actuel du socle

Le socle comprend une landing page, un dashboard React/Vite, une API Express, une base SQLite et des comptes locaux. Une migration SQLite versionnée ajoute les champs et tables des modules. Toutes les opérations métier documentées ci-dessous sont limitées au compte connecté.

## 4. Modules approuvés

### 4.1 Encaissements manuels — page « Encaissements »

**But :** enregistrer un règlement observé en dehors de toute notification automatique et le relier, si possible, à un lien ou à un client.

**Sous-fonctionnalités :**

- Créer un encaissement avec montant, devise, date/heure, méthode, référence facultative, client facultatif et note privée.
- Associer l’encaissement à un lien existant; permettre également un encaissement sans lien.
- Lister, rechercher, filtrer par période, client, méthode, devise et statut.
- Modifier ou annuler une saisie avec motif; conserver un historique local des changements (ancienne valeur, nouvelle valeur, date, compte auteur).
- Afficher clairement le badge « saisi manuellement ».
- Exclure les saisies annulées des totaux, mais les garder consultables dans l’historique.

**Champs métier proposés :** `id`, `user_id`, `payment_link_id` nullable, `customer_id` nullable, `amount`, `currency`, `method`, `reference`, `paid_at`, `note`, `status` (`confirmed` ou `void`), `created_at`, `updated_at`.

**Parcours :** le marchand ouvre Encaissements → Ajouter → saisit les informations observées → vérifie le récapitulatif → enregistre. Une modification demande un motif et apparaît dans l’historique.

**Critères d’acceptation :** l’encaissement apparaît immédiatement dans la liste et les statistiques correspondantes; il n’est visible que pour son compte; un encaissement lié à un lien déjà comptabilisé ne crée pas de revenu en double; une annulation retire le montant des totaux sans effacer la trace.

### 4.2 Gestion des clients — page « Clients »

**But :** centraliser les coordonnées et l’historique commercial local.

**Sous-fonctionnalités :**

- Créer, modifier, consulter et archiver une fiche client.
- Champs facultatifs : nom, téléphone, email, entreprise, adresse, notes privées et tags.
- Recherche par nom, téléphone, email et tag; filtres par activité et date.
- Fiche détaillée avec liens créés, encaissements associés, montants par devise et dernière activité.
- Création d’un lien depuis une fiche client avec préremplissage des coordonnées disponibles.
- Détection de doublons potentiels par téléphone ou email, avec fusion contrôlée et prévisualisation.
- Suppression ou anonymisation selon une action explicite, en expliquant les conséquences sur l’historique.

**Données proposées :** `customer_profiles` avec `id`, `user_id`, `full_name`, `phone_number`, `email`, `company`, `address`, `notes`, `tags`, `archived_at`, dates de création et mise à jour. Les champs ne sont jamais requis sauf ceux nécessaires à une action choisie.

**Critères d’acceptation :** un client ne peut être relié qu’aux objets de son compte; l’archivage masque la fiche des vues actives sans supprimer l’historique; les résultats vides et les doublons potentiels sont compréhensibles.

### 4.3 Catalogue — page « Catalogue »

**But :** réutiliser les produits ou services fréquents pour créer des liens cohérents.

**Sous-fonctionnalités :**

- Créer, modifier, archiver et dupliquer un article.
- Nom, description, référence SKU facultative, prix, devise, catégorie et statut actif/inactif.
- Recherche et filtres par catégorie et statut.
- Créer un lien depuis un article; préremplir description, montant et devise, tout en autorisant un ajustement explicite pour cette commande.
- Afficher les liens générés depuis l’article et les ventes manuellement marquées payées, sans agréger plusieurs devises.
- Empêcher la modification d’un article archivé dans les nouveaux liens tout en conservant les anciennes références.

**Données proposées :** `catalog_items` avec `id`, `user_id`, `name`, `description`, `sku`, `amount`, `currency`, `category`, `archived_at`, dates de création et mise à jour. Le lien conserve un instantané de sa description et de son montant; modifier l’article ne modifie pas les liens déjà émis.

**Critères d’acceptation :** un article d’un compte ne peut pas être utilisé par un autre; la création depuis le catalogue produit un lien normal et visible dans Gestion des liens; les prix historiques restent inchangés.

### 4.4 Gestion avancée des liens — page « Liens de paiement »

**But :** administrer le cycle de vie local des liens générés.

**Sous-fonctionnalités :**

- Liste avec recherche et filtres par statut, client, date, devise, montant, produit et méthode.
- Consultation d’une fiche lien avec URL, identifiant, montant affiché et envoyé, dates et historique de statut.
- Copier l’URL, ouvrir l’URL, dupliquer le lien avec un nouvel identifiant unique.
- Ajouter une date d’expiration locale et archiver/restaurer un lien.
- Actions groupées limitées aux actions non destructives (archiver, exporter); confirmation avant action multiple.
- Filtrer les liens actifs, expirés localement, archivés, en attente, payés manuellement ou annulés.
- Confirmer ou annuler manuellement le statut, en demandant une confirmation; enregistrer auteur, date et motif facultatif.

**Règle d’expiration :** l’expiration désactive le lien dans l’interface PayFlow et le marque comme expiré localement. Elle n’empêche pas nécessairement un client d’ouvrir ou de régler l’URL externe. L’interface doit l’indiquer.

**Critères d’acceptation :** chaque duplication reçoit un identifiant inédit; les actions manuelles mettent à jour transactions et statistiques sans rechargement incohérent; l’archive ne supprime pas les données; un accès par ID d’un autre compte renvoie une réponse introuvable.

### 4.5 QR codes — page « QR codes »

**But :** faciliter le partage physique ou numérique d’un lien existant.

**Sous-fonctionnalités :**

- Générer un QR à partir de l’URL déjà enregistrée, sans créer ni modifier un paiement.
- Prévisualiser le QR et le tester par ouverture de l’URL correspondante.
- Télécharger en PNG et SVG; proposer une taille lisible pour impression.
- Inclure un libellé facultatif (nom de l’article ou référence) hors du contenu du QR.
- Choisir un lien depuis la liste ou depuis sa fiche; respecter l’accès par compte.
- Afficher un avertissement si le lien est archivé ou expiré localement.

**Critères d’acceptation :** le QR encode exactement l’URL du lien sélectionné; télécharger ne fait aucun appel de paiement; la génération fonctionne hors connexion si la bibliothèque est embarquée.

### 4.6 Exports — page « Exports »

**But :** permettre au marchand de récupérer ses données et de faire des analyses externes.

**Sous-fonctionnalités :**

- Export CSV UTF-8 pour liens, encaissements, clients, catalogue et transactions.
- Export JSON pour une sauvegarde portable structurée; séparer les catégories et inclure un manifeste/version de format.
- Choisir période, devise, statut, client et champs à inclure.
- Prévisualiser le nombre d’enregistrements avant export; afficher les filtres et la date de génération.
- Échapper les cellules CSV dangereuses (prévention de l’exécution de formules dans les tableurs).
- Option d’exclure notes et coordonnées sensibles; ne jamais ajouter les clés API ou mots de passe aux exports standards.
- Export limité au compte connecté; nom de fichier explicite, sans donnée sensible dans son nom.

**Critères d’acceptation :** l’export correspond aux filtres; aucune donnée d’un autre compte n’est incluse; le CSV s’ouvre correctement avec accents; les valeurs contrôlées par l’utilisateur ne deviennent pas des formules actives.

### 4.7 Sauvegardes — page « Sauvegardes » et utilitaires facultatifs

**But :** protéger et restaurer les données locales SQLite avec une procédure vérifiable.

**Sous-fonctionnalités de la page :**

- Créer une sauvegarde à la demande et afficher sa date, taille, checksum et version du schéma.
- Vérifier l’intégrité d’une sauvegarde avant restauration.
- Restaurer après aperçu du contenu (version, comptes, nombre d’objets), confirmation explicite et création automatique d’une sauvegarde de sécurité de l’état courant.
- Exporter/importer les données du compte courant sans écraser d’autres comptes, si le format permet de garantir cette isolation.
- Afficher un guide de copie externe et rappeler que les fichiers SQLite peuvent contenir coordonnées et secrets configurés.
- Refuser un fichier incomplet, corrompu, d’une version incompatible ou au format inattendu; ne jamais remplacer la base active avant validation complète.

**Exigences SQLite :** effectuer une sauvegarde cohérente même en mode WAL (API SQLite de backup ou mécanisme équivalent), vérifier `PRAGMA integrity_check` et `PRAGMA foreign_key_check`, calculer le checksum, puis remplacer de façon atomique lorsque possible. Une copie brute du seul fichier DB pendant que l’application tourne n’est pas considérée comme une sauvegarde garantie.

**Utilitaire Python facultatif :** script CLI local pour planifier des snapshots, appliquer une rétention configurable, vérifier intégrité/checksum et écrire un journal sans données personnelles. Il doit proposer `--dry-run`, retourner des codes de sortie documentés, ne jamais supprimer la dernière sauvegarde valide et ne pas envoyer de fichiers vers un service externe. Les chemins, fréquence et rétention sont configurés explicitement; aucun secret n’est journalisé.

**Outil C facultatif :** petit vérificateur SQLite en lecture seule, séparé du serveur et des builds web/mobile/desktop. Il reçoit le chemin d’une sauvegarde, vérifie l’intégrité et éventuellement le manifeste/checksum, puis retourne un code d’état documenté. Aucun code C ne doit modifier la base, exécuter de SQL issu d’un utilisateur ou être requis pour lancer PayFlow.

**Sécurité des sauvegardes :** une sauvegarde complète de la base peut contenir les données de plusieurs comptes et des clés API. Les sauvegardes globales ne doivent donc pas être proposées comme si elles étaient propres à un utilisateur. Les exports par compte sont préférables pour l’usage marchand; tout format complet doit être clairement réservé à l’administrateur local, protégé par permissions système et, si retenu, chiffré avec une clé fournie séparément.

**Critères d’acceptation :** une sauvegarde valide peut être restaurée sans perte silencieuse; une sauvegarde invalide est rejetée sans toucher à la base courante; l’outil Python ne supprime jamais la dernière copie saine; le vérificateur C ne modifie aucun octet de la base.

### 4.8 Analytique avancée — page « Analytique »

**But :** rendre les résultats commerciaux lisibles tout en distinguant valeurs manuelles, devises et période.

**Sous-fonctionnalités :**

- Sélection de périodes prédéfinies et personnalisées, selon le fuseau local configuré.
- Mesures par devise : nombre de liens créés, nombre de liens manuellement marqués payés, encaissements saisis, montant payé manuel, montant en attente et montant annulé.
- Taux de conversion opérationnel = liens marqués payés manuellement / liens éligibles créés sur la période. Afficher numérateur, dénominateur et période; documenter le traitement des liens expirés/annulés.
- Graphiques de tendance, ventilation par méthode, produit, client et mois, en gardant les devises séparées.
- Comparaison avec une période précédente de durée équivalente.
- Export des données du graphique et affichage de la définition de chaque indicateur.
- Indiquer « données saisies manuellement » près des revenus et conversions.

**Définitions :** un lien ouvert n’est pas un paiement. Un paiement n’est compté que lorsque le marchand le marque payé ou crée un encaissement manuel. Les totaux de liens payés et d’encaissements associés doivent utiliser une règle de déduplication unique et visible.

**Critères d’acceptation :** les filtres influencent tous les indicateurs; aucune devise n’est additionnée à une autre; les changements de statut et annulations actualisent les graphes; les séries vides ont un état explicatif et ne présentent pas de données inventées.

### 4.9 Relances — page « Relances »

**But :** préparer des rappels personnalisés que le marchand enverra lui-même.

**Sous-fonctionnalités :**

- Lister les liens en attente, avec filtres par ancienneté, client, montant et date d’expiration locale.
- Générer un texte de rappel à partir de modèles (courtois, bref, professionnel), en remplaçant des champs sûrs : prénom, montant, devise, description et URL.
- Prévisualiser et modifier le texte, copier le message ou le lien séparément.
- Marquer une relance comme préparée ou envoyée manuellement, avec date et canal facultatif; aucune transmission automatique.
- Exclure par défaut les liens payés, annulés et archivés.
- Rappeler que le lien peut être encore actif chez le fournisseur même si PayFlow affiche une expiration locale.

**Critères d’acceptation :** aucune API d’email/SMS/WhatsApp n’est appelée; le texte est prévisualisé avant copie; l’historique de relance est isolé par compte; un lien payé ne reçoit pas une relance proposée par défaut.

## 5. Pages et navigation proposées

Chaque ligne correspond à une page fonctionnelle indépendante, avec sous-navigation si elle devient nécessaire :

| Page | Écrans ou vues principales |
| --- | --- |
| Encaissements | Liste, nouvel encaissement, détail, historique des modifications |
| Clients | Liste, fiche client, création/modification, doublons potentiels |
| Catalogue | Liste, fiche article, création/modification, liens associés |
| Liens de paiement | Liste filtrable, détail, duplication, confirmation de statut |
| QR codes | Sélection du lien, prévisualisation, téléchargement |
| Exports | Type, filtres, prévisualisation, export CSV/JSON |
| Sauvegardes | Créer, vérifier, restaurer, historique local |
| Analytique | Vue globale, périodes, méthodes, articles, devises |
| Relances | À relancer, composition, aperçu, historique manuel |

L’accès à la déconnexion et au lien de don fait partie de la navigation générale du dashboard; ce sont des éléments transversaux et non une des neuf pages métier.

## 6. Frontend React et TypeScript

Toutes les vues du dashboard sont des composants React écrits en TSX, montés depuis `src/dashboard/main.tsx`. `dashboard.html` est uniquement la coquille d’entrée requise par Vite : elle fournit le nœud `#root` et charge l’application. La navigation entre les pages est gérée dans React. Le backend reste en JavaScript.

Une frontière d’erreur encadre la page courante pour afficher une récupération dans le dashboard lorsqu’un composant échoue au rendu. Les montants de paiement issus d’anciens liens sans `display_amount` sont présentés en XOF, car `amount` contient le montant transmis au prestataire; les montants de devises différentes restent séparés.

## 7. Outils locaux Python et C

La page Sauvegardes expose et permet de télécharger les sources `tools/backup_snapshot.py` et `tools/backup_verify.c`. Python crée une copie cohérente par l’API SQLite, contrôle l’intégrité et les clés étrangères, écrit un sidecar SHA-256 et applique une rétention limitée aux instantanés qu’il a créés. L’option `--dry-run` ne modifie aucun fichier. L’utilitaire C vérifie un fichier SQLite en lecture seule.

Ces scripts sont facultatifs, ne sont pas lancés par le serveur et ne sont pas nécessaires au dashboard. Leurs commandes, dépendances et limites sont décrites dans [`tools/README.md`](../tools/README.md). Aucun chiffrement des fichiers de sauvegarde n’est appliqué.

## 8. Ordre d’implémentation proposé

1. Formaliser modèles, migrations et contrats; créer d’abord les tests d’isolation de compte et de non-double comptage.
2. Encaissements manuels et règles communes de calcul.
3. Clients, puis Catalogue.
4. Gestion avancée des liens et QR codes.
5. Exports, puis sauvegardes/restauration et outils Python/C.
6. Analytique basée sur les définitions stabilisées.
7. Relances manuelles.
8. Poursuivre le contrôle de types et la modularisation du frontend.

## 9. État de la première implémentation

| Module | Couverture présente | Limites connues |
| --- | --- | --- |
| Encaissements | Saisie, édition avec motif, annulation/réactivation, filtres et historique | Les statuts sont des déclarations du marchand. |
| Clients | Fiches, activité, archivage, anonymisation/suppression protégée, doublons, fusion et création de lien | La fusion conserve les coordonnées de la fiche cible; elle ne combine pas automatiquement les notes/champs des sources. |
| Catalogue | CRUD, catégories, archivage, duplication, ventes et création de lien | Les liens existants gardent leur instantané. |
| Liens | Filtres, fiche, historique, duplication, expiration/archivage local et archivage groupé | Les changements d’état chez le fournisseur ne sont pas effectués. |
| QR codes | Génération locale PNG/SVG depuis une URL enregistrée | Le QR contient l’URL externe; l’archive et l’expiration locales ne la désactivent pas. |
| Exports | CSV protégé contre les formules, JSON par catégorie, filtres, aperçu et exclusion facultative des données sensibles | Le paramètre `token` est toujours masqué et le téléphone dans l’URL l’est par défaut; les URL exportées ne sont pas directement utilisables. |
| Sauvegardes | Téléchargement de la copie en un clic, sélection puis validation avant restauration, historique simple; outils Python/C dans une rubrique avancée | La sauvegarde du dashboard est par compte, pas une image brute de la base. Les fichiers peuvent inclure des URLs avec token fournisseur et ne sont pas chiffrés. Les scripts locaux restent facultatifs. |
| Analytique | Périodes 7/30/90 jours et personnalisées, revenus par devise, tendances journalières et mensuelles, ventilation et comparaison | Les dates sont calculées en UTC; aucun fuseau configurable n’est prévu. |
| Relances | 224 modèles en français, recherche par style/texte, personnalisation, copie, ouverture de WhatsApp et historique manuel | Aucun message n’est transmis automatiquement; l’utilisateur valide lui-même l’envoi dans son application de messagerie. |

Les sauvegardes JSON sont limitées au compte connecté. La restauration remplace uniquement ses données métier, crée une sauvegarde de sécurité préalable et refuse les identifiants de lien qui entreraient en collision avec un autre compte. Les fichiers ne sont ni chiffrés ni signés.

L’ordre peut être ajusté si une dépendance technique est découverte, mais les invariants de la section 2 ne changent pas.

## 10. Hors périmètre explicite

- Webhooks, callbacks ou réception de notifications de paiement.
- Validation automatique de paiement ou affirmation qu’un client a payé sans action du marchand.
- Envoi direct du lien, SMS, email ou message social par PayFlow.
- Désactivation garantie d’une URL externe par une expiration locale.
- Conversion monétaire présentée comme taux officiel sans source, date et règle documentées.
- Dépendance obligatoire à Python ou C pour le fonctionnement du dashboard.
