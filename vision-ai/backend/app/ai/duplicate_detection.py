from app.ai.gemini import model
from typing import List, Dict, Optional
import json


def detect_duplicates(
    new_description: str,
    new_location: str,
    existing_reports: List[Dict],
) -> Optional[str]:
    if not existing_reports:
        return None

    reports_text = "\n".join(
        [f"- ID: {r['id']}, Title: {r.get('title', 'N/A')}, Location: {r.get('address', 'N/A')}" for r in existing_reports[:10]]
    )

    prompt = f"""Check if this new issue report is a duplicate of any existing reports.

New Report:
Description: {new_description}
Location: {new_location}

Existing Reports:
{reports_text}

If a duplicate is found, respond with ONLY the report ID.
If no duplicate, respond with ONLY "none"."""

    response = model.generate_content(prompt)
    result = response.text.strip().lower()

    if result == "none" or not result:
        return None
    return result


def compute_similarity(text1: str, text2: str) -> float:
    prompt = f"""Rate the similarity between these two texts on a scale of 0.0 to 1.0:
Text 1: {text1}
Text 2: {text2}

Respond with ONLY a number between 0.0 and 1.0."""

    response = model.generate_content(prompt)
    try:
        return float(response.text.strip())
    except ValueError:
        return 0.0
