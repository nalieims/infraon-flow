"""Local development settings."""

from .base import *  # noqa: F403
from .base import REST_FRAMEWORK, env

DEBUG = env.bool("DJANGO_DEBUG", default=True)
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:4200"])

# Browsable API is convenient locally; production stays JSON-only.
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = [
    "rest_framework.renderers.JSONRenderer",
    "rest_framework.renderers.BrowsableAPIRenderer",
]

# Looser sign-up limit for local API testing (Postman). Staging/production keep the base value (10/hour).
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {**REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"], "auth_register": "100/hour"}

# Local dev runs on plain http://localhost; Postman will not send a Secure cookie over http.
AUTH_REFRESH_COOKIE_SECURE = env.bool("AUTH_REFRESH_COOKIE_SECURE", default=False)
