import google.generativeai as genai
from PIL import Image
from typing import List, Dict, Optional
from app.utils.config import GOOGLE_API_KEY
from app.ai.prompts import ANALYZE_PROMPT, CHAT_SYSTEM_PROMPT, DUPLICATE_PROMPT, SUMMARY_PROMPT
import json

model = None

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")


def _fallback_analysis(description: str) -> Dict:
    lower = description.lower()
    if any(word in lower for word in ["garbage", "trash", "waste", "dump"]):
        category_department = "Sanitation"
    elif any(word in lower for word in ["water", "leak", "pipe", "flood"]):
        category_department = "Water Supply"
    elif any(word in lower for word in ["light", "streetlight", "electric"]):
        category_department = "Electrical"
    else:
        category_department = "Public Works"

    return {
        "title": description[:60] or "Civic Issue Report",
        "description": description,
        "department": category_department,
        "priority": "medium",
        "estimatedResolution": "3-5 business days",
        "estimatedRepairCost": "Not available",
        "suggestedAction": "Inspection required",
        "citizenSummary": "Your report has been received and is being reviewed.",
        "rootCause": "Requires further investigation",
    }


def analyze_with_gemini(
    image: Optional[Image.Image],
    detections: List[Dict],
    description: str,
    location: str,
) -> Dict:
    if model is None:
        return _fallback_analysis(description)

    detection_text = "\n".join(
        [f"- {d['category']} (confidence: {d['confidence']}, severity: {d['severity']})" for d in detections]
    ) if detections else "No image detection results available."

    prompt = ANALYZE_PROMPT.format(
        detection_text=detection_text,
        description=description,
        location=location,
    )

    content = [prompt]
    if image:
        content.append(image)

    response = model.generate_content(content)
    text = response.text.strip()
    if text.startswith("```"):
        text = text[7:-3]

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return _fallback_analysis(description)


def chat_with_gemini(message: str, context: Optional[str] = None) -> str:
    if model is None:
        return "AI chat is not configured yet. Add GOOGLE_API_KEY to the backend environment."

    full_prompt = f"Context: {context}\n\nUser: {message}" if context else message
    response = model.generate_content(f"{CHAT_SYSTEM_PROMPT}\n\n{full_prompt}")
    return response.text


def detect_duplicates(new_description: str, new_location: str, existing_reports: List[Dict]) -> Optional[str]:
    if model is None or not existing_reports:
        return None

    reports_text = "\n".join(
        [f"- ID: {r.get('id')}, Title: {r.get('title', '')}, Location: {r.get('address', '')}" for r in existing_reports[:10]]
    )

    prompt = DUPLICATE_PROMPT.format(
        new_description=new_description,
        new_location=new_location,
        reports_text=reports_text,
    )

    response = model.generate_content(prompt)
    result = response.text.strip().lower()

    if result == "none" or not result:
        return None
    return result


def generate_progress_summary(
    report_id: str,
    title: str,
    status: str,
    department: str,
    comments: List[str],
) -> str:
    if model is None:
        return "AI summary is not configured yet. Add GOOGLE_API_KEY to the backend environment."

    comments_text = "\n".join([f"- {c}" for c in comments]) if comments else "No comments yet."

    prompt = SUMMARY_PROMPT.format(
        report_id=report_id,
        title=title,
        status=status,
        department=department,
        comments_text=comments_text,
    )

    response = model.generate_content(prompt)
    return response.text.strip()
