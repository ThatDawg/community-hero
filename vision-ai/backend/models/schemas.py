from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ReportStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    REJECTED = "rejected"


class DetectionResult(BaseModel):
    category: str
    confidence: float
    bbox: List[float]
    severity: str


class GeminiAnalysis(BaseModel):
    title: str
    description: str
    department: str
    priority: str
    estimatedResolution: str
    suggestedAction: str
    citizenSummary: str
    rootCause: str


class AnalyzeRequest(BaseModel):
    description: str
    lat: float
    lng: float


class AnalyzeResponse(BaseModel):
    yoloResults: List[DetectionResult]
    geminiAnalysis: GeminiAnalysis
    duplicateFound: bool
    duplicateReportId: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None


class ChatResponse(BaseModel):
    response: str


class VoiceResponse(BaseModel):
    text: str
