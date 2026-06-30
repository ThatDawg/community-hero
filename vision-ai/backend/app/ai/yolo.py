from ultralytics import YOLO
from PIL import Image
from typing import List, Dict
from app.utils.config import YOLO_MODEL_PATH
import os

CIVIC_CATEGORIES = {
    0: {"name": "pothole", "severity": "high"},
    1: {"name": "garbage", "severity": "medium"},
    2: {"name": "overflowing_bin", "severity": "medium"},
    3: {"name": "broken_streetlight", "severity": "medium"},
    4: {"name": "water_leakage", "severity": "high"},
    5: {"name": "fallen_tree", "severity": "critical"},
    6: {"name": "road_crack", "severity": "medium"},
    7: {"name": "illegal_dumping", "severity": "high"},
    8: {"name": "open_manhole", "severity": "critical"},
}

model = None


def get_model():
    global model
    if model is None:
        if os.path.exists(YOLO_MODEL_PATH):
            model = YOLO(YOLO_MODEL_PATH)
        else:
            model = YOLO("yolov8n.pt")
    return model


def detect_issues(image: Image.Image) -> List[Dict]:
    mdl = get_model()
    results = mdl(image)
    detections = []

    for result in results:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            confidence = float(box.conf[0])
            bbox = box.xyxy[0].tolist()

            if cls_id in CIVIC_CATEGORIES:
                cat_info = CIVIC_CATEGORIES[cls_id]
            else:
                cat_info = {"name": "unknown", "severity": "low"}

            detections.append({
                "category": cat_info["name"],
                "confidence": round(confidence, 3),
                "bbox": bbox,
                "severity": cat_info["severity"],
            })

    return detections
