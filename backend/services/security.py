import time
from collections import defaultdict, deque

from fastapi import Header, HTTPException, Request

admin_tokens = {}
rate_limits = defaultdict(deque)


def client_key(request: Request | None, fallback: str = "local"):
    return request.client.host if request and request.client else fallback


def check_rate_limit(name: str, key: str, limit: int, window_seconds: int):
    now = time.monotonic()
    bucket = rate_limits[(name, key)]
    while bucket and bucket[0] <= now - window_seconds:
        bucket.popleft()
    if len(bucket) >= limit:
        raise HTTPException(status_code=429, detail="Too many attempts. Please try again later.")
    bucket.append(now)


def require_admin(authorization: str = Header(default="")):
    scheme, _, token = authorization.partition(" ")
    expires_at = admin_tokens.get(token)
    if scheme.lower() != "bearer" or not expires_at or expires_at <= time.monotonic():
        admin_tokens.pop(token, None)
        raise HTTPException(status_code=401, detail="Admin login required")
    return True
