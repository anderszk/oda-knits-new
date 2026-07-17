import re
import secrets
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Request

from backend.config import STRIPE_SECRET_KEY, VIPPS_CONFIGURED
from backend.models.orders import PaymentItemsPayload, VippsPaymentPayload
from backend.services.payments import call_stripe, call_vipps, revalidated_subtotal
from backend.services.security import check_rate_limit, client_key

router = APIRouter()


@router.get("/api/payments/config")
def payments_config():
    return {
        "card": bool(STRIPE_SECRET_KEY),
        "applePay": bool(STRIPE_SECRET_KEY),
        "klarna": bool(STRIPE_SECRET_KEY),
        "vipps": VIPPS_CONFIGURED,
    }


@router.post("/api/payments/card-intent", status_code=201)
def create_card_intent(payload: PaymentItemsPayload, request: Request = None):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Card payments are not configured")
    check_rate_limit("card-intent", client_key(request), 10, 10 * 60)
    subtotal = revalidated_subtotal(payload.items)
    result = call_stripe("payment_intents", {
        "amount": subtotal * 100,
        "currency": "nok",
        "payment_method_types[]": "card",
    })
    return {"client_secret": result["client_secret"], "subtotal": subtotal}


@router.post("/api/payments/apple-pay-intent", status_code=201)
def create_apple_pay_intent(payload: PaymentItemsPayload, request: Request = None):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Apple Pay is not configured")
    check_rate_limit("apple-pay-intent", client_key(request), 10, 10 * 60)
    subtotal = revalidated_subtotal(payload.items)
    # Stripe amounts are in the currency's smallest unit; NOK has 2 decimals (ore), so kr * 100.
    result = call_stripe("payment_intents", {
        "amount": subtotal * 100,
        "currency": "nok",
        "payment_method_types[]": "card",
    })
    return {"client_secret": result["client_secret"], "subtotal": subtotal}


@router.post("/api/payments/klarna-intent", status_code=201)
def create_klarna_intent(payload: PaymentItemsPayload, request: Request = None):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Klarna is not configured")
    check_rate_limit("klarna-intent", client_key(request), 10, 10 * 60)
    subtotal = revalidated_subtotal(payload.items)
    result = call_stripe("payment_intents", {
        "amount": subtotal * 100,
        "currency": "nok",
        "payment_method_types[]": "klarna",
    })
    return {"client_secret": result["client_secret"], "subtotal": subtotal}


@router.get("/api/payments/klarna-status")
def klarna_status(payment_intent: str, request: Request = None):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Klarna is not configured")
    check_rate_limit("klarna-status", client_key(request), 20, 10 * 60)
    if not re.fullmatch(r"pi_[A-Za-z0-9]+", payment_intent):
        raise HTTPException(status_code=400, detail="Invalid payment reference")
    result = call_stripe(f"payment_intents/{payment_intent}", method="GET")
    return {"status": result.get("status", "unknown")}


@router.post("/api/payments/vipps-payment", status_code=201)
def create_vipps_payment(payload: VippsPaymentPayload, request: Request = None):
    if not VIPPS_CONFIGURED:
        raise HTTPException(status_code=503, detail="Vipps is not configured")
    if not payload.return_url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Invalid return URL")
    check_rate_limit("vipps-payment", client_key(request), 10, 10 * 60)
    subtotal = revalidated_subtotal(payload.items)
    reference = f"OK-{datetime.now(UTC).strftime('%y%m%d')}-{secrets.token_hex(6)}"

    result = call_vipps("epayment/v1/payments", {
        "amount": {"currency": "NOK", "value": subtotal * 100},
        "paymentMethod": {"type": "WALLET"},
        "userFlow": "WEB_REDIRECT",
        "returnUrl": payload.return_url,
        "reference": reference,
        "paymentDescription": "Oda Knits order",
    }, idempotent=True)

    return {"redirect_url": result["redirectUrl"], "reference": reference, "subtotal": subtotal}


@router.get("/api/payments/vipps-status")
def vipps_status(reference: str, request: Request = None):
    if not VIPPS_CONFIGURED:
        raise HTTPException(status_code=503, detail="Vipps is not configured")
    check_rate_limit("vipps-status", client_key(request), 20, 10 * 60)
    if not re.fullmatch(r"OK-\d{6}-[0-9a-f]{12}", reference):
        raise HTTPException(status_code=400, detail="Invalid payment reference")
    result = call_vipps(f"epayment/v1/payments/{reference}", method="GET")
    return {"state": result.get("state", "UNKNOWN")}
