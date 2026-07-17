import json
import logging
import re
import secrets
import smtplib
import sqlite3
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Request

from backend.models.orders import OrderPayload
from backend.services.email import send_order_email
from backend.services.payments import call_stripe, call_vipps
from backend.services.security import check_rate_limit, client_key
from backend.repositories import order_repository, product_repository

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
    catalog = {product["id"]: product for product in product_repository.list()}
    for item in order.items:
        product = catalog.get(item.id)
        if not product or item.price != product["price"] or item.size not in product["sizes"]:
            raise HTTPException(status_code=400, detail="One of the items in your basket is no longer available")

    subtotal = sum(item.price * item.quantity for item in order.items)
    _verify_payment(order.payment_method, order.payment_reference, subtotal)

    order_id = f"OK-{datetime.now(UTC).strftime('%y%m%d')}-{secrets.token_hex(3).upper()}"
    created_at = datetime.now(UTC).isoformat()
    try:
        order_repository.create(
            order_id,
            json.dumps([item.model_dump() for item in order.items]),
            subtotal,
            json.dumps(order.shipping.model_dump(mode="json")),
            order.payment_method,
            order.payment_reference,
            created_at,
        )
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="This payment has already been used for an order")
    try:
        send_order_email(order, order_id, subtotal, created_at)
    except (OSError, RuntimeError, smtplib.SMTPException):
        logger.exception("Failed to send order confirmation email for order %s", order_id)
    return {"ok": True, "id": order_id, "subtotal": subtotal}
