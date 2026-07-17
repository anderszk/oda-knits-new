import smtplib
from email.message import EmailMessage

from backend.config import CONTACT_EMAIL_TO, SMTP_FROM, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER
from backend.models.contact import ContactMessage
from backend.models.orders import OrderPayload


def send_contact_email(message: ContactMessage, created_at: str):
    if not SMTP_HOST or not SMTP_FROM:
        raise RuntimeError("SMTP_HOST and SMTP_FROM or SMTP_USER must be set")

    email = EmailMessage()
    email["To"] = CONTACT_EMAIL_TO
    email["From"] = SMTP_FROM
    email["Reply-To"] = str(message.email)
    email["Subject"] = f"Oda Knits Inquiry from {message.name}"
    email.set_content(
        f"Name: {message.name}\n"
        f"Email: {message.email}\n"
        f"Received: {created_at}\n\n"
        f"{message.message}\n"
    )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
        server.starttls()
        if SMTP_USER and SMTP_PASSWORD:
            server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(email)


def send_order_email(order: OrderPayload, order_id: str, subtotal: int, created_at: str):
    if not SMTP_HOST or not SMTP_FROM:
        raise RuntimeError("SMTP_HOST and SMTP_FROM or SMTP_USER must be set")

    lines = "\n".join(
        f"- {item.quantity} x {item.title} ({item.size}) - {item.price * item.quantity} kr"
        for item in order.items
    )
    shipping = order.shipping
    email = EmailMessage()
    email["To"] = CONTACT_EMAIL_TO
    email["From"] = SMTP_FROM
    email["Reply-To"] = str(shipping.email)
    email["Subject"] = f"Oda Knits order {order_id}"
    email.set_content(
        f"Order: {order_id}\n"
        f"Received: {created_at}\n"
        f"Payment method (mock checkout): {order.payment_method}\n\n"
        f"Items:\n{lines}\n\n"
        f"Subtotal: {subtotal} kr\n\n"
        f"Ship to:\n{shipping.name}\n{shipping.address}\n{shipping.postal_code} {shipping.city}\n"
        f"{shipping.phone}\n{shipping.email}\n"
    )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
        server.starttls()
        if SMTP_USER and SMTP_PASSWORD:
            server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(email)
