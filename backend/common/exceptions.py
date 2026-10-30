"""
Standard API error contract (API Design §15.2, System Design §8.2):

    {"error": {"code": "...", "message": "...", "details": {...}, "request_id": "..."}}
"""

from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.views import exception_handler

from .middleware import get_request_id

ERROR_CODES_BY_STATUS = {
    400: "validation_error",
    401: "authentication_required",
    403: "permission_denied",
    404: "not_found",
    405: "method_not_allowed",
    406: "not_acceptable",
    409: "conflict",
    413: "payload_too_large",
    415: "unsupported_media_type",
    429: "rate_limited",
    500: "internal_error",
}


class ConflictError(APIException):
    """State transition or uniqueness conflict (HTTP 409)."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "The request conflicts with the current state of the resource."
    default_code = "conflict"


def error_payload(status_code: int, message: str, details: dict | None = None) -> dict:
    return {
        "error": {
            "code": ERROR_CODES_BY_STATUS.get(status_code, "error"),
            "message": message,
            "details": details or {},
            "request_id": get_request_id(),
        }
    }


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        # Unexpected error: let Django handle it (DEBUG traceback page, `django.request`
        # error log, error-reporting hooks). With DEBUG=False, handler500
        # (common.views.json_server_error) still returns the standard JSON error envelope.
        return None

    if isinstance(exc, ValidationError):
        detail = exc.detail if isinstance(exc.detail, dict) else {"non_field_errors": exc.detail}
        response.data = error_payload(response.status_code, "The request contains invalid fields.", detail)
        return response

    detail = response.data
    if isinstance(detail, dict) and "detail" in detail:
        # DRF / Simple JWT shape: {"detail": "...", "code": "...", ...}
        message = str(detail["detail"])
    else:
        message = str(detail)
    response.data = error_payload(response.status_code, message)
    return response
