import json

from database.connection import get_connection
from backend.repositories.base import unique_id

COLUMNS = ("id", "title", "category", "price", "description", "colors", "sizes", "badge", "stock", "image", "images")


class ProductRepository:
    """Data access for the product catalog."""

    columns = COLUMNS

    def _from_row(self, row):
        product = dict(zip(self.columns, row, strict=True))
        product["colors"] = json.loads(product["colors"])
        product["sizes"] = json.loads(product["sizes"])
        product["images"] = json.loads(product["images"])
        return product

    def list(self):
        with get_connection() as connection:
            rows = connection.execute(f"SELECT {', '.join(self.columns)} FROM products").fetchall()
        return [self._from_row(row) for row in rows]

    def exists(self, product_id: str) -> bool:
        with get_connection() as connection:
            return connection.execute("SELECT 1 FROM products WHERE id = ?", (product_id,)).fetchone() is not None

    def delete(self, product_id: str):
        with get_connection() as connection:
            connection.execute("DELETE FROM products WHERE id = ?", (product_id,))

    def save(self, product, product_id=None):
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
            placeholders = ", ".join(["?"] * len(self.columns))
            connection.execute(
                f"INSERT OR REPLACE INTO products ({', '.join(self.columns)}) VALUES ({placeholders})",
                tuple(values[column] for column in self.columns),
            )
        return {
            **values,
            "colors": json.loads(values["colors"]),
            "sizes": json.loads(values["sizes"]),
            "images": json.loads(values["images"]),
        }


product_repository = ProductRepository()
