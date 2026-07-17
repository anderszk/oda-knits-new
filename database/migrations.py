import json
from pathlib import Path

from database.connection import get_connection

_SCHEMA_PATH = Path(__file__).parent / "schema.sql"


def init_db():
    with get_connection() as connection:
        connection.executescript(_SCHEMA_PATH.read_text())

        # Added after the initial products table shipped without image columns;
        # backfills existing single-image rows into the new `images` list column.
        product_columns = {row[1] for row in connection.execute("PRAGMA table_info(products)")}
        if "image" not in product_columns:
            connection.execute("ALTER TABLE products ADD COLUMN image TEXT NOT NULL DEFAULT ''")
        if "images" not in product_columns:
            connection.execute("ALTER TABLE products ADD COLUMN images TEXT NOT NULL DEFAULT '[]'")
            for row_id, image in connection.execute("SELECT id, image FROM products WHERE image != ''").fetchall():
                connection.execute("UPDATE products SET images = ? WHERE id = ?", (json.dumps([image]), row_id))
        order_columns = {row[1] for row in connection.execute("PRAGMA table_info(orders)")}
        if "payment_reference" not in order_columns:
            connection.execute("ALTER TABLE orders ADD COLUMN payment_reference TEXT NOT NULL DEFAULT ''")
        connection.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_reference "
            "ON orders(payment_reference) WHERE payment_reference != ''"
        )
