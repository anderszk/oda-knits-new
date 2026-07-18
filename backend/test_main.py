import os
import time
import unittest
from unittest.mock import patch

import psycopg

# Always point at a dedicated test database, never whatever DATABASE_URL the
# environment already has set for the app (e.g. inside the dev `backend`
# container) - tests truncate tables below, which would otherwise wipe real data.
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL", "postgresql://odaknits:devpassword@localhost:5432/odaknits_test"
)
os.environ["ADMIN_PASSWORD"] = "fangirl2012"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:5173"

from fastapi import HTTPException, Response  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from backend.main import app, get_about, get_bootstrap, get_contact_info  # noqa: E402
from database.connection import get_connection  # noqa: E402
from backend.models.auth import LoginPayload  # noqa: E402
from backend.models.contact import ContactMessage  # noqa: E402
from backend.models.content import AboutPayload, ContactInfoPayload  # noqa: E402
from backend.models.orders import OrderPayload, PaymentItemsPayload  # noqa: E402
from backend.models.products import ProductPayload  # noqa: E402
from backend.models.projects import ProjectPayload  # noqa: E402
from backend.routes.admin import (  # noqa: E402
    admin_login,
    create_product,
    create_project,
    remove_product,
    remove_project,
    update_about,
    update_contact_info,
    update_product,
    update_project,
)
from backend.routes.contact import contact  # noqa: E402
from backend.routes.instagram import get_instagram, instagram_cache  # noqa: E402
from backend.routes.orders import create_order  # noqa: E402
from backend.routes.payments import create_card_intent  # noqa: E402
from backend.repositories import product_repository, project_repository  # noqa: E402
from backend.services.email import send_contact_email  # noqa: E402
from backend.services.security import admin_tokens, rate_limits, require_admin  # noqa: E402

# `backend.main` calls `init_db()` at import time (above), creating tables if they
# don't exist. Postgres, unlike the old tempfile-per-run SQLite db, is a persistent
# shared instance, so start every test run from an empty state.
with get_connection() as _connection:
    _connection.execute(
        "TRUNCATE contact_messages, projects, site_content, orders, products RESTART IDENTITY CASCADE"
    )


class ContactTest(unittest.TestCase):
    def setUp(self):
        rate_limits.clear()

    def test_about_is_persisted(self):
        update_about(AboutPayload(
            name="Hi, test.",
            headline="Test headline for about",
            body=["First paragraph.", "Second paragraph."],
            details=[{"label": "Based in", "value": "Test city"}],
            stats=[{"label": "pieces made", "value": "1"}],
        ))

        saved = get_about()

        self.assertEqual(saved["name"], "Hi, test.")
        self.assertEqual(saved["details"][0]["value"], "Test city")

    def test_contact_info_is_persisted(self):
        update_contact_info(ContactInfoPayload(
            eyebrow="Write",
            heading="Send a knitting note",
            body="Tell me what you need.",
            button="Send request",
            success="Thanks {name}, saved.",
        ))

        saved = get_contact_info()

        self.assertEqual(saved["heading"], "Send a knitting note")
        self.assertEqual(saved["button"], "Send request")

    def test_bootstrap_combines_content_and_is_cacheable(self):
        response = Response()
        data = get_bootstrap(response)

        self.assertEqual(response.headers["Cache-Control"], "public, max-age=60")
        self.assertEqual(set(data.keys()), {"work", "products", "about", "contact_info"})
        self.assertEqual(data["about"], get_about())
        self.assertEqual(data["contact_info"], get_contact_info())

    def test_instagram_without_token_is_empty(self):
        with patch("backend.routes.instagram.instagram_access_token", ""):
            instagram_cache.update({"expires_at": 0, "posts": []})
            self.assertEqual(get_instagram(), [])

    def test_instagram_images_are_proxied(self):
        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                pass

            def read(self):
                return b'{"data":[{"id":"1","media_type":"IMAGE","media_url":"https://scontent.cdninstagram.com/post.jpg","permalink":"https://instagram.com/p/1","caption":"Test caption"}]}'

        with (
            patch("backend.routes.instagram.instagram_access_token", "token"),
            patch("backend.routes.instagram.urllib.request.urlopen", return_value=FakeResponse()),
        ):
            instagram_cache.update({"expires_at": 0, "posts": []})
            posts = get_instagram()

        self.assertTrue(posts[0]["image"].startswith("/api/instagram/image?url="))
        self.assertEqual(posts[0]["caption"], "Test caption")

    def test_contact_is_persisted(self):
        message = ContactMessage(
            name="  Test Maker  ",
            email="maker@example.com",
            message="I would like a custom cardigan.",
        )
        with patch("backend.routes.contact.send_contact_email") as email_sender:
            result = contact(message)

        with get_connection() as connection:
            saved = connection.execute(
                "SELECT name, email, message FROM contact_messages WHERE id = %s",
                (result["id"],),
            ).fetchone()

        email_sender.assert_called_once()
        self.assertEqual(saved, (
            "Test Maker",
            "maker@example.com",
            "I would like a custom cardigan.",
        ))

    def test_contact_rate_limit_blocks_spam(self):
        message = ContactMessage(
            name="Test Maker",
            email="maker@example.com",
            message="I would like a custom cardigan.",
        )

        with patch("backend.routes.contact.send_contact_email"):
            for _ in range(10):
                contact(message)
            with self.assertRaises(HTTPException) as caught:
                contact(message)

        self.assertEqual(caught.exception.status_code, 429)

    def test_admin_tokens_expire(self):
        response = Response()
        admin_login(LoginPayload(username="odaknits", password="fangirl2012"), response)
        token = response.headers["set-cookie"].split("admin_token=")[1].split(";")[0]
        self.assertTrue(require_admin(token))

        admin_tokens[token] = time.monotonic() - 1

        with self.assertRaises(HTTPException) as caught:
            require_admin(token)

        self.assertEqual(caught.exception.status_code, 401)

    def _make_product(self, **overrides):
        payload = {
            "title": "Test Sweater",
            "category": "Sweaters",
            "price": 500,
            "description": "A cozy hand-knit sweater used for backend test coverage.",
            "colors": [{"name": "Cream", "hex": "#FFFFFF"}],
            "sizes": ["S", "M"],
            "stock": 5,
        }
        payload.update(overrides)
        return product_repository.save(ProductPayload(**payload))

    def _make_order_payload(self, product, payment_method="Card", payment_reference="pi_test000001", price=None):
        return OrderPayload(
            items=[{
                "id": product["id"],
                "title": product["title"],
                "price": price if price is not None else product["price"],
                "size": product["sizes"][0],
                "quantity": 1,
            }],
            shipping={
                "name": "Test Buyer",
                "email": "buyer@example.com",
                "address": "Test street 1",
                "city": "Oslo",
                "postal_code": "0150",
                "phone": "12345678",
            },
            payment_method=payment_method,
            payment_reference=payment_reference,
        )

    def test_create_order_succeeds_with_verified_payment(self):
        product = self._make_product()
        order = self._make_order_payload(product, payment_reference="pi_success0001")

        with (
            patch("backend.routes.orders.call_stripe", return_value={
                "status": "succeeded", "amount": product["price"] * 100, "currency": "nok",
            }),
            patch("backend.routes.orders.send_order_email"),
        ):
            result = create_order(order)

        self.assertTrue(result["ok"])
        self.assertEqual(result["subtotal"], product["price"])

    def test_create_order_rejects_price_mismatch(self):
        product = self._make_product()
        order = self._make_order_payload(product, payment_reference="pi_mismatch001", price=product["price"] + 1)

        with self.assertRaises(HTTPException) as caught:
            create_order(order)

        self.assertEqual(caught.exception.status_code, 400)

    def test_create_order_rejects_invalid_payment_reference(self):
        product = self._make_product()
        order = self._make_order_payload(product, payment_reference="not-a-valid-reference")

        with self.assertRaises(HTTPException) as caught:
            create_order(order)

        self.assertEqual(caught.exception.status_code, 400)

    def test_create_order_rejects_unverified_payment(self):
        product = self._make_product()
        order = self._make_order_payload(product, payment_reference="pi_wrongstatus1")

        with patch("backend.routes.orders.call_stripe", return_value={
            "status": "requires_action", "amount": product["price"] * 100, "currency": "nok",
        }):
            with self.assertRaises(HTTPException) as caught:
                create_order(order)

        self.assertEqual(caught.exception.status_code, 402)

    def test_create_order_rejects_reused_payment_reference(self):
        product = self._make_product()
        reference = "pi_reused0000001"

        with (
            patch("backend.routes.orders.call_stripe", return_value={
                "status": "succeeded", "amount": product["price"] * 100, "currency": "nok",
            }),
            patch("backend.routes.orders.send_order_email"),
        ):
            create_order(self._make_order_payload(product, payment_reference=reference))
            with self.assertRaises(HTTPException) as caught:
                create_order(self._make_order_payload(product, payment_reference=reference))

        self.assertEqual(caught.exception.status_code, 409)

    def test_card_intent_returns_client_secret(self):
        product = self._make_product()
        payload = PaymentItemsPayload(items=[{
            "id": product["id"],
            "title": product["title"],
            "price": product["price"],
            "size": product["sizes"][0],
            "quantity": 1,
        }])

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                pass

            def read(self):
                return b'{"client_secret":"secret_abc123"}'

        with (
            patch("backend.routes.payments.STRIPE_SECRET_KEY", "sk_test_x"),
            patch("backend.services.payments.urllib.request.urlopen", return_value=FakeResponse()),
        ):
            result = create_card_intent(payload)

        self.assertEqual(result["client_secret"], "secret_abc123")
        self.assertEqual(result["subtotal"], product["price"])

    def test_admin_product_crud(self):
        created = create_product(ProductPayload(
            title="Original Sweater",
            category="Sweaters",
            price=450,
            description="A warm sweater used for admin CRUD test coverage.",
            colors=[{"name": "Cream", "hex": "#FFFFFF"}],
            sizes=["S", "M"],
            stock=3,
        ))
        product_id = created["id"]
        self.assertTrue(created["ok"])

        update_product(product_id, ProductPayload(
            id=product_id,
            title="Updated Sweater",
            category="Sweaters",
            price=550,
            description="An updated warm sweater used for admin CRUD test coverage.",
            colors=[{"name": "Cream", "hex": "#FFFFFF"}],
            sizes=["S", "M", "L"],
            stock=4,
        ))
        updated = next(p for p in product_repository.list() if p["id"] == product_id)
        self.assertEqual(updated["title"], "Updated Sweater")
        self.assertEqual(updated["price"], 550)

        remove_product(product_id)
        self.assertFalse(product_repository.exists(product_id))

    def test_admin_project_crud(self):
        created = create_project(ProjectPayload(
            title="Original Cardigan",
            category="Cardigans",
            description="A cozy cardigan project used for admin CRUD test coverage.",
            images=["https://example.com/cardigan.jpg"],
            yarn="Merino wool",
            fiber="Wool",
            technique="Colorwork",
            needles="4mm",
            size="M",
            time="20 hours",
            year="2025",
            colors=[{"name": "Rust", "hex": "#B5533C"}],
        ))
        project_id = created["id"]
        self.assertTrue(created["ok"])

        update_project(project_id, ProjectPayload(
            id=project_id,
            title="Updated Cardigan",
            category="Cardigans",
            description="An updated cozy cardigan project used for admin CRUD test coverage.",
            images=["https://example.com/cardigan-2.jpg"],
            yarn="Merino wool",
            fiber="Wool",
            technique="Colorwork",
            needles="4mm",
            size="L",
            time="22 hours",
            year="2025",
            colors=[{"name": "Rust", "hex": "#B5533C"}],
        ))
        updated = next(p for p in project_repository.list() if p["id"] == project_id)
        self.assertEqual(updated["title"], "Updated Cardigan")
        self.assertEqual(updated["size"], "L")

        remove_project(project_id)
        self.assertFalse(project_repository.exists(project_id))

    def test_contact_email_is_sent_to_oda(self):
        sent = []

        class FakeSMTP:
            def __init__(self, *args, **kwargs):
                pass

            def __enter__(self):
                return self

            def __exit__(self, *args):
                pass

            def starttls(self):
                pass

            def login(self, *args):
                pass

            def send_message(self, email):
                sent.append(email)

        with (
            patch("backend.services.email.SMTP_HOST", "smtp.example.com"),
            patch("backend.services.email.SMTP_FROM", "site@example.com"),
            patch("backend.services.email.smtplib.SMTP", FakeSMTP),
        ):
            send_contact_email(ContactMessage(
                name="Ola",
                email="ola@example.com",
                message="Can you knit this for me?",
            ), "2026-07-10T12:00:00+00:00")

        self.assertEqual(sent[0]["To"], "oda.hennissen@gmail.com")
        self.assertEqual(sent[0]["Reply-To"], "ola@example.com")
        self.assertEqual(sent[0]["Subject"], "Oda Knits Inquiry from Ola")


class ASGITest(unittest.TestCase):
    """Exercises the actual ASGI app (CORS middleware, exception handlers) rather than
    calling route functions directly, since those are invisible to the rest of this file."""

    def setUp(self):
        rate_limits.clear()
        # raise_server_exceptions=False so unhandled errors surface as the real HTTP
        # response a client would get, instead of propagating into the test itself.
        self.client = TestClient(app, raise_server_exceptions=False)

    def test_cors_allows_configured_origin(self):
        response = self.client.get("/api/products", headers={"Origin": "http://localhost:5173"})
        self.assertEqual(response.headers.get("access-control-allow-origin"), "http://localhost:5173")

    def test_cors_rejects_unlisted_origin(self):
        response = self.client.get("/api/products", headers={"Origin": "https://evil.example.com"})
        self.assertNotIn("access-control-allow-origin", response.headers)

    def test_database_operational_error_returns_503(self):
        with patch.object(project_repository, "list", side_effect=psycopg.OperationalError("connection lost")):
            response = self.client.get("/api/work")
        self.assertEqual(response.status_code, 503)

    def test_unexpected_error_returns_generic_500_without_leaking_details(self):
        with patch.object(project_repository, "list", side_effect=RuntimeError("boom, secret internals")):
            response = self.client.get("/api/work")
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {"detail": "Something went wrong. Please try again."})


if __name__ == "__main__":
    unittest.main()
