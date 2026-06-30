from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ReportStatus(str, Enum):
    REPORTED = "reported"
    VERIFIED = "verified"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    REJECTED = "rejected"


class UserRole(str, Enum):
    CITIZEN = "citizen"
    VOLUNTEER = "volunteer"
    OFFICIAL = "official"
    ADMIN = "admin"


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
    estimatedRepairCost: str = "Not available"
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


class ProgressSummaryRequest(BaseModel):
    report_id: str
    title: str
    status: str
    department: str
    comments: List[str] = []


class ProgressSummaryResponse(BaseModel):
    summary: str


class LeaderboardEntry(BaseModel):
    user_id: str
    user_name: str
    reports_count: int
    resolved_count: int
    points: int
    rank: int


class VolunteerProfile(BaseModel):
    user_id: str
    user_name: str
    specialties: List[str] = []
    reports_verified: int = 0
    reports_resolved: int = 0
    available: bool = True
    area_lat: Optional[float] = None
    area_lng: Optional[float] = None
    area_radius_km: float = 5.0
