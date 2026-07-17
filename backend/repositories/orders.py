from database.connection import get_connection


class OrderRepository:
    """Data access for placed orders."""

    def create(self, order_id, items, subtotal, shipping, payment_method, payment_reference, created_at):
        with get_connection() as connection:
            connection.execute(
                "INSERT INTO orders (id, items, subtotal, shipping, payment_method, payment_reference, created_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (order_id, items, subtotal, shipping, payment_method, payment_reference, created_at),
            )


order_repository = OrderRepository()
