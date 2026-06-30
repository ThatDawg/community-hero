from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import os
import firebase_admin
from firebase_admin import firestore

from models.schemas import (
    AnalyzeResponse,
    ChatRequest,
    ChatResponse,
    VoiceResponse,
    DetectionResult,
    GeminiAnalysis,
)
from services.yolo_service import detect_issues
from services.gemini_service import analyze_with_gemini, chat_with_gemini, detect_duplicates

app = FastAPI(title="Vision AI Backend", version="1.0.0")

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


@app.get("/health")
async def health():
    return {"status": "ok", "firebase": db is not None}


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

        return AnalyzeResponse(
            yoloResults=[DetectionResult(**r) for r in yolo_results],
            geminiAnalysis=GeminiAnalysis(**gemini_result),
            duplicateFound=duplicate_found,
            duplicateReportId=duplicate_report_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        response = chat_with_gemini(request.message, request.context)
        return ChatResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/voice", response_model=VoiceResponse)
async def transcribe_voice(audio: UploadFile = File(...)):
    try:
        audio_bytes = await audio.read()
        text = "Voice transcription would happen here with Whisper API"
        return VoiceResponse(text=text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics")
async def get_analytics():
    if not db:
        return {"totalReports": 0, "resolvedReports": 0, "pendingReports": 0}

    reports_ref = db.collection("reports")
    total = len(list(reports_ref.stream()))
    resolved = len(list(reports_ref.where("status", "==", "resolved").stream()))
    pending = len(list(reports_ref.where("status", "==", "pending").stream()))

    return {
        "totalReports": total,
        "resolvedReports": resolved,
        "pendingReports": pending,
        "averageResolutionTime": "3.2 days",
    }


@app.get("/api/heatmap")
async def get_heatmap_data():
    if not db:
        return {"points": []}

    points = []
    docs = db.collection("reports").stream()
    for doc in docs:
        data = doc.to_dict()
        if "location" in data:
            loc = data["location"]
            points.append({
                "lat": loc.latitude,
                "lng": loc.longitude,
                "intensity": 1,
            })

    return {"points": points}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
