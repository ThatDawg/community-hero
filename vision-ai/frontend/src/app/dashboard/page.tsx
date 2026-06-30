"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  PlusCircle,
  Map,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { getUserReports, getAllReports } from "@/lib/firestore";

const statusColors: Record<string, string> = {
  reported: "bg-blue-100 text-blue-700",
  verified: "bg-purple-100 text-purple-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface RecentReport {
  id: string;
  title: string;
  status: string;
  time: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [myReports, setMyReports] = useState<number>(0);
  const [myResolved, setMyResolved] = useState<number>(0);
  const [myPending, setMyPending] = useState<number>(0);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [totalReports, setTotalReports] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    getUserReports(user.uid).then((reports) => {
      setMyReports(reports.length);
      setMyResolved(reports.filter((r) => r.status === "resolved").length);
      setMyPending(reports.filter((r) => r.status !== "resolved").length);
    }).catch((e) => console.error("getUserReports failed:", e));
    getAllReports().then((all) => {
      setTotalReports(all.length);
      const sorted = all.slice(0, 5).map((r) => ({
        id: r.id || "",
        title: r.title || r.description?.slice(0, 40) || "Untitled",
        status: r.status || "reported",
        time: r.created_at ? timeAgo(r.created_at) : "just now",
      }));
      setRecentReports(sorted);
    }).catch((e) => console.error("getAllReports failed:", e));
  }, [user]);

  const stats = [
    { title: "My Reports", value: String(myReports), icon: AlertTriangle, change: "Total submitted" },
    { title: "Resolved", value: String(myResolved), icon: CheckCircle, change: myReports ? `${Math.round((myResolved / myReports) * 100)}% rate` : "0% rate" },
    { title: "Pending", value: String(myPending), icon: Clock, change: "Awaiting resolution" },
    { title: "Community Total", value: String(totalReports), icon: TrendingUp, change: "All reports" },
  ];

  const quickActions = [
    {
      title: "Report Issue",
      description: "Snap a photo and report a civic issue",
      href: "/dashboard/report",
      icon: PlusCircle,
      color: "text-blue-500",
    },
    {
      title: "View Map",
      description: "See issues reported near you",
      href: "/dashboard/map",
      icon: Map,
      color: "text-green-500",
    },
    {
      title: "AI Assistant",
      description: "Get help from our AI chatbot",
      href: "/dashboard/chat",
      icon: MessageSquare,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.displayName || "Citizen"}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your civic reports
        </p>
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
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="transition-colors hover:bg-accent cursor-pointer h-full">
              <CardHeader>
                <action.icon className={`h-8 w-8 ${action.color}`} />
                <CardTitle className="mt-2">{action.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReports.length > 0 ? recentReports.map((item) => (
              <Link key={item.id} href={`/dashboard/report-detail?id=${item.id}`}>
                <div className="flex items-center justify-between border-b pb-2 last:border-0 hover:bg-accent/50 cursor-pointer rounded p-1 transition">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      statusColors[item.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {item.status.replace("_", " ")}
                  </span>
                </div>
              </Link>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">No reports yet. Be the first to report an issue!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
