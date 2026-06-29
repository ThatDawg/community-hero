const API_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

export interface DetectionResult {
  category: string;
  confidence: number;
  bbox: number[];
  severity: string;
}

export interface GeminiResult {
  title: string;
  description: string;
  department: string;
  priority: string;
  estimatedResolution: string;
  suggestedAction: string;
  citizenSummary: string;
  rootCause: string;
}

export interface AnalyzeResponse {
  yoloResults: DetectionResult[];
  geminiAnalysis: GeminiResult;
  duplicateFound: boolean;
  duplicateReportId?: string;
}

export async function analyzeReport(
  imageFile: File,
  description: string,
  location: { lat: number; lng: number }
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("description", description);
  formData.append("lat", location.lat.toString());
  formData.append("lng", location.lng.toString());

  const res = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Analysis failed");
  return res.json();
}

export async function chatWithAI(message: string, context?: string) {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, context }),
  });

  if (!res.ok) throw new Error("Chat failed");
  return res.json();
}

export async function transcribeVoice(audioBlob: Blob) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const res = await fetch(`${API_URL}/api/voice`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Transcription failed");
  return res.json();
}

export async function getAnalytics() {
  const res = await fetch(`${API_URL}/api/analytics`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export async function getHeatmapData() {
  const res = await fetch(`${API_URL}/api/heatmap`);
  if (!res.ok) throw new Error("Failed to fetch heatmap data");
  return res.json();
}
