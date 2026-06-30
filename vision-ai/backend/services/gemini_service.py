import google.generativeai as genai
from PIL import Image
from typing import List, Dict, Optional
from utils.config import GOOGLE_API_KEY
import json

genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")


def analyze_with_gemini(
    image: Image.Image,
    detections: List[Dict],
    description: str,
    location: str,
) -> Dict:
    detection_text = "\n".join(
        [f"- {d['category']} (confidence: {d['confidence']}, severity: {d['severity']})" for d in detections]
    )

    prompt = f"""You are an AI assistant for a civic issue reporting system. Analyze the following report and provide structured output.

Image Detection Results:
{detection_text}

Citizen Description: {description}
Location: {location}

Provide a JSON response with these fields:
{{
    "title": "Brief issue title",
    "description": "Detailed issue description",
    "department": "Responsible department (Public Works, Sanitation, Electrical, Water, Parks, Traffic)",
    "priority": "critical/high/medium/low",
    "estimatedResolution": "Estimated time to resolve",
    "suggestedAction": "Recommended immediate action",
    "citizenSummary": "Friendly summary for the citizen",
    "rootCause": "Potential root cause analysis"
}}

Respond ONLY with valid JSON."""

    response = model.generate_content([prompt, image])
    text = response.text.strip()
    if text.startswith("```"):
        text = text[7:-3]

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "title": "Civic Issue Report",
            "description": description,
            "department": "Public Works",
            "priority": "medium",
            "estimatedResolution": "3-5 business days",
            "suggestedAction": "Inspection required",
            "citizenSummary": "Your report has been received and is being reviewed.",
            "rootCause": "Requires further investigation",
        }


def chat_with_gemini(message: str, context: Optional[str] = None) -> str:
    system_prompt = """You are Vision AI, a helpful assistant for a civic issue reporting platform.
You help citizens report issues, check status, and provide information about local government services.
Be helpful, concise, and friendly. If asked about a specific issue, provide relevant details."""

    if context:
        full_prompt = f"Context: {context}\n\nUser: {message}"
    else:
        full_prompt = message

    response = model.generate_content(
        f"{system_prompt}\n\n{full_prompt}"
    )
    return response.text


def detect_duplicates(new_description: str, new_location: str, existing_reports: List[Dict]) -> Optional[str]:
    if not existing_reports:
        return None

    reports_text = "\n".join(
        [f"- ID: {r['id']}, Title: {r['title']}, Location: {r['address']}" for r in existing_reports[:10]]
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
