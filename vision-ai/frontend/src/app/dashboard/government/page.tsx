"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { Shield, Download, Merge, Bell, RefreshCw, Trash2, Archive, RotateCcw, Users, Brain, MapPin, Edit } from "lucide-react";
import { getAllReports } from "@/lib/firestore";
import { generateAIText } from "@/lib/api";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/firebase-context";
import { collection, addDoc, doc, updateDoc, getDocs, getDoc, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import ConfirmDialog from "@/components/confirm-dialog";
import { toast } from "sonner";

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  category_label?: string;
  severity: string;
  priority?: string;
  status: string;
  department?: string;
  ward?: string;
  assigned_team?: string;
  latitude: number;
  longitude: number;
  address?: string;
  user_name: string;
  user_id: string;
  created_at: string;
  resolved_at?: string;
  archived?: boolean;
  deleted?: boolean;
  photos_before?: string[];
  photos_after?: string[];
}

const COLORS = ["#f97316", "#eab308", "#3b82f6", "#06b6d4", "#22c55e", "#a855f7", "#ef4444", "#ec4899", "#6366f1"];

const statusColors: Record<string, string> = {
  reported: "bg-blue-100 text-blue-700",
  verified: "bg-purple-100 text-purple-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
};

const priorities = ["low", "medium", "high", "critical"];
const DEPARTMENTS = ["Public Works", "Sanitation", "Electrical", "Water Supply", "Parks", "Traffic", "Drainage", "General Administration"];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.min(
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2),
    1
  );
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function GovernmentPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [generatingReport, setGeneratingReport] = useState(false);
  const [userRole, setUserRole] = useState("citizen");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState("");
  const [merging, setMerging] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [selectedReportId, setSelectedReportId] = useState("");
  const [assignTeamId, setAssignTeamId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [aiInsights, setAiInsights] = useState("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [broadcastScope, setBroadcastScope] = useState<"all" | "nearby" | "reporters">("all");
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiveTargetId, setArchiveTargetId] = useState("");
  const [resolvingId, setResolvingId] = useState("");
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editTargetId, setEditTargetId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const isAdmin = userRole === "admin";

  useEffect(() => {
    getAllReports().then((data) => {
      setReports(data as Report[]);
      setLoading(false);
    }).catch(() => setLoading(false));
    if (user) {
      getDoc(doc(db, "users", user.uid)).then((snap) => {
        if (snap.exists()) setUserRole(snap.data().role || "citizen");
      });
    }
  }, [user]);

  const activeReports = reports.filter((r) => !r.archived && !r.deleted);
  const total = activeReports.length;
  const resolved = activeReports.filter((r) => r.status === "resolved").length;
  const pending = activeReports.filter((r) => r.status === "reported" || r.status === "verified" || r.status === "pending").length;
  const inProgress = activeReports.filter((r) => r.status === "in_progress").length;
  const critical = activeReports.filter((r) => r.severity === "critical").length;

  const resolutionTimes = activeReports
    .filter((r) => r.resolved_at && r.created_at)
    .map((r) => (new Date(r.resolved_at!).getTime() - new Date(r.created_at).getTime()) / 3600000);
  const avgResolution = resolutionTimes.length > 0 ? (resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(1) : "N/A";

  const byCategory = activeReports.reduce((acc, r) => { const cat = r.category_label || r.category || "Other"; acc[cat] = (acc[cat] || 0) + 1; return acc; }, {} as Record<string, number>);
  const byDepartment = activeReports.reduce((acc, r) => { const dept = r.department || "Unassigned"; acc[dept] = (acc[dept] || 0) + 1; return acc; }, {} as Record<string, number>);
  const byWard = activeReports.reduce((acc, r) => { const ward = r.ward || "Unassigned"; acc[ward] = (acc[ward] || 0) + 1; return acc; }, {} as Record<string, number>);
  const byPriority = activeReports.reduce((acc, r) => { const p = r.priority || "unset"; acc[p] = (acc[p] || 0) + 1; return acc; }, {} as Record<string, number>);

  const categoryData = Object.entries(byCategory).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  const departmentData = Object.entries(byDepartment).map(([name]) => ({
    name, pending: activeReports.filter((r) => (r.department || "Unassigned") === name && r.status !== "resolved").length,
    resolved: activeReports.filter((r) => (r.department || "Unassigned") === name && r.status === "resolved").length,
  }));
  const wardData = Object.entries(byWard).map(([name, value]) => ({ name, reports: value }));
  const priorityData = Object.entries(byPriority).map(([name, value]) => ({ name, value, color: name === "critical" ? "#ef4444" : name === "high" ? "#f97316" : name === "medium" ? "#eab308" : "#22c55e" }));

  const filteredReports = statusFilter === "all" ? activeReports : activeReports.filter((r) => r.status === statusFilter);

  const generateOfficialReport = async () => {
    setGeneratingReport(true);
    const summary = `Vision AI Official Report
Generated: ${new Date().toLocaleString()}
========================================
Total Reports: ${total}
Resolved: ${resolved} (${total > 0 ? Math.round((resolved / total) * 100) : 0}%)
In Progress: ${inProgress}
Pending: ${pending}
Critical: ${critical}
Avg Resolution Time: ${avgResolution} hours

By Department:
${Object.entries(byDepartment).map(([dept, count]) => `  ${dept}: ${count} reports`).join("\n")}

By Category:
${Object.entries(byCategory).map(([cat, count]) => `  ${cat}: ${count} reports`).join("\n")}

By Ward:
${Object.entries(byWard).map(([ward, count]) => `  ${ward}: ${count} reports`).join("\n")}

Recent Reports (Top 10):
${activeReports.slice(0, 10).map((r, i) => `${i + 1}. [${r.severity.toUpperCase()}] ${r.title || r.description?.slice(0, 50)} - ${r.status} (${r.department || "Unassigned"})`).join("\n")}
`;

    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vision-ai-report-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setGeneratingReport(false);
  };

  const updateStatus = async (reportId: string, newStatus: string) => {
    const updateData: Record<string, string> = { status: newStatus };
    if (newStatus === "resolved") {
      updateData.resolved_at = new Date().toISOString();
    }
    await updateDoc(doc(db, "reports", reportId), updateData);
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, ...updateData } : r));
    toast.success("Status updated");
  };

  const updatePriority = async (reportId: string, priority: string) => {
    await updateDoc(doc(db, "reports", reportId), { priority });
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, priority } : r));
    toast.success("Priority updated");
  };

  const assignTeam = async (reportId: string) => {
    if (!teamName.trim()) return;
    await updateDoc(doc(db, "reports", reportId), { assigned_team: teamName });
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, assigned_team: teamName } : r));
    setTeamName("");
    setAssignTeamId("");
    toast.success("Team assigned");
  };

  const updateDepartment = async (reportId: string, department: string) => {
    await updateDoc(doc(db, "reports", reportId), { department });
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, department } : r));
    toast.success("Department assigned");
  };

  const handleResolveWithPhotos = async (reportId: string) => {
    setUploading(true);
    const updateData: Record<string, unknown> = {
      status: "resolved",
      resolved_at: new Date().toISOString(),
    };
    try {
      if (beforeFile) {
        const beforeRef = ref(storage, `reports/${reportId}/before_${Date.now()}`);
        await uploadBytes(beforeRef, beforeFile);
        updateData.photos_before = [await getDownloadURL(beforeRef)];
      }
      if (afterFile) {
        const afterRef = ref(storage, `reports/${reportId}/after_${Date.now()}`);
        await uploadBytes(afterRef, afterFile);
        updateData.photos_after = [await getDownloadURL(afterRef)];
      }
    } catch (e) {
      console.error("Photo upload failed:", e);
    }
    await updateDoc(doc(db, "reports", reportId), updateData);
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, ...updateData } as Report : r));
    toast.success("Report resolved with photo");
    setResolvingId("");
    setBeforeFile(null);
    setAfterFile(null);
    setUploading(false);
  };

  const handleReopen = async (reportId: string) => {
    await updateDoc(doc(db, "reports", reportId), { status: "in_progress", reopened: true, reopened_at: new Date().toISOString() });
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: "in_progress" } : r));
    toast.success("Report reopened");
  };

  const handleArchive = async () => {
    if (!archiveTargetId) return;
    await updateDoc(doc(db, "reports", archiveTargetId), { archived: true, archived_at: new Date().toISOString() });
    setReports((prev) => prev.filter((r) => r.id !== archiveTargetId));
    setShowArchiveConfirm(false);
    setArchiveTargetId("");
    toast.success("Report archived");
  };

  const handleEditReport = async () => {
    if (!editTargetId || !editTitle.trim() || !editDescription.trim()) return;
    await updateDoc(doc(db, "reports", editTargetId), { title: editTitle.trim(), description: editDescription.trim() });
    setReports((prev) => prev.map((r) => r.id === editTargetId ? { ...r, title: editTitle.trim(), description: editDescription.trim() } : r));
    setEditTargetId("");
    toast.success("Report updated");
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setBroadcasting(true);
    try {
      let usersSnap;
      if (broadcastScope === "reporters") {
        const reporterIds = [...new Set(activeReports.map((r) => r.user_id).filter(Boolean))];
        usersSnap = (await getDocs(query(collection(db, "users"), where("__name__", "in", reporterIds.slice(0, 30))))).docs;
        if (reporterIds.length > 30) {
          const extra = (await getDocs(collection(db, "users"))).docs.filter((d) => reporterIds.includes(d.id));
          usersSnap = [...new Set([...usersSnap, ...extra])];
        }
      } else if (broadcastScope === "nearby") {
        const allUsers = (await getDocs(collection(db, "users"))).docs;
        const refLat = 28.6139;
        const refLng = 77.209;
        const radiusKm = 10;
        const nearbyReporters = activeReports.filter((r) =>
          r.latitude != null && r.longitude != null &&
          haversineDistance(refLat, refLng, r.latitude, r.longitude) <= radiusKm
        );
        const nearbyIds = new Set(nearbyReporters.map((r) => r.user_id).filter(Boolean));
        usersSnap = allUsers.filter((d) => nearbyIds.has(d.id));
      } else {
        usersSnap = (await getDocs(collection(db, "users"))).docs;
      }
      const batch = [];
      for (const u of usersSnap) {
        batch.push(addDoc(collection(db, "notifications"), {
          user_id: u.id,
          type: "broadcast",
          title: "Municipal Alert",
          message: broadcastMsg,
          read: false,
          created_at: new Date().toISOString(),
        }));
      }
      await Promise.allSettled(batch);
      setBroadcastMsg("");
      toast.success(`Alert broadcast sent to ${batch.length} users`);
    } catch (e) {
      toast.error("Action failed", { description: e instanceof Error ? e.message : "Unknown error" });
      console.error("Broadcast failed:", e);
    }
    setBroadcasting(false);
  };

  const handleMerge = async () => {
    if (!selectedReportId || !mergeTargetId) return;
    setMerging(true);
    try {
      const targetComments = await getDocs(collection(db, "reports", mergeTargetId, "comments"));
      for (const c of targetComments.docs) {
        await addDoc(collection(db, "reports", selectedReportId, "comments"), c.data());
      }
      await updateDoc(doc(db, "reports", selectedReportId), { status: "resolved", merged_into: mergeTargetId });
      await updateDoc(doc(db, "reports", mergeTargetId), { merged_from: selectedReportId });
      setReports((prev) => prev.map((r) => r.id === selectedReportId ? { ...r, status: "resolved" } : r));
      toast.success("Reports merged");
    } catch (e) { toast.error("Action failed", { description: e instanceof Error ? e.message : "Unknown error" }); console.error("Merge failed:", e); }
    setMerging(false);
    setSelectedReportId("");
    setMergeTargetId("");
  };

  const handleDeleteAny = async () => {
    if (!deleteTargetId) return;
    await updateDoc(doc(db, "reports", deleteTargetId), { deleted: true, deleted_at: new Date().toISOString(), status: "cancelled" });
    setReports((prev) => prev.filter((r) => r.id !== deleteTargetId));
    setShowDeleteConfirm(false);
    setDeleteTargetId("");
    toast.success("Report deleted");
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Municipal Dashboard</h1>
            <p className="text-muted-foreground">Government oversight and report management</p>
          </div>
        </div>
        <Button variant="outline" onClick={generateOfficialReport} disabled={generatingReport}>
          <Download className="mr-2 h-4 w-4" /> {generatingReport ? "Generating..." : "Export Report"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Reports</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Resolved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{resolved}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">In Progress</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{inProgress}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Critical</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{critical}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg Resolution</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{avgResolution === "N/A" ? "N/A" : `${avgResolution}h`}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          {(isAdmin || userRole === "official") && (
            <TabsTrigger value="ai">AI Insights</TabsTrigger>
          )}
          {isAdmin && <TabsTrigger value="admin">Admin Tools</TabsTrigger>}
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader className="pb-0">
              <div className="flex gap-2 flex-wrap">
                {["all", "reported", "verified", "in_progress", "resolved"].map((f) => (
                  <button key={f} onClick={() => setStatusFilter(f)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                    {f.replace("_", " ").charAt(0).toUpperCase() + f.slice(1).replace("_", " ")}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="divide-y">
                {filteredReports.map((report) => (
                  <div key={report.id} className="p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {editTargetId === report.id ? (
                          <div className="space-y-2 mb-2">
                            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" className="font-medium" />
                            <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" rows={2} />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleEditReport} disabled={!editTitle.trim() || !editDescription.trim()}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditTargetId("")}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <p className="font-medium">{report.title || report.description?.slice(0, 50)}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary">{report.category_label || report.category}</Badge>
                          <Badge className={`${
                            report.severity === "critical" ? "bg-red-100 text-red-700" :
                            report.severity === "high" ? "bg-orange-100 text-orange-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>{report.severity}</Badge>
                          {report.priority && (
                            <Badge className={report.priority === "critical" ? "bg-red-600 text-white" : report.priority === "high" ? "bg-orange-500 text-white" : report.priority === "medium" ? "bg-yellow-500" : "bg-green-500 text-white"}>
                              {report.priority}
                            </Badge>
                          )}
                          <Badge className={statusColors[report.status] || ""}>{report.status?.replace("_", " ")}</Badge>
                          {report.department && <Badge variant="outline">{report.department}</Badge>}
                          {report.ward && <Badge variant="outline"><MapPin className="h-3 w-3 mr-1" />{report.ward}</Badge>}
                          {report.assigned_team && <Badge variant="secondary"><Users className="h-3 w-3 mr-1" />{report.assigned_team}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          By {report.user_name} {report.created_at ? `• ${new Date(report.created_at).toLocaleDateString()}` : ""}
                          {report.resolved_at ? ` • Resolved ${new Date(report.resolved_at).toLocaleDateString()}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {report.status === "reported" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(report.id, "in_progress")}>Start</Button>
                        )}
                        {report.status === "in_progress" && (
                          <Button size="sm" onClick={() => setResolvingId(resolvingId === report.id ? "" : report.id)}>
                            {resolvingId === report.id ? "Cancel" : "Resolve"}
                          </Button>
                        )}
                        {report.status === "resolved" && isAdmin && (
                          <Button size="sm" variant="outline" onClick={() => handleReopen(report.id)}>
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                        {isAdmin && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => { setEditTargetId(report.id); setEditTitle(report.title || ""); setEditDescription(report.description || ""); }}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <select
                              value={report.priority || "unset"}
                              onChange={(e) => updatePriority(report.id, e.target.value)}
                              className="text-xs border rounded px-1 py-0.5 bg-background"
                            >
                              <option value="unset">Priority</option>
                              {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <select
                              value=""
                              onChange={(e) => { if (e.target.value) updateDepartment(report.id, e.target.value); }}
                              className="text-xs border rounded px-1 py-0.5 bg-background max-w-[100px]"
                            >
                              <option value="">Dept</option>
                              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <Button size="sm" variant="outline" onClick={() => setAssignTeamId(assignTeamId === report.id ? "" : report.id)}>
                              <Users className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setArchiveTargetId(report.id); setShowArchiveConfirm(true); }}>
                              <Archive className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setSelectedReportId(selectedReportId === report.id ? "" : report.id); setMergeTargetId(""); }}>
                              <Merge className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => { setDeleteTargetId(report.id); setShowDeleteConfirm(true); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {isAdmin && assignTeamId === report.id && (
                      <div className="mt-3 pt-3 border-t flex gap-2 items-center">
                        <Input placeholder="Team name (e.g. Crew A, Zone 3)..." value={teamName} onChange={(e) => setTeamName(e.target.value)} className="text-sm" />
                        <Button size="sm" onClick={() => assignTeam(report.id)} disabled={!teamName.trim()}>Assign</Button>
                      </div>
                    )}
                    {resolvingId === report.id && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Before photo (optional)</label>
                            <input type="file" accept="image/*" onChange={(e) => setBeforeFile(e.target.files?.[0] || null)} className="text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">After photo (optional)</label>
                            <input type="file" accept="image/*" onChange={(e) => setAfterFile(e.target.files?.[0] || null)} className="text-sm" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleResolveWithPhotos(report.id)} disabled={uploading}>
                            {uploading ? "Uploading..." : "Confirm Resolve"}
                          </Button>
                        </div>
                      </div>
                    )}
                    {isAdmin && selectedReportId === report.id && (
                      <div className="mt-3 pt-3 border-t flex gap-2 items-center">
                        <Input placeholder="Target report ID to merge into..." value={mergeTargetId} onChange={(e) => setMergeTargetId(e.target.value)} className="text-sm" />
                        <Button size="sm" onClick={handleMerge} disabled={!mergeTargetId || merging}>
                          {merging ? "Merging..." : "Merge"}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {filteredReports.length === 0 && (
                  <p className="p-8 text-center text-muted-foreground">No reports found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Ward-wise Reports</CardTitle></CardHeader>
              <CardContent>
                {wardData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={wardData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="reports" fill="#6366f1" name="Reports" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-12">No data yet.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Department Load</CardTitle></CardHeader>
              <CardContent>
                {departmentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={departmentData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="pending" stackId="a" fill="#f97316" name="Pending" />
                      <Bar dataKey="resolved" stackId="a" fill="#22c55e" name="Resolved" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-12">No data yet.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Categories</CardTitle></CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                        {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-12">No data yet.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Priority Breakdown</CardTitle></CardHeader>
              <CardContent>
                {priorityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={priorityData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                        {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-12">No data yet.</p>}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Resolution Trend (Last 14 Days)</CardTitle></CardHeader>
              <CardContent>
                {(() => {
                  const byDate: Record<string, { reports: number; resolved: number }> = {};
                  activeReports.forEach((r) => {
                    let date = "Unknown";
                    try { if (r.created_at) date = new Date(r.created_at).toISOString().split("T")[0]; } catch {}
                    if (!byDate[date]) byDate[date] = { reports: 0, resolved: 0 };
                    byDate[date].reports++;
                    if (r.status === "resolved") byDate[date].resolved++;
                  });
                  const timeline = Object.entries(byDate).slice(-14).map(([date, data]) => ({ date: date.slice(5), ...data }));
                  return timeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={timeline}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="reports" stroke="#3b82f6" name="Reports" />
                        <Line type="monotone" dataKey="resolved" stroke="#22c55e" name="Resolved" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <p className="text-sm text-muted-foreground text-center py-12">No timeline data yet.</p>;
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {departmentData.map((dept) => (
              <Card key={dept.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{dept.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dept.pending + dept.resolved}</div>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${dept.pending + dept.resolved > 0 ? (dept.resolved / (dept.pending + dept.resolved)) * 100 : 0}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dept.resolved} resolved / {dept.pending} pending
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {(isAdmin || userRole === "official") && (
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5" /> AI-Powered City Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={async () => {
                  setLoadingInsights(true);
                  const prompt = `You are a city analytics AI. Analyze this civic issue data and provide actionable insights:\n\nTotal: ${total}\nResolved: ${resolved}\nPending: ${pending}\nIn Progress: ${inProgress}\nCritical: ${critical}\nBy Category: ${JSON.stringify(byCategory)}\nBy Department: ${JSON.stringify(byDepartment)}\nBy Ward: ${JSON.stringify(byWard)}\n\nProvide 3-5 actionable insights for city officials in a professional tone.`;
                  try {
                    setAiInsights(await generateAIText(prompt) || "No insights generated");
                  } catch { setAiInsights("AI insights temporarily unavailable"); }
                  setLoadingInsights(false);
                }} disabled={loadingInsights}>
                  {loadingInsights ? "Analyzing..." : "Generate Insights"}
                </Button>
                {aiInsights && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 whitespace-pre-wrap text-sm">{aiInsights}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="admin" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bell className="h-4 w-4" /> Broadcast Alert
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    {(["all", "nearby", "reporters"] as const).map((scope) => (
                      <button key={scope} onClick={() => setBroadcastScope(scope)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          broadcastScope === scope ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                        }`}>
                        {scope === "all" ? "All Users" : scope === "nearby" ? "Nearby Citizens" : "Reporters"}
                      </button>
                    ))}
                  </div>
                  <Textarea placeholder="Write a broadcast message..." rows={3} value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} />
                  <Button onClick={handleBroadcast} disabled={broadcasting || !broadcastMsg.trim()}>
                    {broadcasting ? "Sending..." : "Send Broadcast"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <RefreshCw className="h-4 w-4" /> Data Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={() => getAllReports().then((data) => { setReports(data as Report[]); toast.info("Data refreshed"); })}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      <ConfirmDialog open={showDeleteConfirm} title="Delete Report" message="Are you sure you want to permanently delete this report? This cannot be undone." confirmLabel="Delete" cancelLabel="Cancel" variant="destructive" onConfirm={handleDeleteAny} onCancel={() => { setShowDeleteConfirm(false); setDeleteTargetId(""); }} />
      <ConfirmDialog open={showArchiveConfirm} title="Archive Report" message="Archive this report? It will be hidden from the active dashboard but preserved for records." confirmLabel="Archive" cancelLabel="Cancel" variant="default" onConfirm={handleArchive} onCancel={() => { setShowArchiveConfirm(false); setArchiveTargetId(""); }} />
    </div>
  );
}
