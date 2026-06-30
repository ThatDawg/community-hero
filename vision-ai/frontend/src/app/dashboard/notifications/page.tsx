"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, AlertTriangle, CheckCheck } from "lucide-react";
import { useAuth } from "@/lib/firebase-context";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where } from "firebase/firestore";

interface Notification {
  id: string;
  type: "status" | "verification" | "comment" | "system";
  title: string;
  message: string;
  read: boolean;
  report_id?: string;
  created_at: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("user_id", "==", user.uid),
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(data);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => updateDoc(doc(db, "notifications", n.id), { read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "status": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "verification": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "comment": return <Bell className="h-5 w-5 text-blue-500" />;
      default: return <CheckCheck className="h-5 w-5 text-purple-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>Mark all as read</Button>
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
                  {!notification.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {notification.created_at ? new Date(notification.created_at).toLocaleString() : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        {notifications.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No notifications</h3>
              <p className="mt-2 text-muted-foreground">You&apos;re all caught up!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
