import smtplib
import sqlite3
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Request

from backend.config import DATABASE_PATH
from backend.models.contact import ContactMessage
from backend.repositories import load_contact_info
from backend.services.email import send_contact_email
from backend.services.security import check_rate_limit, client_key

router = APIRouter()


@router.post("/api/contact", status_code=201)
def contact(message: ContactMessage, request: Request = None):
    check_rate_limit("contact", client_key(request), 3, 5 * 60)
    created_at = datetime.now(UTC).isoformat()
    with sqlite3.connect(DATABASE_PATH) as database:
        cursor = database.execute(
            "INSERT INTO contact_messages (name, email, message, created_at) VALUES (?, ?, ?, ?)",
            (message.name, str(message.email), message.message, created_at),
        )
    try:
        send_contact_email(message, created_at)
    except (OSError, RuntimeError, smtplib.SMTPException) as error:
        raise HTTPException(status_code=502, detail="Message saved, but email could not be sent.") from error
    return {
        "ok": True,
        "id": cursor.lastrowid,
        "message": load_contact_info()["success"].format(name=message.name),
    }
