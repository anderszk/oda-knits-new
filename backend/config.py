import os
from pathlib import Path

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "backend/uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "odaknits")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
ADMIN_SESSION_SECONDS = int(os.getenv("ADMIN_SESSION_SECONDS", str(8 * 60 * 60)))

CONTACT_EMAIL_TO = os.getenv("CONTACT_EMAIL_TO", "oda.hennissen@gmail.com")

INSTAGRAM_ACCESS_TOKEN = os.getenv("INSTAGRAM_ACCESS_TOKEN", "")
INSTAGRAM_POST_LIMIT = int(os.getenv("INSTAGRAM_POST_LIMIT", "8"))

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")

VIPPS_CLIENT_ID = os.getenv("VIPPS_CLIENT_ID", "")
VIPPS_CLIENT_SECRET = os.getenv("VIPPS_CLIENT_SECRET", "")
VIPPS_SUBSCRIPTION_KEY = os.getenv("VIPPS_SUBSCRIPTION_KEY", "")
VIPPS_MSN = os.getenv("VIPPS_MSN", "")
VIPPS_BASE_URL = os.getenv("VIPPS_BASE_URL", "https://apitest.vipps.no")
VIPPS_CONFIGURED = bool(VIPPS_CLIENT_ID and VIPPS_CLIENT_SECRET and VIPPS_SUBSCRIPTION_KEY and VIPPS_MSN)
