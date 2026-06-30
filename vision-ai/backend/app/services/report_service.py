from app.database.firebase import db
from app.ai.gemini import analyze_with_gemini, detect_duplicates
from app.ai.yolo import detect_issues
from typing import Dict, Optional
import logging

logger = logging.getLogger("vision-ai")


async def create_report(
    description: str,
    lat: float,
    lng: float,
    user_id: str,
    user_name: str,
    image_url: Optional[str] = None,
) -> Dict:
    report_data = {
        "description": description,
        "latitude": lat,
        "longitude": lng,
        "user_id": user_id,
        "user_name": user_name,
        "image_url": image_url,
        "status": "reported",
        "upvotes": 0,
        "verifications": 0,
        "created_at": _now(),
    }

    if db:
        ref = db.collection("reports").add(report_data)
        report_id = ref[1].id
        report_data["id"] = report_id
        logger.info(f"Report created: {report_id}")

        await _send_nearby_notifications(report_data)

    return report_data


async def update_report_status(report_id: str, status: str, department: Optional[str] = None) -> bool:
    if not db:
        return False

    update_data = {"status": status}
    if department:
        update_data["department"] = department
    if status == "resolved":
        update_data["resolved_at"] = _now()

    db.collection("reports").document(report_id).update(update_data)
    logger.info(f"Report {report_id} status updated to {status}")
    return True


async def upvote_report(report_id: str) -> int:
    if not db:
        return 0

    ref = db.collection("reports").document(report_id)
    ref.update({"upvotes": _increment(1)})
    doc = ref.get()
    return doc.to_dict().get("upvotes", 0)


async def verify_report(report_id: str, user_id: str, user_name: str) -> Dict:
    if not db:
        return {"verified": False, "count": 0}

    verifications_ref = db.collection("reports").document(report_id).collection("verifications")
    existing = verifications_ref.where("user_id", "==", user_id).get()

    if list(existing):
        return {"verified": False, "count": len(list(verifications_ref.get())), "message": "Already verified"}

    verifications_ref.add({
        "user_id": user_id,
        "user_name": user_name,
        "created_at": _now(),
    })

    db.collection("reports").document(report_id).update({"verifications": _increment(1)})

    count = len(list(verifications_ref.get()))
    if count >= 3:
        db.collection("reports").document(report_id).update({"status": "verified"})
        logger.info(f"Report {report_id} verified by {count} users")

    return {"verified": True, "count": count}


async def add_comment(report_id: str, user_id: str, user_name: str, text: str) -> Dict:
    if not db:
        return {}

    comment_data = {
        "user_id": user_id,
        "user_name": user_name,
        "text": text,
        "created_at": _now(),
    }

    ref = db.collection("reports").document(report_id).collection("comments").add(comment_data)
    comment_data["id"] = ref[1].id

    report = db.collection("reports").document(report_id).get().to_dict()
    if report and report.get("user_id") != user_id:
        db.collection("notifications").add({
            "user_id": report["user_id"],
            "type": "comment",
            "title": "New Comment",
            "message": f"{user_name} commented on your report",
            "read": False,
            "report_id": report_id,
            "created_at": _now(),
        })

    return comment_data


async def get_report(report_id: str) -> Optional[Dict]:
    if not db:
        return None

    doc = db.collection("reports").document(report_id).get()
    if doc.exists:
        return {"id": doc.id, **doc.to_dict()}
    return None


async def get_user_reports(user_id: str) -> list:
    if not db:
        return []

    docs = db.collection("reports").where("user_id", "==", user_id).get()
    return [{"id": d.id, **d.to_dict()} for d in docs]


async def get_reports_by_status(status: str, limit: int = 50) -> list:
    if not db:
        return []

    docs = db.collection("reports").where("status", "==", status).limit(limit).get()
    return [{"id": d.id, **d.to_dict()} for d in docs]


async def _send_nearby_notifications(report: Dict):
    if not db:
        return

    lat = report.get("latitude", 0)
    lng = report.get("longitude", 0)

    volunteers = db.collection("users").where("role", "in", ["volunteer", "admin"]).get()

    for vol in volunteers:
        vol_data = vol.to_dict()
        vol_lat = vol_data.get("area_lat")
        vol_lng = vol_data.get("area_lng")

        if vol_lat and vol_lng:
            distance = _haversine(lat, lng, vol_lat, vol_lng)
            radius = vol_data.get("area_radius_km", 5)

            if distance <= radius:
                db.collection("notifications").add({
                    "user_id": vol.id,
                    "type": "nearby_report",
                    "title": "New Issue Nearby",
                    "message": f"A new issue reported near you: {report.get('description', '')[:50]}",
                    "read": False,
                    "report_id": report.get("id"),
                    "created_at": _now(),
                })


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    import math
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _now():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


def _increment(value: int):
    from firebase_admin import firestore
    return firestore.Increment(value)
