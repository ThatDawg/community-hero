"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, AlertTriangle, CheckCheck } from "lucide-react";

interface Notification {
  id: string;
  type: "status" | "verification" | "comment" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "status",
    title: "Report Verified",
    message: "Your pothole report on Main Street has been verified by 3 citizens.",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "2",
    type: "verification",
    title: "Verification Request",
    message: "A new water leakage report near your location needs verification.",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "3",
    type: "comment",
    title: "New Comment",
    message: "Official response added to your garbage overflow report.",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: "4",
    type: "system",
    title: "Achievement Unlocked",
    message: "Congratulations! You earned the 'Community Hero' badge.",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "status": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "verification": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "comment": return <Bell className="h-5 w-5 text-blue-500" />;
      default: return <CheckCheck className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`cursor-pointer transition-colors ${
              !notification.read ? "bg-primary/5 border-primary/20" : ""
            }`}
            onClick={() => markAsRead(notification.id)}
          >
            <CardContent className="p-4 flex gap-4">
              <div className="mt-1">{getIcon(notification.type)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{notification.title}</h3>
                  {!notification.read && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {notification.createdAt.toLocaleDateString()}{" "}
                  {notification.createdAt.toLocaleTimeString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
