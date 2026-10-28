from django.apps import AppConfig


class WorkspacesConfig(AppConfig):
    """Workspaces, memberships, invitations, teams and roles; tenant context."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.workspaces"
    label = "workspaces"
