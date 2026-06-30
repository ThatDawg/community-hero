"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin, Clock, ThumbsUp, Send, CheckCircle, Share2, Languages, FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/firebase-context";
import { getReport, upvoteReport } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, increment, setDoc, getDoc } from "firebase/firestore";

const LeafletMap = dynamic(() => import("@/components/leaflet-map"), { ssr: false });

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`;

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  category_label?: string;
  severity: string;
  status: string;
  department?: string;
  image_url?: string;
  latitude: number;
  longitude: number;
  address?: string;
  user_id: string;
  user_name: string;
  upvotes: number;
  verified_by?: string;
  suggested_action?: string;
  root_cause?: string;
  created_at: string;
  resolved_at?: string;
}

interface Comment {
  id: string;
  user_name: string;
  user_id: string;
  text: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  reported: "bg-blue-100 text-blue-700",
  verified: "bg-purple-100 text-purple-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const severityColors: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function ReportDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const reportId = searchParams.get("id");
  const [report, setReport] = useState<Report | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [upvoted, setUpvoted] = useState(false);
  const [verified, setVerified] = useState(false);
  const [translatedDesc, setTranslatedDesc] = useState("");
  const [translating, setTranslating] = useState(false);
  const [progressSummary, setProgressSummary] = useState("");
  const [generatingSummary, setGeneratingSummary] = useState(false);

  useEffect(() => {
    if (!reportId) { setLoading(false); return; }
    getReport(reportId).then((data) => {
      setReport(data as Report);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [reportId]);

  useEffect(() => {
    if (!reportId) return;
    const q = query(collection(db, "reports", reportId, "comments"), orderBy("created_at", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment)));
    });
    return unsub;
  }, [reportId]);

  const handleUpvote = async () => {
    if (upvoted || !report || !reportId) return;
    await upvoteReport(reportId);
    setUpvoted(true);
    setReport({ ...report, upvotes: (report.upvotes || 0) + 1 });
  };

  const handleVerify = async () => {
    if (!report || !user || !reportId || verified) return;
    const verifyRef = doc(db, "reports", reportId, "verifications", user.uid);
    await setDoc(verifyRef, {
      user_id: user.uid,
      user_name: user.displayName || "Anonymous",
      created_at: new Date().toISOString(),
    });

    const verSnap = await getDoc(doc(db, "reports", reportId, "verifications", "count"));
    const currentCount = verSnap.exists() ? (verSnap.data().count || 0) : 0;

    await updateDoc(doc(db, "reports", reportId), {
      verification_count: increment(1),
    });

    if (currentCount >= 2) {
      await updateDoc(doc(db, "reports", reportId), { status: "verified" });
      setReport({ ...report, status: "verified" });
    }

    setVerified(true);

    await addDoc(collection(db, "notifications"), {
      user_id: report.user_id,
      type: "verification",
      title: "Report Verified",
      message: `${user.displayName || "A citizen"} verified your report: ${report.title}`,
      read: false,
      report_id: reportId,
      created_at: new Date().toISOString(),
    });
  };

  const handleComment = async () => {
    if (!newComment.trim() || !user || !reportId) return;
    await addDoc(collection(db, "reports", reportId, "comments"), {
      user_id: user.uid,
      user_name: user.displayName || "Anonymous",
      text: newComment,
      created_at: new Date().toISOString(),
    });

    if (report && report.user_id !== user.uid) {
      await addDoc(collection(db, "notifications"), {
        user_id: report.user_id,
        type: "comment",
        title: "New Comment",
        message: `${user.displayName || "Someone"} commented on your report: ${report.title}`,
        read: false,
        report_id: reportId,
        created_at: new Date().toISOString(),
      });
    }
    setNewComment("");
  };

  const handleTranslate = async () => {
    if (!report) return;
    setTranslating(true);
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Translate the following civic issue report to Hindi, Spanish, and French. Provide all three translations separated by "---":\n\nTitle: ${report.title}\nDescription: ${report.description}` }] }],
        }),
      });
      const data = await response.json();
      setTranslatedDesc(data.candidates?.[0]?.content?.parts?.[0]?.text || "Translation unavailable");
    } catch {
      setTranslatedDesc("Translation service unavailable");
    }
    setTranslating(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: report?.title, text: report?.description, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleGenerateSummary = async () => {
    if (!report) return;
    setGeneratingSummary(true);
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate a professional progress summary for this civic issue report for government officials:\n\nReport ID: ${report.id}\nTitle: ${report.title}\nStatus: ${report.status}\nDepartment: ${report.department || "Unassigned"}\nComments: ${comments.map((c) => c.text).join("; ") || "None"}\n\nProvide a brief, professional summary covering: current status, next steps, department action required, estimated timeline, any risks.` }] }],
        }),
      });
      const data = await response.json();
      setProgressSummary(data.candidates?.[0]?.content?.parts?.[0]?.text || "Summary generation failed");
    } catch {
      setProgressSummary("Summary generation failed. Please try again.");
    }
    setGeneratingSummary(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Report not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    );
  }

  const timeSinceReport = report.created_at
    ? Math.floor((Date.now() - new Date(report.created_at).getTime()) / 3600000)
    : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1" /> Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleTranslate} disabled={translating}>
            <Languages className="h-4 w-4 mr-1" /> {translating ? "Translating..." : "Translate"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{report.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Reported by {report.user_name}</p>
              {timeSinceReport > 0 && (
                <p className="text-xs text-muted-foreground">Reported {timeSinceReport}h ago</p>
              )}
            </div>
            <div className="flex gap-2">
              <Badge className={severityColors[report.severity]}>{report.severity?.toUpperCase()}</Badge>
              <Badge className={statusColors[report.status]}>{report.status?.replace("_", " ")}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.image_url && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={report.image_url} alt="Issue" className="w-full rounded-lg max-h-96 object-cover" />
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-black/50 text-white border-0">YOLO Detection</Badge>
              </div>
            </div>
          )}

          <p className="text-muted-foreground">{report.description}</p>

          {translatedDesc && (
            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950 whitespace-pre-wrap">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">Translations</p>
              <p className="text-sm text-green-700 dark:text-green-300">{translatedDesc}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{report.category_label || report.category}</Badge>
            {report.department && <Badge variant="outline">{report.department}</Badge>}
          </div>

          {report.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {report.address}
            </div>
          )}

          {report.latitude && report.longitude && (
            <div className="rounded-lg overflow-hidden border">
              <LeafletMap
                reports={[{
                  id: report.id,
                  lat: report.latitude,
                  lng: report.longitude,
                  category: report.category,
                  severity: report.severity,
                  title: report.title,
                  status: report.status,
                  address: report.address || "",
                }]}
                center={[report.latitude, report.longitude]}
                zoom={15}
                height="200px"
              />
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" /> {report.created_at ? new Date(report.created_at).toLocaleString() : "Unknown"}
          </div>

          {report.suggested_action && (
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Suggested Action</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">{report.suggested_action}</p>
            </div>
          )}

          {report.root_cause && (
            <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-950">
              <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Root Cause Analysis</p>
              <p className="text-sm text-purple-700 dark:text-purple-300">{report.root_cause}</p>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <Button variant={upvoted ? "default" : "outline"} onClick={handleUpvote} disabled={upvoted}>
              <ThumbsUp className="mr-2 h-4 w-4" /> {report.upvotes || 0} Upvotes
            </Button>
            {user && user.uid !== report.user_id && report.status === "reported" && (
              <Button variant={verified ? "default" : "outline"} onClick={handleVerify} disabled={verified}>
                <CheckCircle className="mr-2 h-4 w-4" /> {verified ? "Verified" : "Verify Issue"}
              </Button>
            )}
            <Button variant="outline" onClick={handleGenerateSummary} disabled={generatingSummary}>
              {generatingSummary ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              {generatingSummary ? "Generating..." : "AI Summary"}
            </Button>
          </div>

          {progressSummary && (
            <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-950 whitespace-pre-wrap">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1">Official Progress Summary</p>
              <p className="text-sm text-orange-700 dark:text-orange-300">{progressSummary}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comments ({comments.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="border-b pb-3 last:border-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{c.user_name}</span>
                <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{c.text}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
          )}

          {user && (
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button onClick={handleComment} disabled={!newComment.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
