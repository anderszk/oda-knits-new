from database.connection import get_connection


class ContactMessageRepository:
    """Data access for inbound contact form submissions."""

    def create(self, name, email, message, created_at) -> int:
        with get_connection() as connection:
            cursor = connection.execute(
                "INSERT INTO contact_messages (name, email, message, created_at) VALUES (?, ?, ?, ?)",
                (name, email, message, created_at),
            )
            return cursor.lastrowid


contact_message_repository = ContactMessageRepository()
