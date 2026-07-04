"""Smoke tests for the Riko backend engines and API."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.core import service
from app.main import app

client = TestClient(app)


def test_data_generation():
    txns = service.get_transactions()
    assert len(txns) > 20
    assert any(t["type"] == "credit" for t in txns)


def test_spending_summary():
    s = service.get_spending()
    assert s["income"] > 0
    assert "by_category" in s
    assert isinstance(s["overspending"], list)


def test_wealth_score_range():
    sc = service.get_score()
    assert 0 <= sc["score"] <= 100
    assert len(sc["factors"]) == 6


def test_recommendations():
    r = service.get_recommendations()
    assert r["recommendations"]
    assert all("why" in rec for rec in r["recommendations"])


def test_dashboard_endpoint():
    resp = client.get("/api/dashboard")
    assert resp.status_code == 200
    body = resp.json()
    assert "wealth_score" in body
    assert "insights" in body


def test_affordability():
    resp = client.post("/api/affordability", json={"purchase_price": 1200000})
    assert resp.status_code == 200
    assert "emi" in resp.json()


def test_ask_affordability():
    resp = client.post("/api/ask", json={"question": "Can I afford a 12 lakh car?"})
    assert resp.status_code == 200
    assert "savings rate" in resp.json()["answer"].lower()
