from django.apps import AppConfig


class DashboardConfig(AppConfig):
    """Read-only, permission-filtered aggregates for dashboards and reports."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.dashboard"
    label = "dashboard"
