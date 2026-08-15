import pytest
from fastapi.testclient import TestClient
import uuid

def test_get_notifications(client: TestClient, admin_token_headers):
    res = client.get("/api/notifications", headers=admin_token_headers)
    assert res.status_code == 200
    assert "unread_count" in res.json()

def test_get_audit_logs_unauthorized(client: TestClient, normal_user_token_headers):
    # User thường không có quyền audit.read
    res = client.get("/api/audit-logs", headers=normal_user_token_headers)
    assert res.status_code == 403