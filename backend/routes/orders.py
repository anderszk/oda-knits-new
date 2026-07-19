import logging
import re
import secrets
import smtplib
from datetime import UTC, datetime

import psycopg
from fastapi import APIRouter, HTTPException, Request

from backend.models.orders import OrderPayload
from backend.services.email import send_order_email
from backend.services.payments import call_stripe, call_vipps, validate_and_price
from backend.services.security import check_rate_limit, client_key
from backend.repositories import order_repository

router = APIRouter()
logger = logging.getLogger(__name__)

STRIPE_PAYMENT_METHODS = {"Card", "Apple Pay", "Klarna"}
STRIPE_REFERENCE_RE = re.compile(r"pi_[A-Za-z0-9]+")
VIPPS_REFERENCE_RE = re.compile(r"OK-\d{6}-[0-9a-f]{12}")


def _verify_payment(payment_method: str, payment_reference: str, subtotal: int) -> None:
    if payment_method in STRIPE_PAYMENT_METHODS:
        if not STRIPE_REFERENCE_RE.fullmatch(payment_reference):
            raise HTTPException(status_code=400, detail="Invalid payment reference")
        payment = call_stripe(f"payment_intents/{payment_reference}", method="GET")
        if (
            payment.get("status") != "succeeded"
            or payment.get("amount") != subtotal * 100
            or payment.get("currency") != "nok"
        ):
            raise HTTPException(status_code=402, detail="Payment could not be verified")
    elif payment_method == "Vipps":
        if not VIPPS_REFERENCE_RE.fullmatch(payment_reference):
            raise HTTPException(status_code=400, detail="Invalid payment reference")
        payment = call_vipps(f"epayment/v1/payments/{payment_reference}", method="GET")
        if (
            payment.get("state") != "AUTHORIZED"
            or payment.get("amount", {}).get("value") != subtotal * 100
        ):
            raise HTTPException(status_code=402, detail="Payment could not be verified")
    else:
        raise HTTPException(status_code=400, detail="Unknown payment method")


@router.post("/api/orders", status_code=201)
def create_order(order: OrderPayload, request: Request = None):
    check_rate_limit("order", client_key(request), 5, 10 * 60)
    subtotal = validate_and_price(order.items)
    _verify_payment(order.payment_method, order.payment_reference, subtotal)

    order_id = f"OK-{datetime.now(UTC).strftime('%y%m%d')}-{secrets.token_hex(3).upper()}"
    created_at = datetime.now(UTC).isoformat()
    try:
        order_repository.create(order_id, order, subtotal, created_at)
    except psycopg.errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="This payment has already been used for an order")
    try:
        send_order_email(order, order_id, subtotal, created_at)
    except (OSError, RuntimeError, smtplib.SMTPException):
        logger.exception("Failed to send order confirmation email for order %s", order_id)
    return {"ok": True, "id": order_id, "subtotal": subtotal}
