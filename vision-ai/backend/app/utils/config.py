import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
FIREBASE_CREDENTIALS = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")
YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "yolo-models/civic_issues.pt")
FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "")
