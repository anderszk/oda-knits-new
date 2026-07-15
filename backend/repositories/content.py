import json
from datetime import UTC, datetime

from database.connection import get_connection

ABOUT_DEFAULT = {
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

CONTACT_INFO_DEFAULT = {
    "eyebrow": "Contact",
    "heading": "Custom color, repair, or collaboration?",
    "body": "Send a note and Oda Knits will reply with availability and next steps.",
    "button": "Send note",
    "success": "Thanks {name}, your note has been received.",
}


class ContentRepository:
    """Data access for editable site copy (about page, contact page), both backed
    by the same key/value `site_content` table."""

    def _load(self, key, fallback):
        with get_connection() as connection:
            row = connection.execute("SELECT value FROM site_content WHERE key = ?", (key,)).fetchone()
        return json.loads(row[0]) if row else fallback

    def _save(self, key, value):
        with get_connection() as connection:
            connection.execute(
                "INSERT OR REPLACE INTO site_content (key, value, updated_at) VALUES (?, ?, ?)",
                (key, json.dumps(value), datetime.now(UTC).isoformat()),
            )
        return value

    def get_about(self):
        return self._load("about", ABOUT_DEFAULT)

    def save_about(self, about):
        return self._save("about", about.model_dump())

    def get_contact_info(self):
        return self._load("contact", CONTACT_INFO_DEFAULT)

    def save_contact_info(self, contact_info):
        return self._save("contact", contact_info.model_dump())


content_repository = ContentRepository()
