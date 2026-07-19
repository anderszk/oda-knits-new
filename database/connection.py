import os
from contextlib import contextmanager

from psycopg_pool import ConnectionPool

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://odaknits:devpassword@localhost:5432/odaknits")

# Small, boring pool sizing for a single low-traffic backend process — plenty of
# headroom under Postgres's default max_connections without tuning anything.
_pool = ConnectionPool(DATABASE_URL, min_size=1, max_size=5, open=True)


@contextmanager
def get_connection():
    """Yield a pooled psycopg connection, committing on success and rolling back on any error."""
    with _pool.connection() as connection:
        yield connection
