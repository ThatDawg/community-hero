"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, CheckCircle, XCircle, Info, MapPin } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, addDoc } from "firebase/firestore";

interface Report {
  id: string;
  title: string;
  description: string;
  user_name: string;
  user_id: string;
  category: string;
  severity: string;
  status: string;
  department?: string;
  created_at: string;
}

const DEPARTMENTS = ["Roads & Infrastructure", "Sanitation", "Lighting", "Water Supply", "Parks & Forestry", "Public Safety", "Other"];

export default function VerificationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [infoRequest, setInfoRequest] = useState("");
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [infoRequestId, setInfoRequestId] = useState<string | null>(null);
  const [assignDeptId, setAssignDeptId] = useState<string | null>(null);
  const [deptChoice, setDeptChoice] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "reports"));
      const pending = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Report))
        .filter((r) => ["reported", "verified", "needs_info"].includes(r.status))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setReports(pending);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleApprove = async (reportId: string) => {
    await updateDoc(doc(db, "reports", reportId), { status: "verified" });
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: "verified" } : r)));
  };

  const handleReject = async (reportId: string) => {
    await updateDoc(doc(db, "reports", reportId), { status: "rejected" });
    const report = reports.find((r) => r.id === reportId);
    if (report?.user_id) {
      await addDoc(collection(db, "notifications"), {
        user_id: report.user_id,
        type: "rejection",
        title: "Report Rejected",
        message: rejectionReason || "Your report was reviewed and rejected.",
        read: false,
        report_id: reportId,
        created_at: new Date().toISOString(),
      });
    }
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    setSelectedReport(null);
    setRejectionReason("");
  };

  const handleRequestInfo = async (reportId: string) => {
    if (!infoRequest.trim()) return;
    await updateDoc(doc(db, "reports", reportId), { status: "needs_info" });
    const report = reports.find((r) => r.id === reportId);
    if (report?.user_id) {
      await addDoc(collection(db, "notifications"), {
        user_id: report.user_id,
        type: "needs_info",
        title: "Additional Information Needed",
        message: infoRequest,
        read: false,
        report_id: reportId,
        created_at: new Date().toISOString(),
      });
    }
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: "needs_info" } : r));
    setInfoRequestId(null);
    setInfoRequest("");
  };

  const assignDepartment = async (reportId: string) => {
    if (!deptChoice) return;
    await updateDoc(doc(db, "reports", reportId), { department: deptChoice });
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, department: deptChoice } : r));
    setAssignDeptId(null);
    setDeptChoice("");
  };

  const approvedCount = reports.filter((r) => r.status === "verified").length;
  const pendingCount = reports.filter((r) => r.status === "reported").length;
  const needsInfoCount = reports.filter((r) => r.status === "needs_info").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Verification Queue</h1>
          <p className="text-muted-foreground">{reports.length} reports pending review</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{pendingCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Approved</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{approvedCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Needs Info</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-yellow-600">{needsInfoCount}</p></CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium">{report.title || report.description?.slice(0, 50)}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="secondary">{report.category}</Badge>
                    <Badge className={
                      report.severity === "critical" ? "bg-red-100 text-red-700" :
                      report.severity === "high" ? "bg-orange-100 text-orange-700" :
                      "bg-yellow-100 text-yellow-700"
                    }>{report.severity}</Badge>
                    <Badge className={
                      report.status === "verified" ? "bg-purple-100 text-purple-700" :
                      report.status === "needs_info" ? "bg-yellow-100 text-yellow-700" :
                      "bg-blue-100 text-blue-700"
                    }>{report.status.replace("_", " ")}</Badge>
                    {report.department && <Badge variant="outline">{report.department}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    By {report.user_name} &middot; {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                  <Button size="sm" variant="outline" onClick={() => setAssignDeptId(assignDeptId === report.id ? null : report.id)}>
                    <MapPin className="h-3 w-3 mr-1" /> Dept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setInfoRequestId(infoRequestId === report.id ? null : report.id)}>
                    <Info className="h-3 w-3 mr-1" /> Request Info
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(report.id)}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}>
                    <XCircle className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </div>
              </div>

              {assignDeptId === report.id && (
                <div className="mt-3 border-t pt-3 flex gap-2 items-center">
                  <select value={deptChoice} onChange={(e) => setDeptChoice(e.target.value)} className="text-sm border rounded px-2 py-1 bg-background flex-1">
                    <option value="">Select department...</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <Button size="sm" onClick={() => assignDepartment(report.id)} disabled={!deptChoice}>Assign</Button>
                </div>
              )}

              {infoRequestId === report.id && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <Textarea
                    placeholder="What additional information is needed?"
                    rows={2}
                    value={infoRequest}
                    onChange={(e) => setInfoRequest(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleRequestInfo(report.id)} disabled={!infoRequest.trim()}>
                      Send Request
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setInfoRequestId(null); setInfoRequest(""); }}>Cancel</Button>
                  </div>
                </div>
              )}

              {selectedReport === report.id && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <Textarea
                    placeholder="Reason for rejection..."
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={() => handleReject(report.id)}>
                      Confirm Reject
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedReport(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {reports.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No reports pending verification.</p>
        )}
      </div>
    </div>
  );
}
