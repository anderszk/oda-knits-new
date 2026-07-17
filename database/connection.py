import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

DATABASE_PATH = Path(os.getenv("DATABASE_PATH", "database/oda-knit.db"))
DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)


@contextmanager
def get_connection():
    """Yield a sqlite3 connection, committing on success and rolling back on any error."""
    connection = sqlite3.connect(DATABASE_PATH)
    try:
        connection.execute("PRAGMA busy_timeout = 5000")
        connection.execute("PRAGMA journal_mode = WAL")
        yield connection
        connection.commit()
    except sqlite3.Error:
        connection.rollback()
        raise
    finally:
        connection.close()
