from app.ai.gemini import model
from typing import Dict


DEPARTMENTS = {
    "Public Works": ["pothole", "road_crack", "road_damage", "construction", "open_manhole"],
    "Sanitation": ["garbage", "overflowing_bin", "illegal_dumping"],
    "Electrical": ["broken_streetlight", "traffic_signal", "power_lines"],
    "Water": ["water_leakage", "flooding", "burst_pipe"],
    "Parks & Recreation": ["fallen_tree", "damaged_fence", "playground"],
    "Fire Department": ["fire", "smoke", "gas_leak"],
}

DEPARTMENT_PROMPT = """Classify this civic issue into one of the following departments:
{departments}

Issue: {description}
Category: {category}
Detected objects: {detections}

Respond with ONLY the department name."""


def classify_department(
    description: str,
    category: str = "",
    detections: list = None,
) -> str:
    detection_text = ", ".join([d.get("category", "") for d in (detections or [])])

    prompt = DEPARTMENT_PROMPT.format(
        departments=", ".join(DEPARTMENTS.keys()),
        description=description,
        category=category,
        detections=detection_text or "None",
    )

    response = model.generate_content(prompt)
    dept = response.text.strip()

    for valid_dept in DEPARTMENTS:
        if valid_dept.lower() in dept.lower():
            return valid_dept

    return "Public Works"


def get_department_contacts(department: str) -> Dict:
    contacts = {
        "Public Works": {"email": "publicworks@city.gov", "phone": "555-0101"},
        "Sanitation": {"email": "sanitation@city.gov", "phone": "555-0102"},
        "Electrical": {"email": "electrical@city.gov", "phone": "555-0103"},
        "Water": {"email": "water@city.gov", "phone": "555-0104"},
        "Parks & Recreation": {"email": "parks@city.gov", "phone": "555-0105"},
        "Fire Department": {"email": "fire@city.gov", "phone": "911"},
    }
    return contacts.get(department, {"email": "general@city.gov", "phone": "555-0100"})
