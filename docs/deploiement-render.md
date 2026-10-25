# Héberger PayFlow sur Render

PayFlow peut démarrer sur Render avec un seul service Node et SQLite. La configuration `render.yaml` place la base et les sauvegardes sous `/var/data` sur un disque persistant. Le forfait gratuit de Render ne conserve pas les fichiers locaux; le Blueprint choisit donc un service avec disque persistant.

## Mise en ligne

1. Enregistrer une sauvegarde JSON depuis **Sauvegardes** si des données existent déjà sur l’installation locale.
2. Connecter le dépôt GitHub à Render et créer le service avec le Blueprint `render.yaml`.
3. Attendre le déploiement, ouvrir l’URL `onrender.com`, puis créer le premier compte.
4. Si une ancienne installation contient des données, ouvrir **Sauvegardes** dans Render et importer son fichier JSON.
5. Dans les paramètres GitHub du dépôt, ajouter la variable d’Actions `CAPACITOR_SERVER_URL` avec l’URL de base Render, par exemple `https://payflow-exemple.onrender.com` (sans `/dashboard.html`). Les builds Android/iOS ouvriront alors le dashboard hébergé.

Le fichier SQLite de l’ordinateur local n’est pas transféré automatiquement vers Render. Le transfert initial se fait avec une sauvegarde JSON par compte.

Cette configuration prépare le service, mais ne le déploie pas. Avant d’ouvrir l’inscription au public, il reste à chiffrer les clés PayGate stockées dans SQLite et à protéger les routes d’authentification contre les tentatives répétées. Les clés actuelles sont lisibles par toute personne ayant accès au fichier de base.

## Sauvegardes automatiques

Le serveur crée un fichier JSON distinct par compte au démarrage, puis vérifie toutes les 30 minutes si une nouvelle copie quotidienne est nécessaire. Il garde les 30 derniers jours dans `PAYFLOW_BACKUP_DIR`, avec des permissions privées sur les systèmes qui les prennent en charge. Si le service était arrêté, il crée la copie du jour à son prochain démarrage. Le dashboard permet de restaurer la dernière copie automatique en un clic, après confirmation; l’état courant est sauvegardé juste avant. La tâche tourne dans le service web car les Cron Jobs Render ne peuvent pas monter un disque persistant.

Sur l’application desktop, les fichiers sont dans le dossier `backups` à côté de la base SQLite du profil PayFlow. L’application doit être ouverte pour exécuter le contrôle quotidien; si elle était fermée, la sauvegarde est rattrapée à la prochaine ouverture. Sur Render, le dossier est `/var/data/backups` et suit le cycle de vie du disque persistant.

Les fichiers sont des sauvegardes par compte. Ils contiennent des données personnelles et des URL de paiement; ils ne sont pas chiffrés par PayFlow. Les sauvegardes manuelles et automatiques n’incluent pas les réglages API, mais certaines URL peuvent contenir un token fournisseur.

## Limites de SQLite sur Render

- Un disque Render est accessible à une seule instance de service; ce déploiement ne doit pas être mis à l’échelle horizontalement.
- Le disque persistant exige un service payant. Sans lui, Render peut perdre la base et les fichiers lors d’un redémarrage ou d’un déploiement.
- SQLite convient au démarrage et à une charge modeste sur une instance. Pour plusieurs instances ou une hausse du trafic et des écritures simultanées, il faudra migrer le backend vers PostgreSQL; changer seulement `PAYFLOW_DB_PATH` ne suffit pas.
- Le fichier local existant n’est pas partagé entre les appareils. Avec l’application Android/iOS configurée sur l’URL Render, les données et les sauvegardes sont centralisées sur le serveur; les appareils n’écrivent pas directement dans leur propre disque.

Pour désactiver le planificateur local, définir `PAYFLOW_AUTO_BACKUPS=false`. Le service Render fourni l’active.
