from app.database.firebase import db
from typing import Dict, Optional
import logging

logger = logging.getLogger("vision-ai")


async def get_verification_status(report_id: str) -> Dict:
    if not db:
        return {"count": 0, "verified": False, "users": []}

    verifications = db.collection("reports").document(report_id).collection("verifications").get()
    users = [{"user_id": v.to_dict().get("user_id"), "user_name": v.to_dict().get("user_name")} for v in verifications]
    count = len(users)

    return {
        "count": count,
        "verified": count >= 3,
        "threshold": 3,
        "users": users,
    }


async def can_verify(report_id: str, user_id: str) -> bool:
    if not db:
        return False

    existing = db.collection("reports").document(report_id).collection("verifications").where("user_id", "==", user_id).get()
    return len(list(existing)) == 0


async def get_volunteer_stats(user_id: str) -> Dict:
    if not db:
        return {"verified": 0, "resolved": 0, "assigned": 0}

    verified = len(list(
        db.collection("reports").where("assigned_volunteer", "==", user_id).where("status", "==", "verified").get()
    ))
    resolved = len(list(
        db.collection("reports").where("assigned_volunteer", "==", user_id).where("status", "==", "resolved").get()
    ))
    assigned = len(list(
        db.collection("reports").where("assigned_volunteer", "==", user_id).where("status", "in", ["in_progress", "verified"]).get()
    ))

    return {
        "verified": verified,
        "resolved": resolved,
        "assigned": assigned,
    }


async def assign_volunteer(report_id: str, volunteer_id: str) -> bool:
    if not db:
        return False

    db.collection("reports").document(report_id).update({
        "assigned_volunteer": volunteer_id,
        "status": "in_progress",
    })

    db.collection("users").document(volunteer_id).update({"reports_verified": _increment(1)})
    logger.info(f"Report {report_id} assigned to volunteer {volunteer_id}")
    return True


def _increment(value: int):
    from firebase_admin import firestore
    return firestore.Increment(value)
