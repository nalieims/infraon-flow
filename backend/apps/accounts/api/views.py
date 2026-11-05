"""Authentication endpoints under /api/v1/auth/ (API Design §6.2)."""

from django.core.exceptions import ObjectDoesNotExist
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from common.exceptions import error_payload

from .. import services
from .cookies import clear_refresh_cookie, get_refresh_cookie, set_refresh_cookie
from .serializers import (
    AccessTokenSerializer,
    LoginResponseSerializer,
    PasswordChangeSerializer,
    RegisterSerializer,
    UserSerializer,
)

TAGS = ["auth"]
UNAUTHORIZED = OpenApiResponse(description="Missing, invalid, expired or revoked credentials.")


def _session_ended(message: str) -> Response:
    """401 in the standard error envelope that also clears the now-useless refresh cookie."""
    response = Response(error_payload(status.HTTP_401_UNAUTHORIZED, message), status=status.HTTP_401_UNAUTHORIZED)
    clear_refresh_cookie(response)
    return response


class RegisterView(APIView):
    """Create an account. Does not sign in: call /auth/login/ next."""

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_register"

    @extend_schema(tags=TAGS, request=RegisterSerializer, responses={201: UserSerializer})
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = services.register_user(**serializer.validated_data)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Verify email + password. Returns the access token; sets the refresh token as an HttpOnly cookie."""

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_login"

    @extend_schema(
        tags=TAGS,
        request=TokenObtainPairSerializer,
        responses={200: LoginResponseSerializer, 401: UNAUTHORIZED},
    )
    def post(self, request):
        serializer = TokenObtainPairSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        tokens = serializer.validated_data
        response = Response({"access": tokens["access"], "user": UserSerializer(serializer.user).data})
        set_refresh_cookie(response, tokens["refresh"])
        return response


class RefreshView(APIView):
    """Rotate the refresh cookie and return a new access token. The old refresh token is blacklisted."""

    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(tags=TAGS, request=None, responses={200: AccessTokenSerializer, 401: UNAUTHORIZED})
    def post(self, request):
        raw_token = get_refresh_cookie(request)
        if not raw_token:
            return _session_ended("Refresh token cookie is missing.")

        serializer = TokenRefreshSerializer(data={"refresh": raw_token})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError:
            return _session_ended("Refresh token is invalid, expired or revoked.")
        except (AuthenticationFailed, ObjectDoesNotExist):
            return _session_ended("No active account found for this session.")

        response = Response({"access": serializer.validated_data["access"]})
        set_refresh_cookie(response, serializer.validated_data["refresh"])
        return response


class LogoutView(APIView):
    """
    Revoke the refresh token and clear the cookie.

    The refresh cookie is the credential being revoked, so no access token is required:
    a user whose access token already expired must still be able to sign out.
    Idempotent: always 204, and never reveals whether a session existed.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(tags=TAGS, request=None, responses={204: None})
    def post(self, request):
        raw_token = get_refresh_cookie(request)
        if raw_token:
            try:
                RefreshToken(raw_token).blacklist()
            except TokenError:
                pass  # Already expired, invalid or blacklisted: nothing left to revoke.
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_refresh_cookie(response)
        return response


@extend_schema(tags=TAGS)
class MeView(generics.RetrieveUpdateAPIView):
    """Read or update the signed-in user's profile (name, timezone). Email and id are read-only."""

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "options"]

    def get_object(self):
        return self.request.user


class PasswordChangeView(APIView):
    """
    Change password. Every existing refresh token is revoked (signing out all other
    devices, OWASP session-management guidance); this device receives a fresh session:
    a new refresh cookie and a new access token.
    """

    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_password_change"

    @extend_schema(tags=TAGS, request=PasswordChangeSerializer, responses={200: AccessTokenSerializer})
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        services.change_password(request.user, serializer.validated_data["new_password"])

        # Issued after the revocation above, so only this new token survives.
        refresh = RefreshToken.for_user(request.user)
        response = Response({"access": str(refresh.access_token)})
        set_refresh_cookie(response, str(refresh))
        return response
