import json
import re
import secrets
from datetime import UTC, datetime

from fastapi import HTTPException

from database.connection import get_connection

ABOUT = {
    "name": "Hi, I'm Oda.",
    "headline": "I turn quiet evenings into colorful things you can wear.",
    "body": [
        "I am the hands behind Oda Knits, an independent knitter and color obsessive based in Oslo. I learned from my grandmother, then kept going until every shelf in my home held yarn.",
        "My work mixes practical Nordic shapes with playful palettes. I make slowly, choose gentle fibers, and design pieces meant to be worn often rather than saved for special days.",
    ],
    "details": [
        {"label": "Based in", "value": "Oslo, Norway"},
        {"label": "Favorite fiber", "value": "Brushed mohair"},
        {"label": "Currently knitting", "value": "A lemon-yellow vest"},
    ],
    "stats": [
        {"label": "pieces made", "value": "140+"},
        {"label": "natural fibers", "value": "92%"},
        {"label": "custom colors", "value": "18"},
    ],
}

CONTACT_INFO = {
    "eyebrow": "Contact",
    "heading": "Custom color, repair, or collaboration?",
    "body": "Send a note and Oda Knits will reply with availability and next steps.",
    "button": "Send note",
    "success": "Thanks {name}, your note has been received.",
}

PRODUCT_COLUMNS = ("id", "title", "category", "price", "description", "colors", "sizes", "badge", "stock", "image", "images")
PROJECT_COLUMNS = (
    "id", "title", "category", "description", "image", "images", "yarn", "fiber",
    "technique", "needles", "size", "time", "year", "colors", "created_at", "updated_at",
)

_EXISTS_QUERY_BY_TABLE = {
    "products": "SELECT 1 FROM products WHERE id = ?",
    "projects": "SELECT 1 FROM projects WHERE id = ?",
}


def product_from_row(row):
    product = dict(zip(PRODUCT_COLUMNS, row, strict=True))
    product["colors"] = json.loads(product["colors"])
    product["sizes"] = json.loads(product["sizes"])
    product["images"] = json.loads(product["images"])
    return product


def load_products():
    with get_connection() as connection:
        rows = connection.execute(f"SELECT {', '.join(PRODUCT_COLUMNS)} FROM products").fetchall()
    return [product_from_row(row) for row in rows]


def product_exists(product_id: str) -> bool:
    with get_connection() as connection:
        return connection.execute(_EXISTS_QUERY_BY_TABLE["products"], (product_id,)).fetchone() is not None


def delete_product(product_id: str):
    with get_connection() as connection:
        connection.execute("DELETE FROM products WHERE id = ?", (product_id,))


def save_product(product, product_id=None):
    with get_connection() as connection:
        final_id = product_id or product.id or unique_id(connection, "products", product.title, "product")
        images = [image for image in product.images if image]
        if product.image and product.image not in images:
            images.insert(0, product.image)
        cover = product.image or (images[0] if images else "")
        values = {
            "id": final_id,
            "title": product.title,
            "category": product.category,
            "price": product.price,
            "description": product.description,
            "colors": json.dumps([color.model_dump() for color in product.colors]),
            "sizes": json.dumps(product.sizes),
            "badge": product.badge,
            "stock": product.stock,
            "image": cover,
            "images": json.dumps(images),
        }
        placeholders = ", ".join(["?"] * len(PRODUCT_COLUMNS))
        connection.execute(
            f"INSERT OR REPLACE INTO products ({', '.join(PRODUCT_COLUMNS)}) VALUES ({placeholders})",
            tuple(values[column] for column in PRODUCT_COLUMNS),
        )
    return {**values, "colors": json.loads(values["colors"]), "sizes": json.loads(values["sizes"]), "images": json.loads(values["images"])}


def project_from_row(row):
    project = dict(zip(PROJECT_COLUMNS, row, strict=True))
    project["images"] = json.loads(project["images"])
    project["colors"] = json.loads(project["colors"])
    return project


def load_projects():
    with get_connection() as connection:
        rows = connection.execute(
            f"SELECT {', '.join(PROJECT_COLUMNS)} FROM projects ORDER BY created_at DESC"
        ).fetchall()
    return [project_from_row(row) for row in rows]


def project_exists(project_id: str) -> bool:
    with get_connection() as connection:
        return connection.execute(_EXISTS_QUERY_BY_TABLE["projects"], (project_id,)).fetchone() is not None


def delete_project(project_id: str):
    with get_connection() as connection:
        connection.execute("DELETE FROM projects WHERE id = ?", (project_id,))


def slugify(value, fallback="item"):
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or f"{fallback}-{secrets.token_hex(3)}"


def unique_id(connection, table, title, fallback="item"):
    base = slugify(title, fallback)
    candidate = base
    index = 2
    while connection.execute(_EXISTS_QUERY_BY_TABLE[table], (candidate,)).fetchone():
        candidate = f"{base}-{index}"
        index += 1
    return candidate


def save_project(project, project_id=None):
    with get_connection() as connection:
        now = datetime.now(UTC).isoformat()
        existing = connection.execute(
            "SELECT created_at FROM projects WHERE id = ?", (project_id or project.id,)
        ).fetchone()
        final_id = project_id or project.id or unique_id(connection, "projects", project.title, "project")
        images = [image for image in project.images if image]
        if project.image and project.image not in images:
            images.insert(0, project.image)
        cover = project.image or (images[0] if images else "")
        if not cover:
            raise HTTPException(status_code=400, detail="Project image is required")
        values = {
            "id": final_id,
            "title": project.title,
            "category": project.category,
            "description": project.description,
            "image": cover,
            "images": json.dumps(images),
            "yarn": project.yarn,
            "fiber": project.fiber,
            "technique": project.technique,
            "needles": project.needles,
            "size": project.size,
            "time": project.time,
            "year": project.year,
            "colors": json.dumps([color.model_dump() for color in project.colors]),
            "created_at": existing[0] if existing else now,
            "updated_at": now,
        }
        placeholders = ", ".join(["?"] * len(PROJECT_COLUMNS))
        connection.execute(
            f"INSERT OR REPLACE INTO projects ({', '.join(PROJECT_COLUMNS)}) VALUES ({placeholders})",
            tuple(values[column] for column in PROJECT_COLUMNS),
        )
    return values


def load_content(key, fallback):
    with get_connection() as connection:
        row = connection.execute("SELECT value FROM site_content WHERE key = ?", (key,)).fetchone()
    return json.loads(row[0]) if row else fallback


def save_content(key, value):
    with get_connection() as connection:
        connection.execute(
            "INSERT OR REPLACE INTO site_content (key, value, updated_at) VALUES (?, ?, ?)",
            (key, json.dumps(value), datetime.now(UTC).isoformat()),
        )
    return value


def load_about():
    return load_content("about", ABOUT)


def save_about(about):
    return save_content("about", about.model_dump())


def load_contact_info():
    return load_content("contact", CONTACT_INFO)


def save_contact_info(contact_info):
    return save_content("contact", contact_info.model_dump())


def insert_order(order_id, items, subtotal, shipping, payment_method, created_at):
    with get_connection() as connection:
        connection.execute(
            "INSERT INTO orders (id, items, subtotal, shipping, payment_method, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (order_id, items, subtotal, shipping, payment_method, created_at),
        )


def insert_contact_message(name, email, message, created_at) -> int:
    with get_connection() as connection:
        cursor = connection.execute(
            "INSERT INTO contact_messages (name, email, message, created_at) VALUES (?, ?, ?, ?)",
            (name, email, message, created_at),
        )
        return cursor.lastrowid
