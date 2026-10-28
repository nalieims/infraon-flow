from django.http import JsonResponse
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .exceptions import error_payload


class HealthCheckView(APIView):
    """Liveness probe for uptime monitoring and frontend connectivity checks."""

    authentication_classes = []  # A stale token must not turn a health check into a 401.
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["health"],
        summary="API health check",
        responses=inline_serializer(
            name="HealthResponse",
            fields={"status": serializers.CharField(), "application": serializers.CharField()},
        ),
    )
    def get(self, request):
        return Response({"status": "ok", "application": "Infraon Flow API"})


# JSON fallbacks for errors raised outside DRF views (active only when DEBUG=False).
def json_not_found(request, exception=None):
    return JsonResponse(error_payload(404, "The requested resource was not found."), status=404)


def json_server_error(request):
    return JsonResponse(error_payload(500, "An unexpected error occurred."), status=500)
