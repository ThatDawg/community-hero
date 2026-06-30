import google.generativeai as genai
from PIL import Image
from typing import List, Dict, Optional
from app.utils.config import GOOGLE_API_KEY
from app.ai.prompts import ANALYZE_PROMPT, CHAT_SYSTEM_PROMPT, DUPLICATE_PROMPT, SUMMARY_PROMPT
import json

genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")


def analyze_with_gemini(
    image: Optional[Image.Image],
    detections: List[Dict],
    description: str,
    location: str,
) -> Dict:
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
    full_prompt = f"Context: {context}\n\nUser: {message}" if context else message
    response = model.generate_content(f"{CHAT_SYSTEM_PROMPT}\n\n{full_prompt}")
    return response.text


def detect_duplicates(new_description: str, new_location: str, existing_reports: List[Dict]) -> Optional[str]:
    if not existing_reports:
        return None

    reports_text = "\n".join(
        [f"- ID: {r['id']}, Title: {r['title']}, Location: {r['address']}" for r in existing_reports[:10]]
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
