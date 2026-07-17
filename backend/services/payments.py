import json
import logging
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request

from fastapi import HTTPException

logger = logging.getLogger(__name__)

from backend.config import (
    STRIPE_SECRET_KEY,
    VIPPS_BASE_URL,
    VIPPS_CLIENT_ID,
    VIPPS_CLIENT_SECRET,
    VIPPS_MSN,
    VIPPS_SUBSCRIPTION_KEY,
)
from backend.models.orders import OrderItem
from backend.repositories import product_repository

vipps_token_cache = {"expires_at": 0.0, "token": ""}


def revalidated_subtotal(items: list[OrderItem]) -> int:
    catalog = {product["id"]: product for product in product_repository.list()}
    for item in items:
        product = catalog.get(item.id)
        if not product or item.price != product["price"] or item.size not in product["sizes"]:
            raise HTTPException(status_code=400, detail="One of the items in your basket is no longer available")
    subtotal = sum(item.price * item.quantity for item in items)
    if subtotal <= 0:
        raise HTTPException(status_code=400, detail="Your basket is empty")
    return subtotal


def call_stripe(path: str, body: dict | None = None, method: str = "POST"):
    request_obj = urllib.request.Request(
        f"https://api.stripe.com/v1/{path}",
        data=urllib.parse.urlencode(body).encode() if body is not None else None,
        headers={"Authorization": f"Bearer {STRIPE_SECRET_KEY}"},
        method=method,
    )
    try:
        with urllib.request.urlopen(request_obj, timeout=8) as response:
            return json.load(response)
    except (OSError, urllib.error.URLError, json.JSONDecodeError):
        raise HTTPException(status_code=502, detail="Could not reach payment provider")


def vipps_access_token() -> str:
    if vipps_token_cache["expires_at"] > time.monotonic():
        return vipps_token_cache["token"]
    request_obj = urllib.request.Request(
        f"{VIPPS_BASE_URL}/accesstoken/get",
        data=b"",
        headers={
            "client_id": VIPPS_CLIENT_ID,
            "client_secret": VIPPS_CLIENT_SECRET,
            "Ocp-Apim-Subscription-Key": VIPPS_SUBSCRIPTION_KEY,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request_obj, timeout=8) as response:
            payload = json.load(response)
        vipps_token_cache.update({
            "token": payload["access_token"],
            "expires_at": time.monotonic() + max(60, int(payload.get("expires_in", 3600)) - 120),
        })
    except urllib.error.HTTPError as error:
        logger.error("Vipps access token request failed: %s %s", error.code, error.read().decode(errors="replace"))
        raise HTTPException(status_code=502, detail="Could not reach Vipps")
    except (OSError, urllib.error.URLError, json.JSONDecodeError, KeyError) as error:
        logger.error("Vipps access token request failed: %r", error)
        raise HTTPException(status_code=502, detail="Could not reach Vipps")
    return vipps_token_cache["token"]


def call_vipps(path: str, body: dict | None = None, method: str = "POST", idempotent: bool = False):
    headers = {
        "Authorization": f"Bearer {vipps_access_token()}",
        "Ocp-Apim-Subscription-Key": VIPPS_SUBSCRIPTION_KEY,
        "Merchant-Serial-Number": VIPPS_MSN,
        "Content-Type": "application/json",
    }
    if idempotent:
        headers["Idempotency-Key"] = secrets.token_hex(16)
    request_obj = urllib.request.Request(
        f"{VIPPS_BASE_URL}/{path}",
        data=json.dumps(body).encode() if body is not None else None,
        headers=headers,
        method=method,
    )
    try:
        with urllib.request.urlopen(request_obj, timeout=8) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        logger.error("Vipps request to %s failed: %s %s", path, error.code, error.read().decode(errors="replace"))
        raise HTTPException(status_code=502, detail="Could not reach Vipps")
    except (OSError, urllib.error.URLError, json.JSONDecodeError) as error:
        logger.error("Vipps request to %s failed: %r", path, error)
        raise HTTPException(status_code=502, detail="Could not reach Vipps")
