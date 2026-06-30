from app.ai.gemini import model
from typing import Dict, List


def generate_report_summary(reports: List[Dict]) -> str:
    reports_text = "\n".join([
        f"- {r.get('title', 'N/A')}: {r.get('status', 'unknown')} ({r.get('department', 'Unassigned')})"
        for r in reports[:20]
    ])

    prompt = f"""Generate a comprehensive summary report for city officials based on these civic issues:

{reports_text}

Include:
1. Total issues by category
2. Resolution rate
3. Top problem areas
4. Recommended actions
5. Resource allocation suggestions

Provide a professional, data-driven summary."""

    response = model.generate_content(prompt)
    return response.text.strip()


def generate_individual_report(report: Dict) -> str:
    prompt = f"""Generate a detailed report for this civic issue:

Title: {report.get('title', 'N/A')}
Description: {report.get('description', 'N/A')}
Status: {report.get('status', 'unknown')}
Department: {report.get('department', 'Unassigned')}
Priority: {report.get('priority', 'medium')}
Comments: {report.get('comments', [])}

Include:
1. Issue summary
2. Current status
3. Next steps
4. Timeline estimate
5. Resources needed"""

    response = model.generate_content(prompt)
    return response.text.strip()


def generate_weekly_report(reports: List[Dict]) -> str:
    resolved = [r for r in reports if r.get("status") == "resolved"]
    pending = [r for r in reports if r.get("status") in ["reported", "verified"]]

    prompt = f"""Generate a weekly performance report:

Total Reports: {len(reports)}
Resolved: {len(resolved)}
Pending: {len(pending)}

Departments: {set(r.get('department', 'N/A') for r in reports)}

Provide:
1. Week summary
2. Resolution rate
3. Top departments
4. Areas needing attention
5. Recommendations for next week"""

    response = model.generate_content(prompt)
    return response.text.strip()
