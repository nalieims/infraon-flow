from django.contrib.auth import authenticate, get_user_model
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase, override_settings
from rest_framework.test import APITestCase

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
