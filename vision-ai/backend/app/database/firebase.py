import firebase_admin
from firebase_admin import credentials, firestore, storage
from app.utils.config import FIREBASE_CREDENTIALS, FIREBASE_STORAGE_BUCKET
import os

cred = None
db = None
bucket = None

if os.path.exists(FIREBASE_CREDENTIALS):
    cred = credentials.Certificate(FIREBASE_CREDENTIALS)
    firebase_admin.initialize_app(cred, {
        "storageBucket": FIREBASE_STORAGE_BUCKET
    })
    db = firestore.client()
    try:
        bucket = storage.bucket()
    except Exception:
        pass
