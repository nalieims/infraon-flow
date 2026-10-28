from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase

from .models import DEFAULT_USER_TIMEZONE

User = get_user_model()


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
