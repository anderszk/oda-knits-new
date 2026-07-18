from pathlib import Path

from database.connection import get_connection

_MIGRATIONS_DIR = Path(__file__).parent / "migrations"


def init_db():
    with get_connection() as connection:
        connection.execute(
            "CREATE TABLE IF NOT EXISTS schema_migrations ("
            "version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())"
        )
        applied = {row[0] for row in connection.execute("SELECT version FROM schema_migrations").fetchall()}

    for path in sorted(_MIGRATIONS_DIR.glob("*.sql")):
        version = path.stem
        if version in applied:
            continue
        with get_connection() as connection:
            for statement in path.read_text().split(";"):
                statement = statement.strip()
                if statement:
                    connection.execute(statement)
            connection.execute("INSERT INTO schema_migrations (version) VALUES (%s)", (version,))
