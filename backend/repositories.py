import json
import re
import secrets
import sqlite3
from datetime import UTC, datetime

from fastapi import HTTPException

from backend.config import DATABASE_PATH

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


def product_from_row(row):
    product = dict(zip(PRODUCT_COLUMNS, row, strict=True))
    product["colors"] = json.loads(product["colors"])
    product["sizes"] = json.loads(product["sizes"])
    product["images"] = json.loads(product["images"])
    return product


def load_products():
    with sqlite3.connect(DATABASE_PATH) as database:
        rows = database.execute(f"SELECT {', '.join(PRODUCT_COLUMNS)} FROM products").fetchall()
    return [product_from_row(row) for row in rows]


def save_product(database, product, product_id=None):
    final_id = product_id or product.id or unique_id(database, "products", product.title, "product")
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
    database.execute(
        """
        INSERT OR REPLACE INTO products
        (id, title, category, price, description, colors, sizes, badge, stock, image, images)
        VALUES
        (:id, :title, :category, :price, :description, :colors, :sizes, :badge, :stock, :image, :images)
        """,
        values,
    )
    return {**values, "colors": json.loads(values["colors"]), "sizes": json.loads(values["sizes"]), "images": json.loads(values["images"])}


PROJECT_COLUMNS = (
    "id",
    "title",
    "category",
    "description",
    "image",
    "images",
    "yarn",
    "fiber",
    "technique",
    "needles",
    "size",
    "time",
    "year",
    "colors",
    "created_at",
    "updated_at",
)


def project_from_row(row):
    project = dict(zip(PROJECT_COLUMNS, row, strict=True))
    project["images"] = json.loads(project["images"])
    project["colors"] = json.loads(project["colors"])
    return project


def load_projects():
    with sqlite3.connect(DATABASE_PATH) as database:
        rows = database.execute(f"SELECT {', '.join(PROJECT_COLUMNS)} FROM projects ORDER BY created_at DESC").fetchall()
    return [project_from_row(row) for row in rows]


def slugify(value, fallback="item"):
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or f"{fallback}-{secrets.token_hex(3)}"


def unique_id(database, table, title, fallback="item"):
    base = slugify(title, fallback)
    candidate = base
    index = 2
    while database.execute(f"SELECT 1 FROM {table} WHERE id = ?", (candidate,)).fetchone():
        candidate = f"{base}-{index}"
        index += 1
    return candidate


def save_project(database, project, project_id=None):
    now = datetime.now(UTC).isoformat()
    existing = database.execute("SELECT created_at FROM projects WHERE id = ?", (project_id or project.id,)).fetchone()
    final_id = project_id or project.id or unique_id(database, "projects", project.title, "project")
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
    database.execute(
        """
        INSERT OR REPLACE INTO projects
        (id, title, category, description, image, images, yarn, fiber, technique, needles, size, time, year, colors, created_at, updated_at)
        VALUES
        (:id, :title, :category, :description, :image, :images, :yarn, :fiber, :technique, :needles, :size, :time, :year, :colors, :created_at, :updated_at)
        """,
        values,
    )
    return values


def load_content(key, fallback):
    with sqlite3.connect(DATABASE_PATH) as database:
        row = database.execute("SELECT value FROM site_content WHERE key = ?", (key,)).fetchone()
    return json.loads(row[0]) if row else fallback


def save_content(key, value):
    with sqlite3.connect(DATABASE_PATH) as database:
        database.execute(
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
