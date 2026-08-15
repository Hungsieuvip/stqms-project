# test_evidences.py
import pytest
from fastapi.testclient import TestClient

def test_create_evidence_auto_code(client: TestClient, admin_token_headers):
    # Cần tạo trước 1 Standard và 1 Criteria trong DB
    data = {
        "name": "Biên bản họp khoa",
        "primary_criteria_id": "uuid-cua-criteria-1"
    }
    response = client.post("/api/evidences", json=data, headers=admin_token_headers)
    assert response.status_code == 201
    assert response.json()["code"].startswith("MC.")

def test_upload_invalid_extension(client: TestClient, admin_token_headers):
    # Thử upload file .exe
    files = {"file": ("virus.exe", b"fake content")}
    res = client.post("/api/evidences/uuid-evidence/upload", files=files, headers=admin_token_headers)
    assert res.status_code == 400
    assert "Unsupported file extension" in res.text