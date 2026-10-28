from django.apps import AppConfig


class InitiativesConfig(AppConfig):
    """Initiatives linked to key results."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.initiatives"
    label = "initiatives"
