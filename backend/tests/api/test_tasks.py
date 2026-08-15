import pytest
from fastapi.testclient import TestClient
from datetime import date, timedelta

def test_task_overdue_logic(client: TestClient, admin_token_headers):
    # 1. Tạo task với deadline trong quá khứ
    past_date = str(date.today() - timedelta(days=1))
    data = {
        "title": "Test Overdue Task",
        "plan_id": "uuid-cua-plan",
        "deadline": past_date,
        "priority": "HIGH"
    }
    client.post("/api/tasks", json=data, headers=admin_token_headers)
    
    # 2. GET API để trigger auto_update_overdue
    res = client.get("/api/tasks?search=Test Overdue Task", headers=admin_token_headers)
    assert res.json()["items"][0]["status"] == "OVERDUE"