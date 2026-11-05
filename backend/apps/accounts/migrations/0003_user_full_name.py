"""Replace first_name/last_name with a single full_name, preserving existing names."""

from django.db import migrations, models


def copy_names_to_full_name(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    for user in User.objects.only("id", "first_name", "last_name"):
        user.full_name = " ".join(f"{user.first_name} {user.last_name}".split())
        user.save(update_fields=["full_name"])


def copy_full_name_back(apps, schema_editor):
    # Reverse migration: keep the whole name in first_name rather than guessing a split.
    User = apps.get_model("accounts", "User")
    for user in User.objects.only("id", "full_name"):
        user.first_name = user.full_name[:150]
        user.save(update_fields=["first_name"])


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_user_terms_accepted_at_user_terms_version"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="full_name",
            field=models.CharField(blank=True, default="", max_length=150, verbose_name="full name"),
        ),
        migrations.RunPython(copy_names_to_full_name, copy_full_name_back),
        migrations.RemoveField(model_name="user", name="first_name"),
        migrations.RemoveField(model_name="user", name="last_name"),
    ]
