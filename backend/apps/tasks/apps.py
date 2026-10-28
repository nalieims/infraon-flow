from django.apps import AppConfig


class TasksConfig(AppConfig):
    """Tasks, subtasks, comments and the daily plan (My Day)."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.tasks"
    label = "tasks"
