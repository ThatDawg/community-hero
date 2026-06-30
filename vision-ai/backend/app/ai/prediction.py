from app.ai.gemini import model
from typing import Dict, List
from datetime import datetime, timedelta


def predict_resolution_time(report: Dict) -> str:
    category = report.get("category", "unknown")
    severity = report.get("severity", "medium")
    department = report.get("department", "Public Works")

    prompt = f"""Estimate the resolution time for this civic issue:

Category: {category}
Severity: {severity}
Department: {department}
Description: {report.get('description', 'N/A')}

Provide a realistic estimate considering:
- Issue complexity
- Department workload
- Resource availability
- Weather/seasonal factors

Respond with a brief estimate (e.g., "2-3 days", "1 week", "2-4 weeks")."""

    response = model.generate_content(prompt)
    return response.text.strip()


def predict_trend(historical_data: List[Dict]) -> Dict:
    if not historical_data:
        return {"trend": "stable", "prediction": "No data available"}

    categories = {}
    for report in historical_data:
        cat = report.get("category", "unknown")
        categories[cat] = categories.get(cat, 0) + 1

    top_category = max(categories, key=categories.get) if categories else "unknown"

    return {
        "trend": "increasing" if len(historical_data) > 10 else "stable",
        "top_category": top_category,
        "total_reports": len(historical_data),
        "prediction": f"Expect {top_category} issues to continue based on current trends",
    }


def suggest_resources(report: Dict) -> Dict:
    severity = report.get("severity", "medium")
    category = report.get("category", "unknown")

    resources = {
        "critical": {
            "crew_size": "4-6 workers",
            "equipment": "Heavy machinery, safety gear",
            "budget_estimate": "$5,000-$10,000",
            "priority": "Immediate",
        },
        "high": {
            "crew_size": "2-4 workers",
            "equipment": "Standard tools",
            "budget_estimate": "$1,000-$5,000",
            "priority": "Within 24 hours",
        },
        "medium": {
            "crew_size": "1-2 workers",
            "equipment": "Basic tools",
            "budget_estimate": "$200-$1,000",
            "priority": "Within 1 week",
        },
        "low": {
            "crew_size": "1 worker",
            "equipment": "Hand tools",
            "budget_estimate": "$50-$200",
            "priority": "Scheduled maintenance",
        },
    }

    return resources.get(severity, resources["medium"])
