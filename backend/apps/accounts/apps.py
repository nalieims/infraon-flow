from django.apps import AppConfig


class AccountsConfig(AppConfig):
    """Custom user, authentication and profile."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.accounts"
    label = "accounts"
