"""
Workspace context resolution from the X-Workspace-ID header (API Design §5.1).

The header is a context *selector*, not proof of access. This module only parses it.
Membership verification (request → resolve workspace → verify active membership →
scope queryset) is implemented in milestone M1 alongside the WorkspaceMembership model,
and every workspace-scoped view must use that check — never this parser alone.
"""

import uuid

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter
from rest_framework.exceptions import ValidationError

WORKSPACE_HEADER = "X-Workspace-ID"

# Attach to workspace-scoped endpoints with @extend_schema(parameters=[WORKSPACE_HEADER_PARAMETER]).
WORKSPACE_HEADER_PARAMETER = OpenApiParameter(
    name=WORKSPACE_HEADER,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.HEADER,
    required=True,
    description="Active workspace UUID. The server verifies the caller has an active membership.",
)


def get_requested_workspace_id(request) -> uuid.UUID | None:
    """Return the UUID from X-Workspace-ID, None if absent, or raise a 400 if malformed."""
    raw = request.headers.get(WORKSPACE_HEADER)
    if not raw:
        return None
    try:
        return uuid.UUID(raw)
    except ValueError:
        raise ValidationError({WORKSPACE_HEADER: ["Must be a valid UUID."]}) from None
