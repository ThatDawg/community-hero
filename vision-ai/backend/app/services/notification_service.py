from app.database.firebase import db
from typing import Dict, Optional
import logging

logger = logging.getLogger("vision-ai")


async def send_notification(
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    report_id: Optional[str] = None,
) -> Dict:
    if not db:
        return {}

    notification_data = {
        "user_id": user_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "read": False,
        "report_id": report_id,
        "created_at": _now(),
    }

    ref = db.collection("notifications").add(notification_data)
    notification_data["id"] = ref[1].id
    logger.info(f"Notification sent to {user_id}: {title}")
    return notification_data


async def get_user_notifications(user_id: str, limit: int = 50) -> list:
    if not db:
        return []

    docs = db.collection("notifications").where("user_id", "==", user_id).limit(limit).get()
    return [{"id": d.id, **d.to_dict()} for d in docs]


async def mark_as_read(notification_id: str) -> bool:
    if not db:
        return False

    db.collection("notifications").document(notification_id).update({"read": True})
    return True


async def mark_all_as_read(user_id: str) -> int:
    if not db:
        return 0

    docs = db.collection("notifications").where("user_id", "==", user_id).where("read", "==", False).get()
    count = 0
    for doc in docs:
        doc.reference.update({"read": True})
        count += 1

    return count


async def get_unread_count(user_id: str) -> int:
    if not db:
        return 0

    docs = db.collection("notifications").where("user_id", "==", user_id).where("read", "==", False).get()
    return len(list(docs))


def _now():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()
