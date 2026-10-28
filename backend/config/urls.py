from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

from common.views import HealthCheckView

# Versioned API (API Design §4). Domain app routes are added here as each milestone lands.
api_v1_patterns = [
    path("health/", HealthCheckView.as_view(), name="health"),
]

urlpatterns = [
    path(settings.ADMIN_URL, admin.site.urls),
    path("api/v1/", include(api_v1_patterns)),
    # OpenAPI documentation (API Design §20)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

handler404 = "common.views.json_not_found"
handler500 = "common.views.json_server_error"
