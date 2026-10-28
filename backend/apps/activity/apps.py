from django.apps import AppConfig


class ActivityConfig(AppConfig):
    """Activity log and in-app notifications."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.activity"
    label = "activity"
