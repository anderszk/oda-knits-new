import json

from database.connection import get_connection


class OrderRepository:
    """Data access for placed orders."""

    def create(self, order_id, order, subtotal, created_at):
        with get_connection() as connection:
            connection.execute(
                "INSERT INTO orders (id, items, subtotal, shipping, payment_method, payment_reference, created_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (
                    order_id,
                    json.dumps([item.model_dump() for item in order.items]),
                    subtotal,
                    json.dumps(order.shipping.model_dump(mode="json")),
                    order.payment_method,
                    order.payment_reference,
                    created_at,
                ),
            )


order_repository = OrderRepository()
