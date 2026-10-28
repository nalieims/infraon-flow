import uuid

from django.test import RequestFactory, SimpleTestCase
from rest_framework.exceptions import ValidationError
from rest_framework.test import APITestCase

from .workspace import get_requested_workspace_id


class HealthCheckTests(APITestCase):
    def test_health_returns_ok(self):
        response = self.client.get("/api/v1/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "application": "Infraon Flow API"})

    def test_health_ignores_invalid_token(self):
        response = self.client.get("/api/v1/health/", HTTP_AUTHORIZATION="Bearer not-a-real-token")
        self.assertEqual(response.status_code, 200)

    def test_request_id_is_echoed_or_generated(self):
        response = self.client.get("/api/v1/health/", HTTP_X_REQUEST_ID="abc-123")
        self.assertEqual(response["X-Request-ID"], "abc-123")
        response = self.client.get("/api/v1/health/", HTTP_X_REQUEST_ID="bad value with spaces")
        self.assertNotEqual(response["X-Request-ID"], "bad value with spaces")


class ErrorContractTests(APITestCase):
    def test_method_not_allowed_uses_error_envelope(self):
        response = self.client.post("/api/v1/health/", {}, format="json")
        self.assertEqual(response.status_code, 405)
        body = response.json()["error"]
        self.assertEqual(body["code"], "method_not_allowed")
        self.assertEqual(body["details"], {})
        self.assertEqual(body["request_id"], response["X-Request-ID"])


class OpenAPISchemaTests(APITestCase):
    def test_schema_is_served(self):
        response = self.client.get("/api/schema/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"/api/v1/health/", response.content)


class WorkspaceHeaderTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_absent_header_returns_none(self):
        self.assertIsNone(get_requested_workspace_id(self.factory.get("/")))

    def test_valid_uuid_is_parsed(self):
        workspace_id = uuid.uuid4()
        request = self.factory.get("/", HTTP_X_WORKSPACE_ID=str(workspace_id))
        self.assertEqual(get_requested_workspace_id(request), workspace_id)

    def test_malformed_uuid_is_rejected(self):
        with self.assertRaises(ValidationError):
            get_requested_workspace_id(self.factory.get("/", HTTP_X_WORKSPACE_ID="not-a-uuid"))
