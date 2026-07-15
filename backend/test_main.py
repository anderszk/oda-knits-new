import os
import sqlite3
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch

temp_dir = tempfile.TemporaryDirectory()
database_path = Path(temp_dir.name) / "contact.db"
os.environ["DATABASE_PATH"] = str(database_path)
os.environ["ADMIN_PASSWORD"] = "fangirl2012"

from fastapi import HTTPException, Response  # noqa: E402

from backend.main import (  # noqa: E402
    AboutPayload,
    ContactInfoPayload,
    ContactMessage,
    LoginPayload,
    admin_login,
    admin_tokens,
    contact,
    get_bootstrap,
    get_contact_info,
    get_about,
    get_instagram,
    instagram_cache,
    rate_limits,
    require_admin,
    send_contact_email,
    update_contact_info,
    update_about,
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
        with patch("backend.main.instagram_access_token", ""):
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
            patch("backend.main.instagram_access_token", "token"),
            patch("backend.main.urllib.request.urlopen", return_value=FakeResponse()),
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
        with patch("backend.main.send_contact_email") as email_sender:
            result = contact(message)

        with sqlite3.connect(database_path) as database:
            saved = database.execute(
                "SELECT name, email, message FROM contact_messages WHERE id = ?",
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

        with patch("backend.main.send_contact_email"):
            for _ in range(3):
                contact(message)
            with self.assertRaises(HTTPException) as caught:
                contact(message)

        self.assertEqual(caught.exception.status_code, 429)

    def test_admin_tokens_expire(self):
        result = admin_login(LoginPayload(username="odaknits", password="fangirl2012"))
        token = result["token"]
        self.assertTrue(require_admin(f"Bearer {token}"))

        admin_tokens[token] = time.monotonic() - 1

        with self.assertRaises(HTTPException) as caught:
            require_admin(f"Bearer {token}")

        self.assertEqual(caught.exception.status_code, 401)

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
            patch.dict(os.environ, {"SMTP_HOST": "smtp.example.com", "SMTP_FROM": "site@example.com"}),
            patch("backend.main.smtplib.SMTP", FakeSMTP),
        ):
            send_contact_email(ContactMessage(
                name="Ola",
                email="ola@example.com",
                message="Can you knit this for me?",
            ), "2026-07-10T12:00:00+00:00")

        self.assertEqual(sent[0]["To"], "oda.hennissen@gmail.com")
        self.assertEqual(sent[0]["Reply-To"], "ola@example.com")
        self.assertEqual(sent[0]["Subject"], "Oda Knits Inquiry from Ola")


def tearDownModule():
    temp_dir.cleanup()


if __name__ == "__main__":
    unittest.main()
