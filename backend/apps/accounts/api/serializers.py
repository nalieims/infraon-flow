"""Request and response shapes for /api/v1/auth/ (API Design §6.2)."""

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from ..models import User


def _password_errors(password: str, user: User) -> list[str]:
    """Run AUTH_PASSWORD_VALIDATORS; return their messages (empty list = password is acceptable)."""
    try:
        validate_password(password, user=user)
    except DjangoValidationError as exc:
        return list(exc.messages)
    return []


def _clean_full_name(value: str) -> str:
    """Collapse repeated whitespace: '  Nagaraju    N ' -> 'Nagaraju N'. Never split into parts."""
    return " ".join(value.split())


class UserSerializer(serializers.ModelSerializer):
    """The signed-in user's profile: register/login `user`, GET/PATCH /auth/me/."""

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "timezone"]
        read_only_fields = ["id", "email"]
        # The model allows blank (for createsuperuser); the API does not.
        extra_kwargs = {"full_name": {"allow_blank": False}}

    def validate_full_name(self, value: str) -> str:
        return _clean_full_name(value)


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(
        write_only=True, trim_whitespace=False, max_length=128, style={"input_type": "password"}
    )
    accept_terms = serializers.BooleanField(
        write_only=True, help_text="Must be true: the user accepted the Terms of Service."
    )

    def validate_full_name(self, value: str) -> str:
        return _clean_full_name(value)

    def validate_email(self, value: str) -> str:
        email = User.objects.normalize_email(value)
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return email

    def validate_accept_terms(self, value: bool) -> bool:
        if value is not True:
            raise serializers.ValidationError("You must accept the Terms of Service to create an account.")
        return value

    def validate(self, attrs: dict) -> dict:
        # The similarity validator compares the password with email and full_name (settings).
        candidate = User(email=attrs["email"], full_name=attrs["full_name"])
        if errors := _password_errors(attrs["password"], candidate):
            raise serializers.ValidationError({"password": errors})
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True, trim_whitespace=False, max_length=128, style={"input_type": "password"}
    )
    new_password = serializers.CharField(
        write_only=True, trim_whitespace=False, max_length=128, style={"input_type": "password"}
    )

    def validate_current_password(self, value: str) -> str:
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs: dict) -> dict:
        if attrs["new_password"] == attrs["current_password"]:
            raise serializers.ValidationError({"new_password": ["New password must differ from the current one."]})
        if errors := _password_errors(attrs["new_password"], self.context["request"].user):
            raise serializers.ValidationError({"new_password": errors})
        return attrs


# Response shapes (used for the OpenAPI docs and to keep the views' output consistent).
class AccessTokenSerializer(serializers.Serializer):
    access = serializers.CharField(help_text="Short-lived JWT access token. Send as `Authorization: Bearer <access>`.")


class LoginResponseSerializer(AccessTokenSerializer):
    user = UserSerializer()
