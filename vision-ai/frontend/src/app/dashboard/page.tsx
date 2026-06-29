"use client";

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

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    { title: "My Reports", value: "12", icon: AlertTriangle, change: "+3 this week" },
    { title: "Resolved", value: "8", icon: CheckCircle, change: "67% rate" },
    { title: "Pending", value: "4", icon: Clock, change: "Avg 2 days" },
    { title: "Reputation", value: "850", icon: TrendingUp, change: "+50 points" },
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
            {[
              { title: "Pothole on Main St", status: "verified", time: "2 hours ago" },
              { title: "Garbage overflow on Oak Ave", status: "pending", time: "5 hours ago" },
              { title: "Broken streetlight on Pine Rd", status: "in_progress", time: "1 day ago" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    item.status === "verified"
                      ? "bg-green-100 text-green-700"
                      : item.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
