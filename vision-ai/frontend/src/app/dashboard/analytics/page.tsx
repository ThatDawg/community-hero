"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { TrendingUp, AlertTriangle, CheckCircle, Clock, Brain } from "lucide-react";
import { getAllReports } from "@/lib/firestore";

const COLORS = ["#f97316", "#eab308", "#3b82f6", "#06b6d4", "#22c55e", "#a855f7", "#ef4444", "#ec4899", "#6366f1"];
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`;

interface Report {
  category: string;
  category_label?: string;
  severity: string;
  status: string;
  department?: string;
  created_at: string;
  resolved_at?: string;
}

export default function AnalyticsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<string[]>([]);

  useEffect(() => {
    getAllReports().then((data) => {
      setReports(data as Report[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (reports.length === 0) return;
    const generateInsights = async () => {
      const catBreakdown = reports.reduce((acc, r) => { const c = r.category || "other"; acc[c] = (acc[c] || 0) + 1; return acc; }, {} as Record<string, number>);
      const sevBreakdown = reports.reduce((acc, r) => { const s = r.severity || "medium"; acc[s] = (acc[s] || 0) + 1; return acc; }, {} as Record<string, number>);
      const statusBreakdown = reports.reduce((acc, r) => { const s = r.status || "reported"; acc[s] = (acc[s] || 0) + 1; return acc; }, {} as Record<string, number>);

      const prompt = `You are an AI analytics engine for a civic issue reporting platform. Analyze this data and give 3 brief actionable insights:

Total Reports: ${reports.length}
By Category: ${JSON.stringify(catBreakdown)}
By Severity: ${JSON.stringify(sevBreakdown)}
By Status: ${JSON.stringify(statusBreakdown)}

Respond with ONLY a JSON array of 3 insight strings, e.g. ["insight 1", "insight 2", "insight 3"]`;

      try {
        const response = await fetch(GEMINI_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          setAiInsights(JSON.parse(match[0]));
        }
      } catch {
        setAiInsights(["AI insights temporarily unavailable"]);
      }
    };
    generateInsights();
  }, [reports]);

  const total = reports.length;
  const resolved = reports.filter((r) => r.status === "resolved").length;
  const pending = reports.filter((r) => r.status === "reported").length;
  const inProgress = reports.filter((r) => r.status === "in_progress").length;

  const resolutionTimes = reports
    .filter((r) => r.resolved_at && r.created_at)
    .map((r) => (new Date(r.resolved_at!).getTime() - new Date(r.created_at).getTime()) / 3600000);
  const avgResolution = resolutionTimes.length > 0 ? (resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(1) : "N/A";

  const byCategory = reports.reduce((acc, r) => { const cat = r.category_label || r.category || "Other"; acc[cat] = (acc[cat] || 0) + 1; return acc; }, {} as Record<string, number>);
  const bySeverity = reports.reduce((acc, r) => { const s = r.severity || "medium"; acc[s] = (acc[s] || 0) + 1; return acc; }, {} as Record<string, number>);
  const byDepartment = reports.reduce((acc, r) => { const d = r.department || "Unassigned"; acc[d] = (acc[d] || 0) + 1; return acc; }, {} as Record<string, number>);

  const categoryData = Object.entries(byCategory).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  const severityData = Object.entries(bySeverity).map(([name, value], i) => ({
    name, value, color: ["#22c55e", "#eab308", "#f97316", "#ef4444"][i] || "#3b82f6",
  }));
  const departmentData = Object.entries(byDepartment).map(([name, count]) => ({ name, count }));

  const statusTimeline = (() => {
    const byDate: Record<string, { reports: number; resolved: number }> = {};
    reports.forEach((r) => {
      const date = r.created_at ? new Date(r.created_at).toLocaleDateString() : "Unknown";
      if (!byDate[date]) byDate[date] = { reports: 0, resolved: 0 };
      byDate[date].reports++;
      if (r.status === "resolved") byDate[date].resolved++;
    });
    return Object.entries(byDate).slice(-14).map(([date, data]) => ({ date: date.split("/").slice(0, 2).join("/"), ...data }));
  })();

  const stats = [
    { title: "Total Reports", value: String(total), icon: AlertTriangle, change: `${resolved} resolved` },
    { title: "Resolved", value: String(resolved), icon: CheckCircle, change: total > 0 ? `${Math.round((resolved / total) * 100)}% rate` : "0%" },
    { title: "In Progress", value: String(inProgress), icon: Clock, change: `${pending} pending` },
    { title: "Avg Resolution", value: avgResolution === "N/A" ? "N/A" : `${avgResolution}h`, icon: TrendingUp, change: resolutionTimes.length > 0 ? `${resolutionTimes.length} resolved` : "No data yet" },
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
      <div>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Real-time insights from your reports</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {aiInsights.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5" /> AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {aiInsights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-primary mt-0.5">{"•"}</span>
                <p className="text-sm text-muted-foreground">{insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Issue Categories</CardTitle></CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>By Severity</CardTitle></CardHeader>
          <CardContent>
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={severityData} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No data yet.</p>
            )}
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
                  <Bar dataKey="count" fill="#a855f7" name="Reports" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Report Timeline</CardTitle></CardHeader>
          <CardContent>
            {statusTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={statusTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="reports" stroke="#3b82f6" name="Reports" />
                  <Line type="monotone" dataKey="resolved" stroke="#22c55e" name="Resolved" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No timeline data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
