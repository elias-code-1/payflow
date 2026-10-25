# Opérations et maintenance

## Maintenance quotidienne

- Vérifier la base SQLite
- Vérifier la cohérence des comptes
- Vérifier les changements de statuts manuels
- Faire des sauvegardes régulières

## Sauvegarde recommandée

- Dans le dashboard, ouvrir **Sauvegardes** puis choisir **Télécharger une sauvegarde**. Pour restaurer, sélectionner un fichier JSON, attendre la vérification, puis choisir **Restaurer cette copie**; PayFlow crée une copie de sécurité préalable.
- Depuis le panneau Sauvegardes, télécharger une sauvegarde JSON du compte, ou lancer `python3 tools/backup_snapshot.py --db ./database.sqlite --output-dir ./backups --retain 7` pour une copie SQLite complète.
- Vérifier le fichier avec `./backup_verify ./backups/<fichier>.sqlite` après avoir compilé `tools/backup_verify.c` comme indiqué dans [`tools/README.md`](../tools/README.md).
- Stocker les backups hors du dossier projet
- Les fichiers de sauvegarde ne sont pas chiffrés; protéger leur emplacement.

## Journée de production

- contrôler les clés API
- vérifier les données clientes
- vérifier les exports et relances
- observer les usages de paiement manuel
