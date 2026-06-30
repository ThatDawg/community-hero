"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, MapPin, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/firebase-context";
import { useRouter } from "next/navigation";
import { createReport } from "@/lib/firestore";

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are Vision AI, an AI assistant for reporting civic issues. When a user describes an issue, respond with ONLY a JSON object:
{
  "category": "pothole|water_leak|streetlight|waste|flooding|tree|road_crack|other",
  "category_label": "Human-readable category name",
  "severity": "low|medium|high|critical",
  "department": "correct municipal department",
  "title": "Brief issue title",
  "summary": "One sentence summary",
  "suggested_action": "Recommended immediate action"
}
Severity: critical=danger to life, high=significant disruption, medium=moderate inconvenience, low=cosmetic
Department: pothole→Public Works, water_leak→Water Supply, streetlight→Electricity Board, waste→Sanitation, flooding→Drainage, tree→Parks`;

interface AIResult {
  category: string;
  category_label: string;
  severity: string;
  department: string;
  title: string;
  summary: string;
  suggested_action: string;
}

export default function ReportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setAddress(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => {
          setLocation({ lat: 28.6139, lng: 77.209 });
          setAddress("New Delhi, India (default)");
        }
      );
    }
  };

  const handleAnalyze = async () => {
    if (!description.trim()) return;
    setAnalyzing(true);
    setError("");
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${description}` }] }],
        }),
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setAiResult(JSON.parse(jsonMatch[0]));
      } else {
        setAiResult({
          category: "other",
          category_label: "General Issue",
          severity: "medium",
          department: "General Administration",
          title: "Civic Issue Report",
          summary: description,
          suggested_action: "Inspection required",
        });
      }
    } catch {
      setError("AI analysis failed. You can still submit manually.");
    }
    setAnalyzing(false);
  };

  const handleSubmit = async () => {
    if (!description.trim() || !location || !user) return;
    setSubmitting(true);
    setError("");
    try {
      let imageUrl = null;
      if (image) {
        imageUrl = imagePreview;
      }

      await createReport({
        title: aiResult?.title || description.slice(0, 50),
        description,
        category: aiResult?.category || "other",
        category_label: aiResult?.category_label || "General Issue",
        severity: aiResult?.severity || "medium",
        department: aiResult?.department || "General Administration",
        status: "reported",
        image_url: imageUrl,
        latitude: location.lat,
        longitude: location.lng,
        address,
        user_id: user.uid,
        user_name: user.displayName || "Anonymous",
        user_photo: user.photoURL || "",
        suggested_action: aiResult?.suggested_action || "",
      });
      setSubmitted(true);
    } catch {
      setError("Failed to submit. Please try again.");
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-4 text-xl font-bold">Report Submitted!</h2>
            <p className="mt-2 text-muted-foreground">
              Your civic issue report has been submitted. The AI has categorized it and routed it to the correct department.
            </p>
            <Button className="mt-6" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Report a Civic Issue</h1>
        <p className="text-muted-foreground">
          Describe the issue, upload a photo, and let AI categorize and route it
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Image (Optional)</CardTitle>
            <CardDescription>Upload a photo of the issue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer hover:bg-accent"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="Preview" className="max-h-64 rounded-lg object-cover" />
              ) : (
                <>
                  <Camera className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Click to upload</p>
                </>
              )}
            </div>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageChange}
            />
            <Button variant="outline" className="w-full" onClick={getLocation}>
              <MapPin className="mr-2 h-4 w-4" />
              {location ? "Location Set" : "Get Current Location"}
            </Button>
            {location && <p className="text-xs text-muted-foreground text-center">{address}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issue Details</CardTitle>
            <CardDescription>Describe what you see</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="e.g., Large pothole on Main Street near the school gate..."
                rows={5}
                value={description}
                onChange={(e) => { setDescription(e.target.value); setAiResult(null); }}
              />
            </div>

            <Button
              className="w-full"
              variant="outline"
              onClick={handleAnalyze}
              disabled={!description.trim() || analyzing}
            >
              {analyzing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
              ) : (
                <><AlertTriangle className="mr-2 h-4 w-4" />AI Categorize</>
              )}
            </Button>

            {aiResult && (
              <div className="rounded-lg bg-blue-50 p-4 space-y-2 dark:bg-blue-950">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Category: <span className="font-bold">{aiResult.category_label}</span>
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Severity: <span className="font-bold uppercase">{aiResult.severity}</span>
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Route to: <span className="font-bold">{aiResult.department}</span>
                </p>
                {aiResult.suggested_action && (
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Action: <span className="font-bold">{aiResult.suggested_action}</span>
                  </p>
                )}
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={!description.trim() || !location || submitting}
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
              ) : "Submit Report"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
