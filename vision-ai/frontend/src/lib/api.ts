const API_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");

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
  estimatedRepairCost?: string;
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
  imageFile: File | null,
  description: string,
  location: { lat: number; lng: number }
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  if (imageFile) {
    formData.append("image", imageFile);
  }
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

export async function generateAIText(message: string, systemPrompt?: string) {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, system_prompt: systemPrompt }),
  });

  if (!res.ok) throw new Error("AI request failed");
  const data = await res.json();
  return data.response as string;
}

export async function generateProgressSummary(
  reportId: string,
  title: string,
  status: string,
  department: string,
  comments: string[]
) {
  const res = await fetch(`${API_URL}/api/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      report_id: reportId,
      title,
      status,
      department,
      comments,
    }),
  });

  if (!res.ok) throw new Error("Summary failed");
  const data = await res.json();
  return data.summary as string;
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
