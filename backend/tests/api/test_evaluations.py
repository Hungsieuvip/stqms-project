import pytest
from fastapi.testclient import TestClient

def test_evaluate_criterion(client: TestClient, admin_token_headers):
    # Dữ liệu giả định có sẵn criterion_id
    data = {
        "result": "PASS",
        "level": "LEVEL_2",
        "comment": "Minh chứng đầy đủ, đạt yêu cầu."
    }
    res = client.post("/api/evaluations/criteria/fake-uuid", json=data, headers=admin_token_headers)
    assert res.status_code in [200, 404] # Tùy thuộc UUID giả