"""
Account domain services (System Design §6.1).

Transactional account workflows live here, not in views or serializers.
Callers pass already-validated input (format, password strength); services enforce
the rules that need the database.
"""

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from .models import User


def register_user(*, email: str, password: str, full_name: str, accept_terms: bool) -> User:
    """Create an account and record Terms of Service consent. Email is normalised by the manager."""
    if not accept_terms:
        # Re-checked here (not only in the serializer) so no caller can create an
        # account without recorded consent: admin actions, scripts, future invite flows.
        raise ValidationError({"accept_terms": ["You must accept the Terms of Service to create an account."]})
    try:
        with transaction.atomic():
            return User.objects.create_user(
                email=email,
                password=password,
                full_name=full_name,
                terms_accepted_at=timezone.now(),
                terms_version=settings.TERMS_OF_SERVICE_VERSION,
            )
    except IntegrityError:
        # Duplicate email, including two simultaneous sign-ups: the unique constraint decides.
        raise ValidationError({"email": ["A user with this email address already exists."]}) from None


def revoke_all_refresh_tokens(user: User) -> None:
    """Blacklist every refresh token issued to the user, signing out all of their sessions."""
    for token in OutstandingToken.objects.filter(user=user, blacklistedtoken__isnull=True):
        BlacklistedToken.objects.get_or_create(token=token)


@transaction.atomic
def change_password(user: User, new_password: str) -> None:
    """Set a new password and sign out every session, so a stolen refresh token stops working."""
    user.set_password(new_password)
    user.save(update_fields=["password"])
    revoke_all_refresh_tokens(user)
