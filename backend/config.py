import os
from pathlib import Path

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "backend/uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

_DEV_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
ALLOWED_ORIGINS = [
    origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "").split(",") if origin.strip()
] or _DEV_ORIGINS

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "odaknits")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
ADMIN_SESSION_SECONDS = int(os.getenv("ADMIN_SESSION_SECONDS", str(8 * 60 * 60)))
ADMIN_COOKIE_SECURE = os.getenv("ADMIN_COOKIE_SECURE", "true").lower() == "true"

CONTACT_EMAIL_TO = os.getenv("CONTACT_EMAIL_TO", "oda.hennissen@gmail.com")

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "") or SMTP_USER

INSTAGRAM_ACCESS_TOKEN = os.getenv("INSTAGRAM_ACCESS_TOKEN", "")
INSTAGRAM_POST_LIMIT = int(os.getenv("INSTAGRAM_POST_LIMIT", "8"))

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")

VIPPS_CLIENT_ID = os.getenv("VIPPS_CLIENT_ID", "")
VIPPS_CLIENT_SECRET = os.getenv("VIPPS_CLIENT_SECRET", "")
VIPPS_SUBSCRIPTION_KEY = os.getenv("VIPPS_SUBSCRIPTION_KEY", "")
VIPPS_MSN = os.getenv("VIPPS_MSN", "")
VIPPS_BASE_URL = os.getenv("VIPPS_BASE_URL", "https://apitest.vipps.no")
VIPPS_CONFIGURED = bool(VIPPS_CLIENT_ID and VIPPS_CLIENT_SECRET and VIPPS_SUBSCRIPTION_KEY and VIPPS_MSN)
