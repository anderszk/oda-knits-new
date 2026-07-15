import json
import sqlite3

from backend.config import DATABASE_PATH


def init_db():
    with sqlite3.connect(DATABASE_PATH) as database:
        database.execute(
            """
            CREATE TABLE IF NOT EXISTS contact_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        database.execute(
            """
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                image TEXT NOT NULL,
                images TEXT NOT NULL,
                yarn TEXT NOT NULL,
                fiber TEXT NOT NULL,
                technique TEXT NOT NULL,
                needles TEXT NOT NULL,
                size TEXT NOT NULL,
                time TEXT NOT NULL,
                year TEXT NOT NULL,
                colors TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        database.execute(
            """
            CREATE TABLE IF NOT EXISTS site_content (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        database.execute(
            """
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                items TEXT NOT NULL,
                subtotal INTEGER NOT NULL,
                shipping TEXT NOT NULL,
                payment_method TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        database.execute(
            """
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                price INTEGER NOT NULL,
                description TEXT NOT NULL,
                colors TEXT NOT NULL,
                sizes TEXT NOT NULL,
                badge TEXT NOT NULL,
                stock INTEGER NOT NULL,
                image TEXT NOT NULL DEFAULT '',
                images TEXT NOT NULL DEFAULT '[]'
            )
            """
        )
        product_columns = {row[1] for row in database.execute("PRAGMA table_info(products)")}
        if "image" not in product_columns:
            database.execute("ALTER TABLE products ADD COLUMN image TEXT NOT NULL DEFAULT ''")
        if "images" not in product_columns:
            database.execute("ALTER TABLE products ADD COLUMN images TEXT NOT NULL DEFAULT '[]'")
            for row_id, image in database.execute("SELECT id, image FROM products WHERE image != ''").fetchall():
                database.execute("UPDATE products SET images = ? WHERE id = ?", (json.dumps([image]), row_id))
