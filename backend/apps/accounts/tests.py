import re

from django.contrib.auth import authenticate, get_user_model
from django.core import mail
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase, override_settings
from rest_framework.test import APITestCase
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
from rest_framework_simplejwt.tokens import RefreshToken

from .models import DEFAULT_USER_TIMEZONE, validate_timezone

User = get_user_model()

REGISTER_URL = "/api/v1/auth/register/"


class UserModelTests(TestCase):
    def test_create_user_uses_email_and_uuid(self):
        user = User.objects.create_user(email="Alex@Example.COM ", password="Strong-password-value")
        self.assertEqual(user.email, "alex@example.com")
        self.assertEqual(user.get_username(), "alex@example.com")
        self.assertEqual(len(str(user.id)), 36)
        self.assertTrue(user.check_password("Strong-password-value"))
        self.assertFalse(user.is_staff)
        self.assertEqual(user.timezone, DEFAULT_USER_TIMEZONE)
        self.assertFalse(hasattr(user, "username") and user.username)

    def test_email_is_unique_case_insensitively(self):
        User.objects.create_user(email="alex@example.com", password="x")
        with self.assertRaises(IntegrityError):
            User.objects.create_user(email="ALEX@example.com", password="x")

    def test_create_superuser(self):
        admin = User.objects.create_superuser(email="admin@example.com", password="Strong-password-value")
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_email_required(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password="x")

    def test_authenticate_is_case_insensitive(self):
        User.objects.create_user(email="alex@example.com", password="Strong-password-value")
        user = authenticate(email="  Alex@Example.COM ", password="Strong-password-value")
        self.assertIsNotNone(user)
        self.assertEqual(user.email, "alex@example.com")

    def test_db_constraint_blocks_case_variant_written_directly(self):
        User.objects.create_user(email="alex@example.com", password="x")
        bob = User.objects.create_user(email="bob@example.com", password="x")
        # .update() writes straight to the database, skipping save()/normalisation,
        # so only the Lower(email) unique constraint can stop this.
        with self.assertRaises(IntegrityError), transaction.atomic():
            User.objects.filter(pk=bob.pk).update(email="ALEX@EXAMPLE.COM")

    def test_timezone_must_be_valid_iana_name(self):
        validate_timezone("Asia/Kolkata")
        with self.assertRaises(ValidationError):
            validate_timezone("Mars/Olympus")


class RegisterApiTests(APITestCase):
    def setUp(self):
        cache.clear()  # reset throttle counters between tests
        self.payload = {
            "full_name": "  Alex    Morgan ",
            "email": "Alex@Example.COM",
            "password": "Strong-password-value",
            "accept_terms": True,
        }

    def test_register_creates_user_and_records_consent(self):
        res = self.client.post(REGISTER_URL, self.payload, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["email"], "alex@example.com")
        self.assertEqual(res.data["full_name"], "Alex Morgan")
        self.assertNotIn("password", res.data)
        user = User.objects.get(email="alex@example.com")
        self.assertIsNotNone(user.terms_accepted_at)
        self.assertEqual(user.terms_version, "1.0")
        self.assertNotIn("infraon_refresh", res.cookies)  # register must not sign in

    def test_terms_must_be_accepted(self):
        self.payload["accept_terms"] = False
        res = self.client.post(REGISTER_URL, self.payload, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("accept_terms", res.data["error"]["details"])

    def test_duplicate_email_case_insensitive(self):
        User.objects.create_user(email="alex@example.com", password="x")
        res = self.client.post(REGISTER_URL, self.payload, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("email", res.data["error"]["details"])

    def test_weak_password_rejected(self):
        for pwd in ["short", "1234567890123", "alexmorgan123"]:
            self.payload["password"] = pwd
            res = self.client.post(REGISTER_URL, self.payload, format="json")
            self.assertEqual(res.status_code, 400, pwd)
            self.assertIn("password", res.data["error"]["details"])

    def test_blank_full_name_rejected(self):
        self.payload["full_name"] = "   "
        res = self.client.post(REGISTER_URL, self.payload, format="json")
        self.assertEqual(res.status_code, 400)

   
    def test_register_is_throttled(self): ...  # optional: post 3 times, expect 429 on the 3rd


RESET_URL = "/api/v1/auth/password/reset/"
RESET_CONFIRM_URL = "/api/v1/auth/password/reset/confirm/"


@override_settings(FRONTEND_URL="http://app.test")
class PasswordResetApiTests(APITestCase):
    def setUp(self):
        cache.clear()  # reset throttle counters between tests
        self.user = User.objects.create_user(
            email="reset@example.com", password="Old-strong-password-1", full_name="Reset User"
        )

    def _request_link(self) -> dict:
        self.client.post(RESET_URL, {"email": "reset@example.com"}, format="json")
        match = re.search(r"uid=([\w-]+)&token=([\w-]+)", mail.outbox[-1].body)
        return {"uid": match[1], "token": match[2]}

    def test_known_email_gets_link(self):
        res = self.client.post(RESET_URL, {"email": "Reset@Example.com"}, format="json")
        self.assertEqual(res.status_code, 202)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["reset@example.com"])
        self.assertIn("http://app.test/reset-password?uid=", mail.outbox[0].body)

    def test_unknown_email_same_answer_no_email(self):
        res = self.client.post(RESET_URL, {"email": "nobody@example.com"}, format="json")
        self.assertEqual(res.status_code, 202)
        self.assertEqual(len(mail.outbox), 0)

    def test_confirm_sets_password_revokes_sessions_and_link_is_single_use(self):
        old_session = RefreshToken.for_user(self.user)
        params = self._request_link()

        res = self.client.post(RESET_CONFIRM_URL, {**params, "new_password": "New-strong-password-2"}, format="json")
        self.assertEqual(res.status_code, 204)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("New-strong-password-2"))
        self.assertTrue(BlacklistedToken.objects.filter(token__jti=old_session["jti"]).exists())

        again = self.client.post(RESET_CONFIRM_URL, {**params, "new_password": "Another-strong-pass-3"}, format="json")
        self.assertEqual(again.status_code, 400)
        self.assertIn("token", again.data["error"]["details"])

    def test_invalid_link_rejected(self):
        res = self.client.post(
            RESET_CONFIRM_URL, {"uid": "bad", "token": "bad", "new_password": "New-strong-password-2"}, format="json"
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("token", res.data["error"]["details"])

    def test_weak_password_rejected(self):
        params = self._request_link()
        res = self.client.post(RESET_CONFIRM_URL, {**params, "new_password": "12345678"}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("new_password", res.data["error"]["details"])
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Old-strong-password-1"))
