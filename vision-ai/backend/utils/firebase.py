import firebase_admin
from firebase_admin import credentials, firestore, storage
from utils.config import FIREBASE_CREDENTIALS
import os

cred = None
if os.path.exists(FIREBASE_CREDENTIALS):
    cred = credentials.Certificate(FIREBASE_CREDENTIALS)
    firebase_admin.initialize_app(cred, {
        "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET", "")
    })

db = firestore.client()
bucket = storage.bucket() if firebase_admin._DEFAULT_APP_NAME in firebase_admin._apps else None
