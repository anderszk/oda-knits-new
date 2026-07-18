from database.connection import get_connection


class OrderRepository:
    """Data access for placed orders."""

    def create(self, order_id, items, subtotal, shipping, payment_method, payment_reference, created_at, connection=None):
        def run(conn):
            conn.execute(
                "INSERT INTO orders (id, items, subtotal, shipping, payment_method, payment_reference, created_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (order_id, items, subtotal, shipping, payment_method, payment_reference, created_at),
            )

        if connection is not None:
            run(connection)
            return
        with get_connection() as connection:
            run(connection)


order_repository = OrderRepository()
