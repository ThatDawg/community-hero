"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,

} from "recharts";
import { TrendingUp, Users, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const categoryData = [
  { name: "Potholes", value: 342, color: "#f97316" },
  { name: "Garbage", value: 256, color: "#eab308" },
  { name: "Streetlights", value: 189, color: "#3b82f6" },
  { name: "Water", value: 145, color: "#06b6d4" },
  { name: "Trees", value: 98, color: "#22c55e" },
  { name: "Roads", value: 87, color: "#a855f7" },
];

const weeklyData = [
  { day: "Mon", reports: 45, resolved: 32 },
  { day: "Tue", reports: 52, resolved: 41 },
  { day: "Wed", reports: 38, resolved: 35 },
  { day: "Thu", reports: 61, resolved: 48 },
  { day: "Fri", reports: 55, resolved: 42 },
  { day: "Sat", reports: 28, resolved: 25 },
  { day: "Sun", reports: 18, resolved: 15 },
];

const departmentData = [
  { name: "Public Works", pending: 45, resolved: 120 },
  { name: "Sanitation", pending: 32, resolved: 98 },
  { name: "Electrical", pending: 28, resolved: 76 },
  { name: "Water", pending: 18, resolved: 54 },
  { name: "Parks", pending: 12, resolved: 42 },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("week");

  const stats = [
    { title: "Total Reports", value: "1,247", icon: AlertTriangle, change: "+12%", trend: "up" },
    { title: "Resolved", value: "892", icon: CheckCircle, change: "+8%", trend: "up" },
    { title: "Avg Resolution", value: "2.3 days", icon: Clock, change: "-15%", trend: "down" },
    { title: "Active Users", value: "3,456", icon: Users, change: "+22%", trend: "up" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">AI-powered insights for civic issues</p>
        </div>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {stat.change} from last {period}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="reports" fill="#3b82f6" name="Reports" />
                <Bar dataKey="resolved" fill="#22c55e" name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issue Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
          </CardHeader>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Peak Reporting Hours
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Most issues are reported between 8-10 AM and 6-8 PM. Consider increasing
                staff during these hours.
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Resolution Improvement
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Average resolution time decreased by 15% this month. Public Works
                department showing the most improvement.
              </p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-950">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                Recurring Issues Detected
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                AI detected 12 potential recurring pothole locations in the downtown area.
                Recommend preventive maintenance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
