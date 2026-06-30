from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import os
import logging
import firebase_admin
from firebase_admin import firestore

try:
    import google.cloud.logging
    google.cloud.logging.Client().setup_logging()
    cloud_logging = True
except Exception:
    cloud_logging = False

logger = logging.getLogger("vision-ai")

from models.schemas import (
    AnalyzeResponse,
    ChatRequest,
    ChatResponse,
    VoiceResponse,
    DetectionResult,
    GeminiAnalysis,
    ProgressSummaryRequest,
    ProgressSummaryResponse,
)
from services.yolo_service import detect_issues
from services.gemini_service import analyze_with_gemini, chat_with_gemini, detect_duplicates, generate_progress_summary

app = FastAPI(title="Vision AI Backend", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = None
if firebase_admin._apps:
    db = firestore.client()
    logger.info("Firebase initialized successfully")
else:
    logger.warning("Firebase not initialized")

whisper_model = None


def get_whisper_model():
    global whisper_model
    if whisper_model is None:
        try:
            import whisper
            whisper_model = whisper.load_model("base")
            logger.info("Whisper model loaded")
        except Exception as e:
            logger.error(f"Failed to load Whisper: {e}")
    return whisper_model


@app.get("/health")
async def health():
    return {"status": "ok", "firebase": db is not None, "cloud_logging": cloud_logging}


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_report(
    description: str = Form(...),
    lat: str = Form(...),
    lng: str = Form(...),
    image: UploadFile = File(None),
):
    try:
        pil_image = None
        yolo_results = []

        if image:
            image_bytes = await image.read()
            pil_image = Image.open(io.BytesIO(image_bytes))
            yolo_results = detect_issues(pil_image)
            logger.info(f"YOLO detected {len(yolo_results)} issues")

        location = f"Latitude: {lat}, Longitude: {lng}"
        gemini_result = analyze_with_gemini(pil_image, yolo_results, description, location)

        duplicate_found = False
        duplicate_report_id = None

        if db:
            existing = []
            docs = db.collection("reports").limit(20).stream()
            for doc in docs:
                existing.append({"id": doc.id, **doc.to_dict()})

            dup_id = detect_duplicates(description, location, existing)
            if dup_id:
                duplicate_found = True
                duplicate_report_id = dup_id
                logger.info(f"Duplicate detected: {dup_id}")

        return AnalyzeResponse(
            yoloResults=[DetectionResult(**r) for r in yolo_results],
            geminiAnalysis=GeminiAnalysis(**gemini_result),
            duplicateFound=duplicate_found,
            duplicateReportId=duplicate_report_id,
        )
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        response = chat_with_gemini(request.message, request.context)
        return ChatResponse(response=response)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/voice", response_model=VoiceResponse)
async def transcribe_voice(audio: UploadFile = File(...)):
    try:
        audio_bytes = await audio.read()

        model = get_whisper_model()
        if model is None:
            return VoiceResponse(text="Voice transcription is loading. Please try again in a moment.")

        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            result = model.transcribe(tmp_path)
            text = result.get("text", "")
            logger.info(f"Whisper transcribed: {text[:50]}...")
            return VoiceResponse(text=text)
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        logger.error(f"Voice transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/summary", response_model=ProgressSummaryResponse)
async def generate_summary(request: ProgressSummaryRequest):
    try:
        summary = generate_progress_summary(
            request.report_id,
            request.title,
            request.status,
            request.department,
            request.comments,
        )
        return ProgressSummaryResponse(summary=summary)
    except Exception as e:
        logger.error(f"Summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics")
async def get_analytics():
    if not db:
        return {"totalReports": 0, "resolvedReports": 0, "pendingReports": 0}

    reports_ref = db.collection("reports")
    total = len(list(reports_ref.stream()))
    resolved = len(list(reports_ref.where("status", "==", "resolved").stream()))
    pending = len(list(reports_ref.where("status", "==", "reported").stream()))

    return {
        "totalReports": total,
        "resolvedReports": resolved,
        "pendingReports": pending,
    }


@app.get("/api/heatmap")
async def get_heatmap_data():
    if not db:
        return {"points": []}

    points = []
    docs = db.collection("reports").stream()
    for doc in docs:
        data = doc.to_dict()
        if "latitude" in data and "longitude" in data:
            points.append({
                "lat": data["latitude"],
                "lng": data["longitude"],
                "intensity": 1,
            })

    return {"points": points}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
