"""Production / staging settings. Served by Gunicorn behind Nginx, which terminates TLS."""

from .base import *  # noqa: F403
from .base import SPECTACULAR_SETTINGS, env

DEBUG = False

# Nginx forwards the original scheme.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

# Enable HSTS only after HTTPS is verified end to end (System Design §12).
SECURE_HSTS_SECONDS = env.int("DJANGO_SECURE_HSTS_SECONDS", default=0)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool("DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS", default=False)
SECURE_HSTS_PRELOAD = False

# API documentation is restricted to staff outside development.
SPECTACULAR_SETTINGS["SERVE_PERMISSIONS"] = ["rest_framework.permissions.IsAdminUser"]

# Browsers send the Django admin session cookie, not a JWT, so the docs views also accept
# session auth: staff sign in at /admin/ first, then open /api/docs/.
SPECTACULAR_SETTINGS["SERVE_AUTHENTICATION"] = [
    "rest_framework.authentication.SessionAuthentication",
    "rest_framework_simplejwt.authentication.JWTAuthentication",
]
