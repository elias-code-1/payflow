#!/usr/bin/env python3
"""Create and verify a consistent, local SQLite backup using only Python's stdlib."""

from __future__ import annotations

import argparse
import hashlib
import os
import sqlite3
import sys
import tempfile
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path


BACKUP_PREFIX = "payflow-backup-"


class BackupError(Exception):
    """Raised when a backup cannot be created or verified safely."""


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def open_read_only(path: Path) -> sqlite3.Connection:
    uri = f"{path.resolve().as_uri()}?mode=ro"
    return sqlite3.connect(uri, uri=True, timeout=30)


def verify_database(path: Path) -> list[str]:
    """Return validation problems; an empty list means SQLite and FKs are valid."""
    problems: list[str] = []
    try:
        with closing(open_read_only(path)) as connection:
            integrity = [row[0] for row in connection.execute("PRAGMA integrity_check")]
            if integrity != ["ok"]:
                problems.extend(f"integrity_check: {message}" for message in integrity)
            foreign_keys = list(connection.execute("PRAGMA foreign_key_check"))
            if foreign_keys:
                problems.append(f"foreign_key_check: {len(foreign_keys)} violation(s)")
    except (OSError, sqlite3.Error) as error:
        problems.append(f"SQLite: {error}")
    return problems


def managed_backup_is_valid(path: Path) -> bool:
    sidecar = path.with_suffix(path.suffix + ".sha256")
    if not sidecar.is_file():
        return False
    try:
        expected = sidecar.read_text(encoding="ascii").split()[0].lower()
        return len(expected) == 64 and expected == sha256_file(path) and not verify_database(path)
    except (OSError, UnicodeError, IndexError):
        return False


def prune_old_backups(output_dir: Path, retain: int, dry_run: bool) -> list[Path]:
    valid = [path for path in output_dir.glob(f"{BACKUP_PREFIX}*.sqlite") if managed_backup_is_valid(path)]
    valid.sort(key=lambda path: path.stat().st_mtime_ns, reverse=True)
    obsolete = valid[retain:]
    if not dry_run:
        for path in obsolete:
            path.with_suffix(path.suffix + ".sha256").unlink(missing_ok=True)
            path.unlink(missing_ok=True)
    return obsolete


def write_checksum_sidecar(backup_path: Path, checksum: str) -> None:
    sidecar = backup_path.with_suffix(backup_path.suffix + ".sha256")
    temporary = sidecar.with_name(f".{sidecar.name}.tmp")
    temporary.write_text(f"{checksum}  {backup_path.name}\n", encoding="ascii")
    os.replace(temporary, sidecar)


def create_backup(database_path: Path, output_dir: Path, retain: int, dry_run: bool) -> int:
    database_path = database_path.expanduser().resolve()
    if not database_path.is_file():
        raise BackupError(f"Base SQLite introuvable : {database_path}")
    if retain < 1:
        raise BackupError("La rétention doit conserver au moins une sauvegarde.")

    output_dir = output_dir.expanduser().resolve()

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
    destination = output_dir / f"{BACKUP_PREFIX}{timestamp}.sqlite"
    if destination == database_path:
        raise BackupError("Le fichier de destination ne peut pas remplacer la base source.")
    if dry_run:
        obsolete = prune_old_backups(output_dir, retain, dry_run=True) if output_dir.is_dir() else []
        print(f"Simulation : créer {destination}")
        print(f"Base source : {database_path}")
        print(f"Rétention : {retain} sauvegarde(s) valide(s); {len(obsolete)} ancienne(s) serait/seraient supprimée(s).")
        return 0

    output_dir.mkdir(parents=True, exist_ok=True)
    temporary_name = None
    try:
        with tempfile.NamedTemporaryFile(prefix=".payflow-backup-", suffix=".tmp", dir=output_dir, delete=False) as temporary:
            temporary_name = temporary.name
        temporary_path = Path(temporary_name)
        with closing(open_read_only(database_path)) as source, closing(sqlite3.connect(temporary_path)) as destination_connection:
            source.backup(destination_connection, pages=256, sleep=0.05)
        problems = verify_database(temporary_path)
        if problems:
            raise BackupError("La copie créée n’a pas passé sa vérification : " + "; ".join(problems))

        os.replace(temporary_path, destination)
        checksum = sha256_file(destination)
        write_checksum_sidecar(destination, checksum)
        obsolete = prune_old_backups(output_dir, retain, dry_run=False)
        print(f"Sauvegarde créée : {destination}")
        print(f"SHA-256 : {checksum}")
        print(f"Anciennes sauvegardes supprimées : {len(obsolete)}")
        return 0
    except (OSError, sqlite3.Error, BackupError) as error:
        if temporary_name:
            Path(temporary_name).unlink(missing_ok=True)
        raise BackupError(str(error)) from error


def main() -> int:
    parser = argparse.ArgumentParser(description="Instantané SQLite cohérent, vérifié et local.")
    parser.add_argument("--db", required=True, type=Path, help="Chemin de la base SQLite source.")
    parser.add_argument("--output-dir", type=Path, default=Path("./backups"), help="Dossier des sauvegardes (défaut : ./backups).")
    parser.add_argument("--retain", type=int, default=7, help="Nombre minimal de sauvegardes valides à conserver (défaut : 7).")
    parser.add_argument("--dry-run", action="store_true", help="Affiche les actions prévues sans écrire ni supprimer de fichier.")
    args = parser.parse_args()
    try:
        return create_backup(args.db, args.output_dir, args.retain, args.dry_run)
    except BackupError as error:
        print(f"Erreur : {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
