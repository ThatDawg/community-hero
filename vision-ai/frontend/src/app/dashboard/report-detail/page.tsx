"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin, Clock, ThumbsUp, Send, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/firebase-context";
import { getReport, upvoteReport } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";

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
  suggested_action?: string;
  created_at: string;
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
    if (!report || !user || !reportId) return;
    await updateDoc(doc(db, "reports", reportId), { status: "verified", verified_by: user.uid });
    setReport({ ...report, status: "verified" });
  };

  const handleComment = async () => {
    if (!newComment.trim() || !user || !reportId) return;
    await addDoc(collection(db, "reports", reportId, "comments"), {
      user_id: user.uid,
      user_name: user.displayName || "Anonymous",
      text: newComment,
      created_at: new Date().toISOString(),
    });
    setNewComment("");
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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{report.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{report.user_name}</p>
            </div>
            <div className="flex gap-2">
              <Badge className={severityColors[report.severity]}>{report.severity?.toUpperCase()}</Badge>
              <Badge className={statusColors[report.status]}>{report.status?.replace("_", " ")}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={report.image_url} alt="Issue" className="w-full rounded-lg max-h-96 object-cover" />
          )}

          <p className="text-muted-foreground">{report.description}</p>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{report.category_label || report.category}</Badge>
            {report.department && <Badge variant="outline">{report.department}</Badge>}
          </div>

          {report.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {report.address}
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

          <div className="flex gap-3">
            <Button variant={upvoted ? "default" : "outline"} onClick={handleUpvote} disabled={upvoted}>
              <ThumbsUp className="mr-2 h-4 w-4" /> {report.upvotes || 0} Upvotes
            </Button>
            {user && user.uid !== report.user_id && report.status === "reported" && (
              <Button variant="outline" onClick={handleVerify}>
                <CheckCircle className="mr-2 h-4 w-4" /> Verify Issue
              </Button>
            )}
          </div>
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
