"use client";

import { useAuth } from "@/lib/firebase-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { requestNotificationPermission, onForegroundMessage } from "@/lib/notifications";
import { doc, getDoc } from "firebase/firestore";
import {
  LayoutDashboard,
  PlusCircle,
  Map,
  MessageSquare,
  BarChart3,
  LogOut,
  User,
  Bell,
  Trophy,
  FileText,
  Shield,
  Menu,
  X,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState("citizen");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
    if (user) {
      requestNotificationPermission(user.uid);
      const unsub = onForegroundMessage(() => {});
      getDoc(doc(db, "users", user.uid)).then((snap) => {
        if (snap.exists()) {
          setUserRole(snap.data().role || "citizen");
        }
      });
      return unsub;
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/auth");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/report", label: "New Report", icon: PlusCircle },
    { href: "/dashboard/map", label: "Live Map", icon: Map },
    { href: "/dashboard/my-reports", label: "My Reports", icon: FileText },
    { href: "/dashboard/chat", label: "AI Chat", icon: MessageSquare },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
    ...(userRole === "volunteer" || userRole === "admin"
      ? [{ href: "/dashboard/volunteer", label: "Volunteer", icon: Shield }]
      : []),
    ...(userRole === "official" || userRole === "admin"
      ? [{ href: "/dashboard/government", label: "Official View", icon: Shield }]
      : []),
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Vision AI</h1>
          <p className="text-xs text-muted-foreground">Civic Issue Platform</p>
        </div>
        <button className="lg:hidden p-1" onClick={() => setSidebarOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-4">
        <Link
          href="/dashboard/profile"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <User className="h-4 w-4" />
          Profile
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium truncate">
              {user.displayName || user.email}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="mt-2 w-full justify-start gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden w-64 border-r bg-card lg:block">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-card z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 border-b p-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold">Vision AI</h1>
        </header>
        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
