from app.ai.gemini import model
from typing import Dict


SEVERITY_PROMPT = """Based on the following civic issue, determine the severity level.

Issue: {description}
Category: {category}
Location context: {location}

Severity levels:
- critical: Immediate danger to life/property, requires urgent action
- high: Significant impact, should be addressed within 24 hours
- medium: Moderate impact, should be addressed within a week
- low: Minor issue, can be scheduled for regular maintenance

Respond with ONLY one word: critical, high, medium, or low."""


def predict_severity(description: str, category: str, location: str = "") -> str:
    prompt = SEVERITY_PROMPT.format(
        description=description,
        category=category,
        location=location,
    )

    response = model.generate_content(prompt)
    severity = response.text.strip().lower()

    if severity in ["critical", "high", "medium", "low"]:
        return severity
    return "medium"


def assess_urgency(report_data: Dict) -> Dict:
    category = report_data.get("category", "unknown")
    description = report_data.get("description", "")

    severity = predict_severity(description, category)

    urgency_map = {
        "critical": {"priority": 1, "response_time": "2 hours", "escalate": True},
        "high": {"priority": 2, "response_time": "24 hours", "escalate": True},
        "medium": {"priority": 3, "response_time": "7 days", "escalate": False},
        "low": {"priority": 4, "response_time": "30 days", "escalate": False},
    }

    urgency = urgency_map.get(severity, urgency_map["medium"])

    return {
        "severity": severity,
        **urgency,
    }
