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
import { Shield, AlertTriangle, CheckCircle, Clock, TrendingUp, FileText, Download } from "lucide-react";
import { getAllReports } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  category_label?: string;
  severity: string;
  status: string;
  department?: string;
  latitude: number;
  longitude: number;
  address?: string;
  user_name: string;
  created_at: string;
  resolved_at?: string;
}

const COLORS = ["#f97316", "#eab308", "#3b82f6", "#06b6d4", "#22c55e", "#a855f7", "#ef4444", "#ec4899", "#6366f1"];

const statusColors: Record<string, string> = {
  reported: "bg-blue-100 text-blue-700",
  verified: "bg-purple-100 text-purple-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
};

export default function GovernmentPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    getAllReports().then((data) => {
      setReports(data as Report[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const total = reports.length;
  const resolved = reports.filter((r) => r.status === "resolved").length;
  const pending = reports.filter((r) => r.status === "reported").length;
  const inProgress = reports.filter((r) => r.status === "in_progress").length;
  const critical = reports.filter((r) => r.severity === "critical").length;

  const resolutionTimes = reports
    .filter((r) => r.resolved_at && r.created_at)
    .map((r) => (new Date(r.resolved_at!).getTime() - new Date(r.created_at).getTime()) / 3600000);
  const avgResolution = resolutionTimes.length > 0 ? (resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(1) : "N/A";

  const byCategory = reports.reduce((acc, r) => { const cat = r.category_label || r.category || "Other"; acc[cat] = (acc[cat] || 0) + 1; return acc; }, {} as Record<string, number>);
  const byDepartment = reports.reduce((acc, r) => { const dept = r.department || "Unassigned"; acc[dept] = (acc[dept] || 0) + 1; return acc; }, {} as Record<string, number>);

  const categoryData = Object.entries(byCategory).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  const departmentData = Object.entries(byDepartment).map(([name, value]) => ({
    name, pending: reports.filter((r) => (r.department || "Unassigned") === name && r.status !== "resolved").length,
    resolved: reports.filter((r) => (r.department || "Unassigned") === name && r.status === "resolved").length,
  }));

  const filteredReports = statusFilter === "all" ? reports : reports.filter((r) => r.status === statusFilter);

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

Recent Reports (Top 10):
${reports.slice(0, 10).map((r, i) => `${i + 1}. [${r.severity.toUpperCase()}] ${r.title || r.description?.slice(0, 50)} - ${r.status} (${r.department || "Unassigned"})`).join("\n")}
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
  };

  const stats = [
    { title: "Total Reports", value: total, icon: AlertTriangle, color: "text-blue-500" },
    { title: "Resolved", value: resolved, icon: CheckCircle, color: "text-green-500" },
    { title: "In Progress", value: inProgress, icon: Clock, color: "text-yellow-500" },
    { title: "Critical", value: critical, icon: TrendingUp, color: "text-red-500" },
    { title: "Avg Resolution", value: avgResolution === "N/A" ? "N/A" : `${avgResolution}h`, icon: Clock, color: "text-purple-500" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Government Dashboard</h1>
            <p className="text-muted-foreground">Manage and resolve civic issues</p>
          </div>
        </div>
        <Button onClick={generateOfficialReport} disabled={generatingReport}>
          <Download className="mr-2 h-4 w-4" />
          {generatingReport ? "Generating..." : "Export Report"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex gap-2">
            {["all", "reported", "verified", "in_progress", "resolved"].map((f) => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                }`}>
                {f === "all" ? "All" : f.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredReports.map((report) => (
                  <div key={report.id} className="p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{report.title || report.description?.slice(0, 50)}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary">{report.category_label || report.category}</Badge>
                          <Badge className={`${
                            report.severity === "critical" ? "bg-red-100 text-red-700" :
                            report.severity === "high" ? "bg-orange-100 text-orange-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>{report.severity}</Badge>
                          <Badge className={statusColors[report.status] || ""}>{report.status?.replace("_", " ")}</Badge>
                          {report.department && <Badge variant="outline">{report.department}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          By {report.user_name} {report.created_at ? `• ${new Date(report.created_at).toLocaleDateString()}` : ""}
                          {report.resolved_at ? ` • Resolved ${new Date(report.resolved_at).toLocaleDateString()}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {report.status === "reported" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(report.id, "in_progress")}>Start</Button>
                        )}
                        {report.status === "in_progress" && (
                          <Button size="sm" onClick={() => updateStatus(report.id, "resolved")}>Resolve</Button>
                        )}
                      </div>
                    </div>
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
              <CardHeader><CardTitle>Reports by Category</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Department Load</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="pending" fill="#f97316" name="Pending" />
                    <Bar dataKey="resolved" fill="#22c55e" name="Resolved" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {departmentData.map((dept) => (
              <Card key={dept.name}>
                <CardHeader><CardTitle className="text-lg">{dept.name}</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending: {dept.pending}</span>
                    <span className="text-green-600">Resolved: {dept.resolved}</span>
                  </div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{
                      width: `${dept.pending + dept.resolved > 0 ? (dept.resolved / (dept.pending + dept.resolved)) * 100 : 0}%`
                    }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
