"""One-time helper to populate the products table for local development.

Run manually: python backend/seed_products.py
Safe to re-run - existing rows (matched by id) are left untouched.
"""

import json
import os
import sqlite3
from pathlib import Path

SEED_PRODUCTS = [
    {
        "id": "strawberry-beanie",
        "title": "Strawberry Beanie",
        "category": "Hats",
        "price": 450,
        "description": "A slouchy merino beanie with a folded brim, knit in strawberry red with a cream fleck.",
        "colors": [{"name": "Strawberry", "hex": "#e0607a"}, {"name": "Cream", "hex": "#fff9f0"}],
        "sizes": ["One size"],
        "badge": "Bestseller",
        "stock": 6,
        "image": "https://images.unsplash.com/photo-1544967919-44c1ef2f9e7a?w=900&h=900&fit=crop&crop=entropy&q=80&auto=format&fm=jpg",
    },
    {
        "id": "cloud-mohair-sweater",
        "title": "Cloud Mohair Sweater",
        "category": "Sweaters",
        "price": 1290,
        "description": "Brushed mohair blend, loose and airy with dropped shoulders. Made to be lived in.",
        "colors": [{"name": "Mint", "hex": "#a9ddce"}, {"name": "Blush", "hex": "#f7c9d6"}],
        "sizes": ["XS/S", "M/L", "XL/XXL"],
        "badge": "New",
        "stock": 4,
        "image": "https://images.unsplash.com/photo-1706864685919-abccadda8d0e?w=900&h=900&fit=crop&crop=entropy&q=80&auto=format&fm=jpg",
    },
    {
        "id": "sunshine-striped-scarf",
        "title": "Sunshine Striped Scarf",
        "category": "Scarves",
        "price": 390,
        "description": "A long striped scarf in buttery yellow and lavender, soft merino with fringed ends.",
        "colors": [{"name": "Sunshine", "hex": "#f6dc74"}, {"name": "Lavender", "hex": "#c6b6ec"}],
        "sizes": ["One size"],
        "badge": "",
        "stock": 11,
        "image": "https://images.unsplash.com/photo-1636576507919-929955a345c8?w=900&h=900&fit=crop&crop=entropy&q=80&auto=format&fm=jpg",
    },
    {
        "id": "petal-mittens",
        "title": "Petal Mittens",
        "category": "Accessories",
        "price": 320,
        "description": "Cropped mittens with a scalloped cuff, knit in a soft rose with a mint lining peek.",
        "colors": [{"name": "Rose", "hex": "#d7658a"}, {"name": "Mint", "hex": "#dff3ec"}],
        "sizes": ["S", "M", "L"],
        "badge": "",
        "stock": 9,
        "image": "https://images.unsplash.com/photo-1680420562679-74976cfbc0dc?w=900&h=900&fit=crop&crop=entropy&q=80&auto=format&fm=jpg",
    },
    {
        "id": "wildflower-cardigan",
        "title": "Wildflower Cardigan",
        "category": "Sweaters",
        "price": 1490,
        "description": "A cropped cardigan with hand-embroidered wildflowers along the placket. One of a kind detailing.",
        "colors": [{"name": "Wine", "hex": "#9a4264"}, {"name": "Star", "hex": "#bd5bd3"}],
        "sizes": ["XS/S", "M/L", "XL/XXL"],
        "badge": "Limited",
        "stock": 2,
        "image": "https://images.unsplash.com/photo-1610288311735-39b7facbd095?w=900&h=900&fit=crop&crop=entropy&q=80&auto=format&fm=jpg",
    },
    {
        "id": "lavender-socks",
        "title": "Lavender Socks",
        "category": "Accessories",
        "price": 260,
        "description": "Ribbed ankle socks with a reinforced heel, knit in a dreamy lavender fade.",
        "colors": [{"name": "Lavender", "hex": "#c6b6ec"}, {"name": "Cream", "hex": "#fff9f0"}],
        "sizes": ["36-38", "39-41", "42-44"],
        "badge": "",
        "stock": 14,
        "image": "https://images.unsplash.com/photo-1589895869111-cab6bf8354c8?w=900&h=900&fit=crop&crop=entropy&q=80&auto=format&fm=jpg",
    },
    {
        "id": "honey-vest",
        "title": "Honey Vest",
        "category": "Vests",
        "price": 890,
        "description": "A cable-knit vest in warm honey tones, perfect layered over a blouse or worn alone.",
        "colors": [{"name": "Honey", "hex": "#e3a85e"}, {"name": "Cream", "hex": "#fff9f0"}],
        "sizes": ["XS/S", "M/L"],
        "badge": "",
        "stock": 5,
        "image": "https://images.unsplash.com/photo-1635327408138-3d1c42124523?w=900&h=900&fit=crop&crop=entropy&q=80&auto=format&fm=jpg",
    },
    {
        "id": "bubblegum-leg-warmers",
        "title": "Bubblegum Leg Warmers",
        "category": "Accessories",
        "price": 340,
        "description": "Slouchy leg warmers in bubblegum pink with a chunky rib, ready for cold studio floors.",
        "colors": [{"name": "Bubblegum", "hex": "#f2a7c6"}, {"name": "Star", "hex": "#bd5bd3"}],
        "sizes": ["One size"],
        "badge": "New",
        "stock": 8,
        "image": "https://images.unsplash.com/photo-1571139627661-cf707929f465?w=900&h=900&fit=crop&crop=entropy&q=80&auto=format&fm=jpg",
    },
]


def seed(database_path):
    with sqlite3.connect(database_path) as database:
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
                image TEXT NOT NULL DEFAULT ''
            )
            """
        )
        database.executemany(
            "INSERT OR IGNORE INTO products (id, title, category, price, description, colors, sizes, badge, stock, image) "
            "VALUES (:id, :title, :category, :price, :description, :colors, :sizes, :badge, :stock, :image)",
            [
                {**product, "colors": json.dumps(product["colors"]), "sizes": json.dumps(product["sizes"])}
                for product in SEED_PRODUCTS
            ],
        )


if __name__ == "__main__":
    seed(Path(os.getenv("DATABASE_PATH", "backend/oda-knit.db")))
    print(f"Seeded {len(SEED_PRODUCTS)} products (existing rows left untouched).")
