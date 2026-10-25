# Outils de sauvegarde SQLite

Ces outils sont indépendants du serveur PayFlow et ne lancent aucun processus depuis le dashboard.

## Python : créer un instantané

Python 3.10 ou plus récent et sa bibliothèque SQLite standard suffisent. Depuis la racine du dépôt :

```sh
python3 tools/backup_snapshot.py --db ./database.sqlite --output-dir ./backups --retain 7
```

Le programme utilise l’API de sauvegarde SQLite pour inclure les changements WAL de façon cohérente, vérifie `integrity_check` et `foreign_key_check`, écrit un fichier `.sha256` et conserve les sept dernières sauvegardes valides. `--dry-run` affiche les actions sans écrire ni supprimer de fichier. Les vérifications et la rétention ne touchent qu’aux sauvegardes nommées `payflow-backup-*.sqlite` créées avec leur sidecar SHA-256.

## C : vérifier une base ou une sauvegarde

Le compilateur C et les en-têtes SQLite sont nécessaires. Sur Linux et macOS avec SQLite disponible :

```sh
cc -O2 -Wall -Wextra -o backup_verify tools/backup_verify.c -lsqlite3
./backup_verify ./backups/payflow-backup-AAAA.sqlite
```

Le programme ouvre le fichier en lecture seule et exécute `PRAGMA integrity_check` et `PRAGMA foreign_key_check`. Codes de sortie : `0` valide, `2` ouverture SQLite impossible, `3` intégrité ou clés étrangères invalides, `64` arguments incorrects.

## Limites

Les sauvegardes ne sont pas chiffrées. Elles peuvent contenir des coordonnées, des notes et des URL de paiement; gardez-les dans un dossier protégé. Le SHA-256 permet de détecter une altération, pas d’empêcher une lecture. Remplacez `./database.sqlite` par le chemin réellement utilisé par `PAYFLOW_DB_PATH` si votre installation l’a déplacé.
