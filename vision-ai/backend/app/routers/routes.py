from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from PIL import Image
import io
import os
import logging

from app.schemas.models import (
    AnalyzeResponse,
    ChatRequest,
    ChatResponse,
    VoiceResponse,
    DetectionResult,
    GeminiAnalysis,
    ProgressSummaryRequest,
    ProgressSummaryResponse,
)
from app.ai.yolo import detect_issues
from app.ai.gemini import analyze_with_gemini, chat_with_gemini, detect_duplicates, generate_progress_summary
from app.database.firebase import db

logger = logging.getLogger("vision-ai")
router = APIRouter()

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


@router.get("/health")
async def health():
    return {"status": "ok", "firebase": db is not None}


@router.post("/api/analyze", response_model=AnalyzeResponse)
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


@router.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        response = chat_with_gemini(request.message, request.context)
        return ChatResponse(response=response)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/voice", response_model=VoiceResponse)
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


@router.post("/api/summary", response_model=ProgressSummaryResponse)
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


@router.get("/api/analytics")
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


@router.get("/api/heatmap")
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
