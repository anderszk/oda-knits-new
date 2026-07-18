import re
import secrets

_EXISTS_QUERY_BY_TABLE = {
    "products": "SELECT 1 FROM products WHERE id = %s",
    "projects": "SELECT 1 FROM projects WHERE id = %s",
}


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
