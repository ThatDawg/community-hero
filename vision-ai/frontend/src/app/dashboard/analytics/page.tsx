"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, Users, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { getAllReports } from "@/lib/firestore";

const COLORS = ["#f97316", "#eab308", "#3b82f6", "#06b6d4", "#22c55e", "#a855f7", "#ef4444", "#ec4899", "#6366f1"];

interface Report {
  category: string;
  category_label?: string;
  severity: string;
  status: string;
  department?: string;
  created_at: string;
}

export default function AnalyticsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [period, setPeriod] = useState("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllReports().then((data) => {
      setReports(data as Report[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const total = reports.length;
  const resolved = reports.filter((r) => r.status === "resolved").length;
  const pending = reports.filter((r) => r.status === "reported").length;

  const byCategory = reports.reduce((acc, r) => {
    const cat = r.category_label || r.category || "Other";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byStatus = reports.reduce((acc, r) => {
    const s = r.status || "reported";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const bySeverity = reports.reduce((acc, r) => {
    const s = r.severity || "medium";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byDepartment = reports.reduce((acc, r) => {
    const d = r.department || "Unassigned";
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(byCategory).map(([name, value], i) => ({
    name, value, color: COLORS[i % COLORS.length],
  }));

  const statusData = Object.entries(byStatus).map(([name, value]) => ({
    name: name.replace("_", " "), value,
  }));

  const departmentData = Object.entries(byDepartment).map(([name, value]) => ({
    name, count: value,
  }));

  const stats = [
    { title: "Total Reports", value: String(total), icon: AlertTriangle, change: total > 0 ? `${resolved} resolved` : "No data" },
    { title: "Resolved", value: String(resolved), icon: CheckCircle, change: total > 0 ? `${Math.round((resolved / total) * 100)}% rate` : "0%" },
    { title: "Pending", value: String(pending), icon: Clock, change: `${total - resolved - pending} in progress` },
    { title: "Categories", value: String(Object.keys(byCategory).length), icon: TrendingUp, change: "Active types" },
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
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Real-time insights from your reports</p>
        </div>
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
              <p className="text-sm text-muted-foreground text-center py-12">No data yet. Report some issues!</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>By Status</CardTitle></CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" name="Reports" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>By Severity</CardTitle></CardHeader>
          <CardContent>
            {Object.keys(bySeverity).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={Object.entries(bySeverity).map(([name, value], i) => ({
                    name, value, color: ["#22c55e", "#eab308", "#f97316", "#ef4444"][i] || "#3b82f6"
                  }))} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {Object.entries(bySeverity).map(([, ], i) => (
                      <Cell key={i} fill={["#22c55e", "#eab308", "#f97316", "#ef4444"][i] || "#3b82f6"} />
                    ))}
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
      </div>
    </div>
  );
}
