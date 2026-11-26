"""
Account domain services (System Design §6.1).

Transactional account workflows live here, not in views or serializers.
Callers pass already-validated input (format, password strength); services enforce
the rules that need the database.
"""

import logging

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from .models import User

logger = logging.getLogger(__name__)


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


def request_password_reset(email: str) -> None:
    """
    Email a one-time reset link if an active account exists. Does nothing otherwise, and the
    caller always answers the same way, so the API never reveals which emails are registered.
    """
    user = User.objects.filter(email=User.objects.normalize_email(email), is_active=True).first()
    if user is None or not user.has_usable_password():
        return

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?uid={uid}&token={token}"
    minutes = settings.PASSWORD_RESET_TIMEOUT // 60

    try:
        send_mail(
            subject="Reset your Infraon Flow password",
            message=(
                f"Hi {user.full_name or 'there'},\n\n"
                "We received a request to reset your Infraon Flow password.\n"
                f"Open this link to choose a new one. It works once and expires in {minutes} minutes:\n\n"
                f"{link}\n\n"
                "If you didn't ask for this, ignore this email. Your password won't change."
            ),
            from_email=None,  # DEFAULT_FROM_EMAIL
            recipient_list=[user.email],
        )
    except Exception:
        # Never log the link or token. The API still answers 202, so it reveals nothing.
        logger.exception("Password reset email could not be sent (user_id=%s)", user.pk)
