import firebase_admin
from firebase_admin import credentials, firestore, storage
from app.utils.config import FIREBASE_CREDENTIALS, FIREBASE_STORAGE_BUCKET
import json
import os

cred = None
db = None
bucket = None

credentials_json = os.getenv("FIREBASE_CREDENTIALS_JSON")

if credentials_json:
    cred = credentials.Certificate(json.loads(credentials_json))
    firebase_admin.initialize_app(cred, {
        "storageBucket": FIREBASE_STORAGE_BUCKET
    })
    db = firestore.client()
    try:
        bucket = storage.bucket()
    except Exception:
        pass
elif os.path.exists(FIREBASE_CREDENTIALS):
    cred = credentials.Certificate(FIREBASE_CREDENTIALS)
    firebase_admin.initialize_app(cred, {
        "storageBucket": FIREBASE_STORAGE_BUCKET
    })
    db = firestore.client()
    try:
        bucket = storage.bucket()
    except Exception:
        pass
