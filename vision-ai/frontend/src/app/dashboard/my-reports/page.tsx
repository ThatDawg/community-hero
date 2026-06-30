"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase-context";
import { getUserReports, upvoteReport } from "@/lib/firestore";

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  category_label?: string;
  severity: string;
  status: string;
  image_url?: string;
  address?: string;
  latitude: number;
  longitude: number;
  upvotes: number;
  user_id: string;
  created_at: string;
  resolved_at?: string;
}

const getUpvoted = (): string[] => {
  try { return JSON.parse(localStorage.getItem("upvoted_reports") || "[]"); } catch { return []; }
};
const setUpvoted = (id: string) => {
  const list = getUpvoted();
  if (!list.includes(id)) { list.push(id); localStorage.setItem("upvoted_reports", JSON.stringify(list)); }
};

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

const categoryIcons: Record<string, string> = {
  pothole: "🕳️", water_leak: "💧", streetlight: "💡", waste: "🗑️",
  flooding: "🌊", tree: "🌳", road_crack: "🛣️", other: "📍",
};

export default function MyReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [upvotedIds, setUpvotedIds] = useState<string[]>(getUpvoted());

  useEffect(() => {
    if (user) {
      getUserReports(user.uid)
        .then((data) => { setReports(data as Report[]); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [user]);

  const filteredReports =
    filter === "all" ? reports : reports.filter((r) => r.status === filter);

  const handleUpvote = async (id: string) => {
    if (upvotedIds.includes(id)) return;
    await upvoteReport(id);
    setUpvoted(id);
    setUpvotedIds(getUpvoted());
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Reports</h1>
        <p className="text-muted-foreground">Track and manage your civic issue reports</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "reported", "verified", "in_progress", "resolved"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {f === "all" ? "All" : f.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{filteredReports.length} reports</p>

      <div className="space-y-3">
        {filteredReports.map((report) => (
          <Link key={report.id} href={`/dashboard/report-detail?id=${report.id}`}>
            <div className="bg-white rounded-xl border p-4 hover:shadow-md transition cursor-pointer">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{categoryIcons[report.category] || "📍"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{report.title || report.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">{report.category_label || report.category}</Badge>
                  <Badge className={severityColors[report.severity]}>{report.severity?.toUpperCase()}</Badge>
                  <Badge className={statusColors[report.status]}>{report.status?.replace("_", " ")}</Badge>
                  {report.resolved_at && (
                    <span className="text-xs text-green-600">
                      Resolved {new Date(report.resolved_at).toLocaleDateString()}
                    </span>
                  )}
                  {report.address && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{report.address}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUpvote(report.id); }}
                disabled={upvotedIds.includes(report.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition ${
                  upvotedIds.includes(report.id) ? "bg-primary/10 cursor-default" : "hover:bg-muted cursor-pointer"
                }`}
              >
                <ThumbsUp className={`h-4 w-4 ${upvotedIds.includes(report.id) ? "text-primary" : ""}`} />
                <span className="text-xs font-medium">{report.upvotes || 0}</span>
              </button>
            </div>
          </div>
          </Link>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No reports found</h3>
            <p className="mt-2 text-muted-foreground">
              {filter === "all" ? "You haven't submitted any reports yet." : "No reports match this filter."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
