import smtplib
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Request

from backend.models.contact import ContactMessage
from backend.services.email import send_contact_email
from backend.services.security import check_rate_limit, client_key
from backend.repositories import contact_message_repository, content_repository

router = APIRouter()


@router.post("/api/contact", status_code=201)
def contact(message: ContactMessage, request: Request = None):
    check_rate_limit("contact", client_key(request), 10, 5 * 60)
    created_at = datetime.now(UTC).isoformat()
    message_id = contact_message_repository.create(message.name, str(message.email), message.message, created_at)
    try:
        send_contact_email(message, created_at)
    except (OSError, RuntimeError, smtplib.SMTPException) as error:
        raise HTTPException(status_code=502, detail="Message saved, but email could not be sent.") from error
    return {
        "ok": True,
        "id": message_id,
        "message": content_repository.get_contact_info()["success"].format(name=message.name),
    }
