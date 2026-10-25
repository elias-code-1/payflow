/* Read-only SQLite backup verifier. Build with: cc -O2 -Wall -Wextra -o backup_verify tools/backup_verify.c -lsqlite3 */
#include <sqlite3.h>
#include <stdio.h>
#include <string.h>

static int check_rows(sqlite3 *database, const char *sql, int integrity_check) {
    sqlite3_stmt *statement = NULL;
    int result = sqlite3_prepare_v2(database, sql, -1, &statement, NULL);
    if (result != SQLITE_OK) {
        fprintf(stderr, "SQLite: %s\n", sqlite3_errmsg(database));
        return 0;
    }

    int rows = 0;
    int valid = 1;
    while ((result = sqlite3_step(statement)) == SQLITE_ROW) {
        rows += 1;
        if (integrity_check) {
            const unsigned char *message = sqlite3_column_text(statement, 0);
            if (message == NULL || strcmp((const char *)message, "ok") != 0) {
                fprintf(stderr, "integrity_check: %s\n", message != NULL ? (const char *)message : "résultat vide");
                valid = 0;
            }
        } else {
            const unsigned char *table = sqlite3_column_text(statement, 0);
            const sqlite3_int64 row_id = sqlite3_column_int64(statement, 1);
            fprintf(stderr, "foreign_key_check: table=%s rowid=%lld\n",
                    table != NULL ? (const char *)table : "?", (long long)row_id);
            valid = 0;
        }
    }

    if (result != SQLITE_DONE) {
        fprintf(stderr, "SQLite: %s\n", sqlite3_errmsg(database));
        valid = 0;
    }
    if (integrity_check && rows == 0) {
        fprintf(stderr, "integrity_check: aucun résultat\n");
        valid = 0;
    }
    sqlite3_finalize(statement);
    return valid;
}

int main(int argc, char **argv) {
    if (argc != 2) {
        fprintf(stderr, "Usage : %s <fichier.sqlite>\n", argv[0]);
        return 64;
    }

    sqlite3 *database = NULL;
    const int open_result = sqlite3_open_v2(argv[1], &database, SQLITE_OPEN_READONLY, NULL);
    if (open_result != SQLITE_OK) {
        fprintf(stderr, "Ouverture en lecture seule impossible : %s\n",
                database != NULL ? sqlite3_errmsg(database) : "mémoire insuffisante");
        if (database != NULL) sqlite3_close(database);
        return 2;
    }

    const int integrity_valid = check_rows(database, "PRAGMA integrity_check", 1);
    const int foreign_keys_valid = check_rows(database, "PRAGMA foreign_key_check", 0);
    sqlite3_close(database);

    if (!integrity_valid || !foreign_keys_valid) {
        fprintf(stderr, "Sauvegarde invalide ou incomplète.\n");
        return 3;
    }
    printf("Sauvegarde SQLite valide (intégrité et clés étrangères).\n");
    return 0;
}
