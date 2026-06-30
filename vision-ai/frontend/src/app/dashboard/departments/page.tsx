"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Clock, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { getAllReports } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

interface Report {
  id: string;
  title: string;
  description: string;
  department?: string;
  status: string;
  severity: string;
  category: string;
  created_at: string;
  resolved_at?: string;
}

const DEPARTMENTS = ["Public Works", "Sanitation", "Electrical", "Water Supply", "Parks", "Fire Department", "Traffic"];

export default function DepartmentsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllReports().then((data) => {
      setReports(data as Report[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const assignDepartment = async (reportId: string, dept: string) => {
    await updateDoc(doc(db, "reports", reportId), { department: dept });
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, department: dept } : r)));
  };

  const deptStats = DEPARTMENTS.map((dept) => {
    const deptReports = reports.filter((r) => (r.department || "").toLowerCase() === dept.toLowerCase());
    const total = deptReports.length;
    const resolved = deptReports.filter((r) => r.status === "resolved").length;
    const pending = deptReports.filter((r) => r.status === "reported" || r.status === "verified").length;
    const inProgress = deptReports.filter((r) => r.status === "in_progress").length;
    const resolutionTimes = deptReports
      .filter((r) => r.resolved_at && r.created_at)
      .map((r) => (new Date(r.resolved_at!).getTime() - new Date(r.created_at).getTime()) / 3600000);
    const avgTime = resolutionTimes.length > 0
      ? (resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(1)
      : "N/A";

    return { name: dept, total, resolved, pending, inProgress, avgTime };
  });

  const unassigned = reports.filter((r) => !r.department);

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
        <Building2 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Department Performance</h1>
          <p className="text-muted-foreground">Monitor and manage department workloads</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {deptStats.map((dept) => (
          <Card key={dept.name}>
            <CardHeader>
              <CardTitle className="text-base">{dept.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-blue-500" />
                  <span>{dept.total} total</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>{dept.resolved} resolved</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-yellow-500" />
                  <span>{dept.pending} pending</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-purple-500" />
                  <span>{dept.avgTime !== "N/A" ? `${dept.avgTime}h avg` : "N/A"}</span>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: dept.total > 0 ? `${(dept.resolved / dept.total) * 100}%` : "0%" }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {unassigned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unassigned Reports ({unassigned.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unassigned.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium">{r.title || r.description?.slice(0, 40)}</p>
                  <p className="text-xs text-muted-foreground">{r.category} &middot; {r.severity}</p>
                </div>
                <select
                  onChange={(e) => assignDepartment(r.id, e.target.value)}
                  defaultValue=""
                  className="text-xs rounded border px-2 py-1 bg-background"
                >
                  <option value="" disabled>Assign to...</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
