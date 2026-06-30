import pytest
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


class TestHealthEndpoint:
    def test_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


class TestAnalyticsEndpoint:
    def test_analytics_returns_structure(self):
        response = client.get("/api/analytics")
        assert response.status_code == 200
        data = response.json()
        assert "totalReports" in data
        assert "resolvedReports" in data
        assert "pendingReports" in data


class TestHeatmapEndpoint:
    def test_heatmap_returns_points(self):
        response = client.get("/api/heatmap")
        assert response.status_code == 200
        data = response.json()
        assert "points" in data
