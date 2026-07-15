import json
import os
import re
import secrets
import shutil
import smtplib
import sqlite3
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict, deque
from datetime import UTC, datetime
from email.message import EmailMessage
from pathlib import Path

from fastapi import Depends, FastAPI, File, Header, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

app = FastAPI(title="oda-knit API")
database_path = Path(os.getenv("DATABASE_PATH", "backend/oda-knit.db"))
database_path.parent.mkdir(parents=True, exist_ok=True)
upload_dir = Path(os.getenv("UPLOAD_DIR", database_path.parent / "uploads"))
upload_dir.mkdir(parents=True, exist_ok=True)
admin_username = os.getenv("ADMIN_USERNAME", "odaknits")
admin_password = os.getenv("ADMIN_PASSWORD", "")
contact_email_to = os.getenv("CONTACT_EMAIL_TO", "oda.hennissen@gmail.com")
instagram_access_token = os.getenv("INSTAGRAM_ACCESS_TOKEN", "")
instagram_post_limit = int(os.getenv("INSTAGRAM_POST_LIMIT", "8"))
stripe_secret_key = os.getenv("STRIPE_SECRET_KEY", "")
vipps_client_id = os.getenv("VIPPS_CLIENT_ID", "")
vipps_client_secret = os.getenv("VIPPS_CLIENT_SECRET", "")
vipps_subscription_key = os.getenv("VIPPS_SUBSCRIPTION_KEY", "")
vipps_msn = os.getenv("VIPPS_MSN", "")
vipps_base_url = os.getenv("VIPPS_BASE_URL", "https://apitest.vipps.no")
vipps_configured = bool(vipps_client_id and vipps_client_secret and vipps_subscription_key and vipps_msn)
vipps_token_cache = {"expires_at": 0.0, "token": ""}
admin_session_seconds = int(os.getenv("ADMIN_SESSION_SECONDS", str(8 * 60 * 60)))
admin_tokens = {}
rate_limits = defaultdict(deque)
instagram_cache = {"expires_at": 0, "posts": []}

with sqlite3.connect(database_path) as database:
    database.execute(
        """
        CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    database.execute(
        """
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            image TEXT NOT NULL,
            images TEXT NOT NULL,
            yarn TEXT NOT NULL,
            fiber TEXT NOT NULL,
            technique TEXT NOT NULL,
            needles TEXT NOT NULL,
            size TEXT NOT NULL,
            time TEXT NOT NULL,
            year TEXT NOT NULL,
            colors TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    database.execute(
        """
        CREATE TABLE IF NOT EXISTS site_content (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    database.execute(
        """
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            items TEXT NOT NULL,
            subtotal INTEGER NOT NULL,
            shipping TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    database.execute(
        """
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            price INTEGER NOT NULL,
            description TEXT NOT NULL,
            colors TEXT NOT NULL,
            sizes TEXT NOT NULL,
            badge TEXT NOT NULL,
            stock INTEGER NOT NULL,
            image TEXT NOT NULL DEFAULT '',
            images TEXT NOT NULL DEFAULT '[]'
        )
        """
    )
    product_columns = {row[1] for row in database.execute("PRAGMA table_info(products)")}
    if "image" not in product_columns:
        database.execute("ALTER TABLE products ADD COLUMN image TEXT NOT NULL DEFAULT ''")
    if "images" not in product_columns:
        database.execute("ALTER TABLE products ADD COLUMN images TEXT NOT NULL DEFAULT '[]'")
        for row_id, image in database.execute("SELECT id, image FROM products WHERE image != ''").fetchall():
            database.execute("UPDATE products SET images = ? WHERE id = ?", (json.dumps([image]), row_id))

app.mount("/api/uploads", StaticFiles(directory=upload_dir), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "same-origin"
    return response

ABOUT = {
    "name": "Hi, I'm Oda.",
    "headline": "I turn quiet evenings into colorful things you can wear.",
    "body": [
        "I am the hands behind Oda Knits, an independent knitter and color obsessive based in Oslo. I learned from my grandmother, then kept going until every shelf in my home held yarn.",
        "My work mixes practical Nordic shapes with playful palettes. I make slowly, choose gentle fibers, and design pieces meant to be worn often rather than saved for special days.",
    ],
    "details": [
        {"label": "Based in", "value": "Oslo, Norway"},
        {"label": "Favorite fiber", "value": "Brushed mohair"},
        {"label": "Currently knitting", "value": "A lemon-yellow vest"},
    ],
    "stats": [
        {"label": "pieces made", "value": "140+"},
        {"label": "natural fibers", "value": "92%"},
        {"label": "custom colors", "value": "18"},
    ],
}

CONTACT_INFO = {
    "eyebrow": "Contact",
    "heading": "Custom color, repair, or collaboration?",
    "body": "Send a note and Oda Knits will reply with availability and next steps.",
    "button": "Send note",
    "success": "Thanks {name}, your note has been received.",
}

PRODUCT_COLUMNS = ("id", "title", "category", "price", "description", "colors", "sizes", "badge", "stock", "image", "images")


def product_from_row(row):
    product = dict(zip(PRODUCT_COLUMNS, row, strict=True))
    product["colors"] = json.loads(product["colors"])
    product["sizes"] = json.loads(product["sizes"])
    product["images"] = json.loads(product["images"])
    return product


def load_products():
    with sqlite3.connect(database_path) as database:
        rows = database.execute(f"SELECT {', '.join(PRODUCT_COLUMNS)} FROM products").fetchall()
    return [product_from_row(row) for row in rows]


def save_product(database, product, product_id=None):
    final_id = product_id or product.id or unique_id(database, "products", product.title, "product")
    images = [image for image in product.images if image]
    if product.image and product.image not in images:
        images.insert(0, product.image)
    cover = product.image or (images[0] if images else "")
    values = {
        "id": final_id,
        "title": product.title,
        "category": product.category,
        "price": product.price,
        "description": product.description,
        "colors": json.dumps([color.model_dump() for color in product.colors]),
        "sizes": json.dumps(product.sizes),
        "badge": product.badge,
        "stock": product.stock,
        "image": cover,
        "images": json.dumps(images),
    }
    database.execute(
        """
        INSERT OR REPLACE INTO products
        (id, title, category, price, description, colors, sizes, badge, stock, image, images)
        VALUES
        (:id, :title, :category, :price, :description, :colors, :sizes, :badge, :stock, :image, :images)
        """,
        values,
    )
    return {**values, "colors": json.loads(values["colors"]), "sizes": json.loads(values["sizes"]), "images": json.loads(values["images"])}


PROJECT_COLUMNS = (
    "id",
    "title",
    "category",
    "description",
    "image",
    "images",
    "yarn",
    "fiber",
    "technique",
    "needles",
    "size",
    "time",
    "year",
    "colors",
    "created_at",
    "updated_at",
)


def project_from_row(row):
    project = dict(zip(PROJECT_COLUMNS, row, strict=True))
    project["images"] = json.loads(project["images"])
    project["colors"] = json.loads(project["colors"])
    return project


def slugify(value, fallback="item"):
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or f"{fallback}-{secrets.token_hex(3)}"


def unique_id(database, table, title, fallback="item"):
    base = slugify(title, fallback)
    candidate = base
    index = 2
    while database.execute(f"SELECT 1 FROM {table} WHERE id = ?", (candidate,)).fetchone():
        candidate = f"{base}-{index}"
        index += 1
    return candidate


def save_project(database, project, project_id=None):
    now = datetime.now(UTC).isoformat()
    existing = database.execute("SELECT created_at FROM projects WHERE id = ?", (project_id or project.id,)).fetchone()
    final_id = project_id or project.id or unique_id(database, "projects", project.title, "project")
    images = [image for image in project.images if image]
    if project.image and project.image not in images:
        images.insert(0, project.image)
    cover = project.image or (images[0] if images else "")
    if not cover:
        raise HTTPException(status_code=400, detail="Project image is required")
    values = {
        "id": final_id,
        "title": project.title,
        "category": project.category,
        "description": project.description,
        "image": cover,
        "images": json.dumps(images),
        "yarn": project.yarn,
        "fiber": project.fiber,
        "technique": project.technique,
        "needles": project.needles,
        "size": project.size,
        "time": project.time,
        "year": project.year,
        "colors": json.dumps([color.model_dump() for color in project.colors]),
        "created_at": existing[0] if existing else now,
        "updated_at": now,
    }
    database.execute(
        """
        INSERT OR REPLACE INTO projects
        (id, title, category, description, image, images, yarn, fiber, technique, needles, size, time, year, colors, created_at, updated_at)
        VALUES
        (:id, :title, :category, :description, :image, :images, :yarn, :fiber, :technique, :needles, :size, :time, :year, :colors, :created_at, :updated_at)
        """,
        values,
    )
    return values


class ProjectColor(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    hex: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")


class ProjectPayload(BaseModel):
    id: str = ""
    title: str = Field(min_length=2, max_length=100)
    category: str = Field(min_length=2, max_length=100)
    description: str = Field(min_length=10, max_length=1200)
    image: str = ""
    images: list[str] = Field(default_factory=list, min_length=1)
    yarn: str = Field(min_length=1, max_length=160)
    fiber: str = Field(min_length=1, max_length=160)
    technique: str = Field(min_length=1, max_length=160)
    needles: str = Field(min_length=1, max_length=80)
    size: str = Field(min_length=1, max_length=80)
    time: str = Field(min_length=1, max_length=80)
    year: str = Field(min_length=1, max_length=20)
    colors: list[ProjectColor] = Field(min_length=1)

    @field_validator("*", mode="before")
    @classmethod
    def strip_text(cls, value):
        if isinstance(value, str):
            return value.strip()
        if isinstance(value, list):
            return [item.strip() if isinstance(item, str) else item for item in value]
        return value

    @model_validator(mode="after")
    def require_project_details(self):
        self.images = [image for image in self.images if image]
        if self.image and self.image not in self.images:
            self.images.insert(0, self.image)
        if not self.images:
            raise ValueError("At least one project image is required")
        self.image = self.image or self.images[0]
        if self.year.lower() == "wip":
            self.year = "WIP"
        return self


class ProductPayload(BaseModel):
    id: str = ""
    title: str = Field(min_length=2, max_length=100)
    category: str = Field(min_length=2, max_length=100)
    price: int = Field(ge=0, le=100000)
    description: str = Field(min_length=10, max_length=1200)
    colors: list[ProjectColor] = Field(min_length=1)
    sizes: list[str] = Field(min_length=1)
    badge: str = Field(default="", max_length=40)
    stock: int = Field(ge=0, le=100000)
    image: str = Field(default="", max_length=300)
    images: list[str] = Field(default_factory=list)

    @field_validator("*", mode="before")
    @classmethod
    def strip_text(cls, value):
        if isinstance(value, str):
            return value.strip()
        if isinstance(value, list):
            return [item.strip() if isinstance(item, str) else item for item in value]
        return value

    @model_validator(mode="after")
    def normalize_product_images(self):
        self.images = [image for image in self.images if image]
        if self.image and self.image not in self.images:
            self.images.insert(0, self.image)
        self.image = self.image or (self.images[0] if self.images else "")
        return self


class AboutDetail(BaseModel):
    label: str = Field(min_length=1, max_length=80)
    value: str = Field(min_length=1, max_length=160)

    @field_validator("*", mode="before")
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class AboutPayload(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    headline: str = Field(min_length=5, max_length=240)
    body: list[str] = Field(min_length=1)
    details: list[AboutDetail] = Field(min_length=1)
    stats: list[AboutDetail] = Field(min_length=1)

    @field_validator("name", "headline", mode="before")
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("body", mode="before")
    @classmethod
    def strip_body(cls, value):
        return [item.strip() for item in value if item.strip()] if isinstance(value, list) else value


class ContactInfoPayload(BaseModel):
    eyebrow: str = Field(min_length=1, max_length=80)
    heading: str = Field(min_length=5, max_length=180)
    body: str = Field(min_length=5, max_length=500)
    button: str = Field(min_length=1, max_length=40)
    success: str = Field(min_length=5, max_length=160)

    @field_validator("*", mode="before")
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value


def load_content(key, fallback):
    with sqlite3.connect(database_path) as database:
        row = database.execute("SELECT value FROM site_content WHERE key = ?", (key,)).fetchone()
    return json.loads(row[0]) if row else fallback


def save_content(key, value):
    with sqlite3.connect(database_path) as database:
        database.execute(
            "INSERT OR REPLACE INTO site_content (key, value, updated_at) VALUES (?, ?, ?)",
            (key, json.dumps(value), datetime.now(UTC).isoformat()),
        )
    return value


def load_about():
    return load_content("about", ABOUT)


def save_about(about: AboutPayload):
    return save_content("about", about.model_dump())


def load_contact_info():
    return load_content("contact", CONTACT_INFO)


def save_contact_info(contact_info: ContactInfoPayload):
    return save_content("contact", contact_info.model_dump())


class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    message: str = Field(min_length=10, max_length=3000)
    website: str = Field(default="", max_length=200)

    @field_validator("name", "message", mode="before")
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @model_validator(mode="after")
    def reject_spam(self):
        if self.website:
            raise ValueError("Invalid contact submission")
        return self


class LoginPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str
    password: str


class OrderItem(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=100)
    price: int = Field(ge=0, le=100000)
    size: str = Field(min_length=1, max_length=40)
    quantity: int = Field(ge=1, le=20)


class ShippingInfo(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    address: str = Field(min_length=4, max_length=200)
    city: str = Field(min_length=1, max_length=100)
    postal_code: str = Field(min_length=3, max_length=12)
    phone: str = Field(default="", max_length=30)

    @field_validator("name", "address", "city", "phone", mode="before")
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class OrderPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[OrderItem] = Field(min_length=1, max_length=50)
    shipping: ShippingInfo
    payment_method: str = Field(min_length=2, max_length=40)
    website: str = Field(default="", max_length=200)

    @model_validator(mode="after")
    def reject_spam(self):
        if self.website:
            raise ValueError("Invalid order submission")
        return self


def send_contact_email(message: ContactMessage, created_at: str):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)
    if not smtp_host or not smtp_from:
        raise RuntimeError("SMTP_HOST and SMTP_FROM or SMTP_USER must be set")

    email = EmailMessage()
    email["To"] = contact_email_to
    email["From"] = smtp_from
    email["Reply-To"] = str(message.email)
    email["Subject"] = f"Oda Knits Inquiry from {message.name}"
    email.set_content(
        f"Name: {message.name}\n"
        f"Email: {message.email}\n"
        f"Received: {created_at}\n\n"
        f"{message.message}\n"
    )

    with smtplib.SMTP(smtp_host, int(os.getenv("SMTP_PORT", "587")), timeout=10) as server:
        server.starttls()
        if smtp_user and smtp_password:
            server.login(smtp_user, smtp_password)
        server.send_message(email)


def send_order_email(order: OrderPayload, order_id: str, subtotal: int, created_at: str):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)
    if not smtp_host or not smtp_from:
        raise RuntimeError("SMTP_HOST and SMTP_FROM or SMTP_USER must be set")

    lines = "\n".join(
        f"- {item.quantity} x {item.title} ({item.size}) - {item.price * item.quantity} kr"
        for item in order.items
    )
    shipping = order.shipping
    email = EmailMessage()
    email["To"] = contact_email_to
    email["From"] = smtp_from
    email["Reply-To"] = str(shipping.email)
    email["Subject"] = f"Oda Knits order {order_id}"
    email.set_content(
        f"Order: {order_id}\n"
        f"Received: {created_at}\n"
        f"Payment method (mock checkout): {order.payment_method}\n\n"
        f"Items:\n{lines}\n\n"
        f"Subtotal: {subtotal} kr\n\n"
        f"Ship to:\n{shipping.name}\n{shipping.address}\n{shipping.postal_code} {shipping.city}\n"
        f"{shipping.phone}\n{shipping.email}\n"
    )

    with smtplib.SMTP(smtp_host, int(os.getenv("SMTP_PORT", "587")), timeout=10) as server:
        server.starttls()
        if smtp_user and smtp_password:
            server.login(smtp_user, smtp_password)
        server.send_message(email)


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


@app.get("/api/work")
def get_work():
    with sqlite3.connect(database_path) as database:
        rows = database.execute(f"SELECT {', '.join(PROJECT_COLUMNS)} FROM projects ORDER BY created_at DESC").fetchall()
    return [project_from_row(row) for row in rows]


@app.get("/api/about")
def get_about():
    return load_about()


@app.get("/api/contact-info")
def get_contact_info():
    return load_contact_info()


@app.get("/api/products")
def get_products():
    return load_products()


@app.get("/api/bootstrap")
def get_bootstrap(response: Response):
    response.headers["Cache-Control"] = "public, max-age=60"
    return {
        "work": get_work(),
        "products": load_products(),
        "about": load_about(),
        "contact_info": load_contact_info(),
    }


@app.post("/api/orders", status_code=201)
def create_order(order: OrderPayload, request: Request = None):
    check_rate_limit("order", client_key(request), 5, 10 * 60)
    catalog = {product["id"]: product for product in load_products()}
    for item in order.items:
        product = catalog.get(item.id)
        if not product or item.price != product["price"] or item.size not in product["sizes"]:
            raise HTTPException(status_code=400, detail="One of the items in your basket is no longer available")

    subtotal = sum(item.price * item.quantity for item in order.items)
    order_id = f"OK-{datetime.now(UTC).strftime('%y%m%d')}-{secrets.token_hex(3).upper()}"
    created_at = datetime.now(UTC).isoformat()
    with sqlite3.connect(database_path) as database:
        database.execute(
            "INSERT INTO orders (id, items, subtotal, shipping, payment_method, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (
                order_id,
                json.dumps([item.model_dump() for item in order.items]),
                subtotal,
                json.dumps(order.shipping.model_dump(mode="json")),
                order.payment_method,
                created_at,
            ),
        )
    try:
        send_order_email(order, order_id, subtotal, created_at)
    except (OSError, RuntimeError, smtplib.SMTPException):
        pass
    return {"ok": True, "id": order_id, "subtotal": subtotal}


class PaymentItemsPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[OrderItem] = Field(min_length=1, max_length=50)


class VippsPaymentPayload(PaymentItemsPayload):
    return_url: str = Field(min_length=8, max_length=300)


def revalidated_subtotal(items: list[OrderItem]) -> int:
    catalog = {product["id"]: product for product in load_products()}
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
        headers={"Authorization": f"Bearer {stripe_secret_key}"},
        method=method,
    )
    try:
        with urllib.request.urlopen(request_obj, timeout=8) as response:
            return json.load(response)
    except (OSError, urllib.error.URLError):
        raise HTTPException(status_code=502, detail="Could not reach payment provider")


def vipps_access_token() -> str:
    if vipps_token_cache["expires_at"] > time.monotonic():
        return vipps_token_cache["token"]
    request_obj = urllib.request.Request(
        f"{vipps_base_url}/accesstoken/get",
        data=b"",
        headers={
            "client_id": vipps_client_id,
            "client_secret": vipps_client_secret,
            "Ocp-Apim-Subscription-Key": vipps_subscription_key,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request_obj, timeout=8) as response:
            payload = json.load(response)
    except (OSError, urllib.error.URLError):
        raise HTTPException(status_code=502, detail="Could not reach Vipps")
    vipps_token_cache.update({
        "token": payload["access_token"],
        "expires_at": time.monotonic() + max(60, int(payload.get("expires_in", 3600)) - 120),
    })
    return vipps_token_cache["token"]


def call_vipps(path: str, body: dict | None = None, method: str = "POST", idempotent: bool = False):
    headers = {
        "Authorization": f"Bearer {vipps_access_token()}",
        "Ocp-Apim-Subscription-Key": vipps_subscription_key,
        "Merchant-Serial-Number": vipps_msn,
        "Content-Type": "application/json",
    }
    if idempotent:
        headers["Idempotency-Key"] = secrets.token_hex(16)
    request_obj = urllib.request.Request(
        f"{vipps_base_url}/{path}",
        data=json.dumps(body).encode() if body is not None else None,
        headers=headers,
        method=method,
    )
    try:
        with urllib.request.urlopen(request_obj, timeout=8) as response:
            return json.load(response)
    except (OSError, urllib.error.URLError):
        raise HTTPException(status_code=502, detail="Could not reach Vipps")


@app.get("/api/payments/config")
def payments_config():
    return {
        "applePay": bool(stripe_secret_key),
        "klarna": bool(stripe_secret_key),
        "vipps": vipps_configured,
    }


@app.post("/api/payments/apple-pay-intent", status_code=201)
def create_apple_pay_intent(payload: PaymentItemsPayload, request: Request = None):
    if not stripe_secret_key:
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


@app.post("/api/payments/klarna-intent", status_code=201)
def create_klarna_intent(payload: PaymentItemsPayload, request: Request = None):
    if not stripe_secret_key:
        raise HTTPException(status_code=503, detail="Klarna is not configured")
    check_rate_limit("klarna-intent", client_key(request), 10, 10 * 60)
    subtotal = revalidated_subtotal(payload.items)
    result = call_stripe("payment_intents", {
        "amount": subtotal * 100,
        "currency": "nok",
        "payment_method_types[]": "klarna",
    })
    return {"client_secret": result["client_secret"], "subtotal": subtotal}


@app.get("/api/payments/klarna-status")
def klarna_status(payment_intent: str, request: Request = None):
    if not stripe_secret_key:
        raise HTTPException(status_code=503, detail="Klarna is not configured")
    check_rate_limit("klarna-status", client_key(request), 20, 10 * 60)
    if not re.fullmatch(r"pi_[A-Za-z0-9]+", payment_intent):
        raise HTTPException(status_code=400, detail="Invalid payment reference")
    result = call_stripe(f"payment_intents/{payment_intent}", method="GET")
    return {"status": result.get("status", "unknown")}


@app.post("/api/payments/vipps-payment", status_code=201)
def create_vipps_payment(payload: VippsPaymentPayload, request: Request = None):
    if not vipps_configured:
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


@app.get("/api/payments/vipps-status")
def vipps_status(reference: str, request: Request = None):
    if not vipps_configured:
        raise HTTPException(status_code=503, detail="Vipps is not configured")
    check_rate_limit("vipps-status", client_key(request), 20, 10 * 60)
    if not re.fullmatch(r"OK-\d{6}-[0-9a-f]{12}", reference):
        raise HTTPException(status_code=400, detail="Invalid payment reference")
    result = call_vipps(f"epayment/v1/payments/{reference}", method="GET")
    return {"state": result.get("state", "UNKNOWN")}


@app.get("/api/instagram")
def get_instagram():
    if not instagram_access_token:
        return []
    if instagram_cache["expires_at"] > time.monotonic():
        return instagram_cache["posts"]

    query = urllib.parse.urlencode({
        "fields": "id,media_type,media_url,permalink,caption,thumbnail_url,timestamp",
        "limit": max(1, min(instagram_post_limit, 12)),
        "access_token": instagram_access_token,
    })
    try:
        with urllib.request.urlopen(f"https://graph.instagram.com/me/media?{query}", timeout=6) as response:
            payload = json.load(response)
    except (OSError, urllib.error.URLError, json.JSONDecodeError):
        return instagram_cache["posts"]

    posts = []
    for item in payload.get("data", []):
        image = item.get("thumbnail_url") if item.get("media_type") == "VIDEO" else item.get("media_url")
        if image and item.get("permalink"):
            posts.append({
                "id": item.get("id"),
                "image": f"/api/instagram/image?url={urllib.parse.quote(image, safe='')}",
                "caption": item.get("caption", ""),
                "permalink": item["permalink"],
                "type": item.get("media_type", "IMAGE"),
                "timestamp": item.get("timestamp", ""),
            })
    instagram_cache.update({"expires_at": time.monotonic() + 10 * 60, "posts": posts})
    return posts


@app.get("/api/instagram/image")
def instagram_image(url: str):
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname or not parsed.hostname.endswith("cdninstagram.com"):
        raise HTTPException(status_code=400, detail="Invalid image URL")
    try:
        with urllib.request.urlopen(url, timeout=8) as image_response:
            return Response(
                content=image_response.read(),
                media_type=image_response.headers.get_content_type() or "image/jpeg",
                headers={"Cache-Control": "public, max-age=600"},
            )
    except OSError:
        raise HTTPException(status_code=502, detail="Could not load Instagram image")


@app.post("/api/admin/login")
def admin_login(payload: LoginPayload, request: Request = None):
    check_rate_limit("login", f"{client_key(request)}:{payload.username}", 5, 15 * 60)
    if not admin_password:
        raise HTTPException(status_code=503, detail="Admin password is not configured")
    if not (
        secrets.compare_digest(payload.username, admin_username)
        and secrets.compare_digest(payload.password, admin_password)
    ):
        raise HTTPException(status_code=401, detail="Wrong username or password")
    token = secrets.token_urlsafe(32)
    admin_tokens[token] = time.monotonic() + admin_session_seconds
    return {"token": token}


@app.get("/api/admin/projects")
def admin_projects(_=Depends(require_admin)):
    return get_work()


@app.get("/api/admin/about")
def admin_about(_=Depends(require_admin)):
    return load_about()


@app.put("/api/admin/about")
def update_about(about: AboutPayload, _=Depends(require_admin)):
    return {"ok": True, "about": save_about(about)}


@app.get("/api/admin/contact-info")
def admin_contact_info(_=Depends(require_admin)):
    return load_contact_info()


@app.put("/api/admin/contact-info")
def update_contact_info(contact_info: ContactInfoPayload, _=Depends(require_admin)):
    return {"ok": True, "contact": save_contact_info(contact_info)}


@app.post("/api/admin/projects", status_code=201)
def create_project(project: ProjectPayload, _=Depends(require_admin)):
    with sqlite3.connect(database_path) as database:
        saved = save_project(database, project)
    return {"ok": True, "id": saved["id"]}


@app.put("/api/admin/projects/{project_id}")
def update_project(project_id: str, project: ProjectPayload, _=Depends(require_admin)):
    with sqlite3.connect(database_path) as database:
        if not database.execute("SELECT 1 FROM projects WHERE id = ?", (project_id,)).fetchone():
            raise HTTPException(status_code=404, detail="Project not found")
        save_project(database, project, project_id=project_id)
    return {"ok": True, "id": project_id}


@app.delete("/api/admin/projects/{project_id}", status_code=204)
def delete_project(project_id: str, _=Depends(require_admin)):
    with sqlite3.connect(database_path) as database:
        database.execute("DELETE FROM projects WHERE id = ?", (project_id,))


@app.get("/api/admin/products")
def admin_products(_=Depends(require_admin)):
    return load_products()


@app.post("/api/admin/products", status_code=201)
def create_product(product: ProductPayload, _=Depends(require_admin)):
    with sqlite3.connect(database_path) as database:
        saved = save_product(database, product)
    return {"ok": True, "id": saved["id"]}


@app.put("/api/admin/products/{product_id}")
def update_product(product_id: str, product: ProductPayload, _=Depends(require_admin)):
    with sqlite3.connect(database_path) as database:
        if not database.execute("SELECT 1 FROM products WHERE id = ?", (product_id,)).fetchone():
            raise HTTPException(status_code=404, detail="Product not found")
        save_product(database, product, product_id=product_id)
    return {"ok": True, "id": product_id}


@app.delete("/api/admin/products/{product_id}", status_code=204)
def delete_product(product_id: str, _=Depends(require_admin)):
    with sqlite3.connect(database_path) as database:
        database.execute("DELETE FROM products WHERE id = ?", (product_id,))


@app.post("/api/admin/uploads", status_code=201)
def upload_project_image(file: UploadFile = File(...), _=Depends(require_admin)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload an image file")
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        raise HTTPException(status_code=400, detail="Unsupported image type")
    filename = f"{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}-{secrets.token_hex(4)}{suffix}"
    target = upload_dir / filename
    with target.open("wb") as output:
        shutil.copyfileobj(file.file, output)
    return {"url": f"/api/uploads/{filename}"}


@app.post("/api/contact", status_code=201)
def contact(message: ContactMessage, request: Request = None):
    check_rate_limit("contact", client_key(request), 3, 5 * 60)
    created_at = datetime.now(UTC).isoformat()
    with sqlite3.connect(database_path) as database:
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
