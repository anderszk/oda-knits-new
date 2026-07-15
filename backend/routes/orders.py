import json
import secrets
import smtplib
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Request

from backend.models.orders import OrderPayload
from backend.services.email import send_order_email
from backend.services.security import check_rate_limit, client_key
from database.repositories import order_repository, product_repository

router = APIRouter()


@router.post("/api/orders", status_code=201)
def create_order(order: OrderPayload, request: Request = None):
    check_rate_limit("order", client_key(request), 5, 10 * 60)
    catalog = {product["id"]: product for product in product_repository.list()}
    for item in order.items:
        product = catalog.get(item.id)
        if not product or item.price != product["price"] or item.size not in product["sizes"]:
            raise HTTPException(status_code=400, detail="One of the items in your basket is no longer available")

    subtotal = sum(item.price * item.quantity for item in order.items)
    order_id = f"OK-{datetime.now(UTC).strftime('%y%m%d')}-{secrets.token_hex(3).upper()}"
    created_at = datetime.now(UTC).isoformat()
    order_repository.create(
        order_id,
        json.dumps([item.model_dump() for item in order.items]),
        subtotal,
        json.dumps(order.shipping.model_dump(mode="json")),
        order.payment_method,
        created_at,
    )
    try:
        send_order_email(order, order_id, subtotal, created_at)
    except (OSError, RuntimeError, smtplib.SMTPException):
        pass
    return {"ok": True, "id": order_id, "subtotal": subtotal}
