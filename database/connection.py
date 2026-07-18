import os
from contextlib import contextmanager

import psycopg

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://odaknits:devpassword@localhost:5432/odaknits")


@contextmanager
def get_connection():
    """Yield a psycopg connection, committing on success and rolling back on any error."""
    connection = psycopg.connect(DATABASE_URL)
    try:
        yield connection
        connection.commit()
    except psycopg.Error:
        connection.rollback()
        raise
    finally:
        connection.close()
