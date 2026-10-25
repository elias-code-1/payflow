# Opérations et maintenance

## Maintenance quotidienne

- Vérifier la base SQLite
- Vérifier la cohérence des comptes
- Vérifier les changements de statuts manuels
- Faire des sauvegardes régulières

## Sauvegarde recommandée

- Le serveur garde automatiquement les 30 dernières sauvegardes quotidiennes par compte dans `PAYFLOW_BACKUP_DIR`. Il vérifie le jour au démarrage puis toutes les 30 minutes; si l’application était arrêtée, la copie du jour est créée à la prochaine ouverture.
- Dans le dashboard, **Sauvegardes → Restaurer la dernière copie** retrouve directement le dernier fichier automatique. Pour importer une copie externe, choisir son JSON, vérifier le résumé et sélectionner **Importer et restaurer maintenant**; PayFlow crée une copie de sécurité avant de remplacer les données.
- **Télécharger une sauvegarde** exporte également un fichier JSON que l’on peut conserver hors de l’appareil.
- Depuis le panneau Sauvegardes, télécharger une sauvegarde JSON du compte, ou lancer `python3 tools/backup_snapshot.py --db ./database.sqlite --output-dir ./backups --retain 7` pour une copie SQLite complète.
- Vérifier le fichier avec `./backup_verify ./backups/<fichier>.sqlite` après avoir compilé `tools/backup_verify.c` comme indiqué dans [`tools/README.md`](../tools/README.md).
- Stocker les backups hors du dossier projet
- Les fichiers de sauvegarde ne sont pas chiffrés; protéger leur emplacement.

## Déploiement Render

La configuration versionnée se trouve dans [`render.yaml`](../render.yaml); les limites SQLite et la procédure de première mise en ligne sont dans le [guide Render](deploiement-render.md). Ne pas utiliser le plan gratuit pour conserver SQLite ou les fichiers locaux.

## Journée de production

- contrôler les clés API
- vérifier les données clientes
- vérifier les exports et relances
- observer les usages de paiement manuel
