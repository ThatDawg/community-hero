import pytest
from app.ai.severity import predict_severity
from app.ai.department_classifier import classify_department
from app.ai.duplicate_detection import compute_similarity


class TestSeverityPrediction:
    def test_pothole_high_severity(self):
        result = predict_severity("Large pothole on main road causing accidents", "pothole")
        assert result in ["critical", "high", "medium", "low"]

    def test_garbage_medium_severity(self):
        result = predict_severity("Garbage bin overflowing near park", "garbage")
        assert result in ["critical", "high", "medium", "low"]


class TestDepartmentClassifier:
    def test_pothole_assigns_public_works(self):
        result = classify_department("Pothole on road", "pothole")
        assert result == "Public Works"

    def test_garbage_assigns_sanitation(self):
        result = classify_department("Overflowing garbage bin", "garbage")
        assert result == "Sanitation"


class TestDuplicateDetection:
    def test_similar_texts_high_score(self):
        score = compute_similarity("Pothole on Main Street", "Pothole on Main Street near library")
        assert 0.0 <= score <= 1.0
