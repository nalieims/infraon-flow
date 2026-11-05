import uuid
import zoneinfo
from functools import cache

from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.functions import Lower

from .managers import UserManager

# Database Design §6.1: "application default may be Asia/Kolkata".
DEFAULT_USER_TIMEZONE = "Asia/Kolkata"


@cache
def _valid_timezones() -> frozenset[str]:
    # Scanning the tz database is slow; the set never changes while the process runs.
    return frozenset(zoneinfo.available_timezones())


def validate_timezone(value: str) -> None:
    if value not in _valid_timezones():
        raise ValidationError(f"'{value}' is not a valid IANA time zone.")


class User(AbstractUser):
    """
    Authentication identity (Database Design §6.1, table `users`).

    Users sign in with email; there is no username. Workspace access is granted
    only through WorkspaceMembership, never by this model alone.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None
    # One name field to match the sign-up form; names are never split into first/last.
    first_name = None
    last_name = None
    full_name = models.CharField("full name", max_length=150, blank=True, default="")

    email = models.EmailField("email address", max_length=254, unique=True)
    timezone = models.CharField(max_length=64, default=DEFAULT_USER_TIMEZONE, validators=[validate_timezone])
    # Consent evidence: when the user accepted the Terms of Service, and which version.
    # Null for accounts not created through sign-up (e.g. createsuperuser).
    terms_accepted_at = models.DateTimeField(null=True, blank=True)
    terms_version = models.CharField(max_length=20, blank=True, default="")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        db_table = "users"
        ordering = ["email"]
        constraints = [
            # Defense in depth: case-insensitive uniqueness even if a write bypasses normalisation.
            models.UniqueConstraint(Lower("email"), name="users_email_ci_unique"),
        ]

    # Django's AbstractUser builds these from first_name/last_name, which no longer exist.
    def get_full_name(self) -> str:
        return self.full_name

    def get_short_name(self) -> str:
        return self.full_name

    def __str__(self) -> str:
        return self.email

    def save(self, *args, **kwargs):
        self.email = UserManager.normalize_email(self.email)
        super().save(*args, **kwargs)
