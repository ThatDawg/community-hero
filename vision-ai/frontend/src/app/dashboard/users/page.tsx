"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Ban, CheckCircle, RotateCcw, UserX } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import ConfirmDialog from "@/components/confirm-dialog";

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  reports_count: number;
  verified_count: number;
  points: number;
  created_at: string;
  suspended?: boolean;
  banned?: boolean;
}

const roleBadge: Record<string, string> = {
  citizen: "bg-blue-100 text-blue-700",
  volunteer: "bg-green-100 text-green-700",
  official: "bg-purple-100 text-purple-700",
  moderator: "bg-orange-100 text-orange-700",
  admin: "bg-red-100 text-red-700",
};

const ROLES = ["citizen", "volunteer", "moderator", "official", "admin"];

export default function UsersPage() {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ uid: string; type: "reset" | "ban" } | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
        setAllUsers(users.sort((a, b) => (b.points || 0) - (a.points || 0)));
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const toggleSuspend = async (uid: string, current: boolean) => {
    await updateDoc(doc(db, "users", uid), { suspended: !current });
    setAllUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, suspended: !current } : u)));
  };

  const changeRole = async (uid: string, newRole: string) => {
    await updateDoc(doc(db, "users", uid), { role: newRole });
    setAllUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u)));
  };

  const resetReputation = async (uid: string) => {
    await updateDoc(doc(db, "users", uid), { points: 0, reports_count: 0, verified_count: 0 });
    setAllUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, points: 0, reports_count: 0, verified_count: 0 } : u)));
    setConfirmAction(null);
  };

  const toggleBan = async (uid: string, current: boolean) => {
    await updateDoc(doc(db, "users", uid), { banned: !current, suspended: !current ? true : false });
    setAllUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, banned: !current, suspended: !current ? true : false } : u)));
    setConfirmAction(null);
  };

  const filtered = allUsers.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = allUsers.length;
  const suspendedCount = allUsers.filter((u) => u.suspended).length;
  const bannedCount = allUsers.filter((u) => u.banned).length;
  const adminCount = allUsers.filter((u) => u.role === "admin").length;

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
        <Users className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">{totalUsers} total users</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalUsers}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Admins</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{adminCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Suspended</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-yellow-600">{suspendedCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Banned</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{bannedCount}</p></CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {filtered.map((u) => (
          <Card key={u.uid} className={u.suspended || u.banned ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-white ${
                    u.banned ? "bg-red-600" : u.suspended ? "bg-yellow-500" : "bg-primary"
                  }`}>
                    {u.displayName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-medium">{u.displayName || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge className={roleBadge[u.role] || "bg-gray-100"}>{u.role}</Badge>
                      {u.suspended && !u.banned && <Badge className="bg-yellow-100 text-yellow-700">Suspended</Badge>}
                      {u.banned && <Badge className="bg-red-100 text-red-700">Banned</Badge>}
                      <span className="text-xs text-muted-foreground">{u.points || 0} pts</span>
                      <span className="text-xs text-muted-foreground">{u.reports_count || 0} reports</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.uid, e.target.value)}
                    className="text-xs rounded border px-2 py-1 bg-background"
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                  <Button
                    size="sm"
                    variant={u.suspended ? "outline" : "destructive"}
                    onClick={() => toggleSuspend(u.uid, !!u.suspended)}
                  >
                    {u.suspended ? <CheckCircle className="h-3 w-3 mr-1" /> : <Ban className="h-3 w-3 mr-1" />}
                    {u.suspended ? "Unsuspend" : "Suspend"}
                  </Button>
                  <Button
                    size="sm"
                    variant={u.banned ? "outline" : "destructive"}
                    onClick={() => u.banned ? toggleBan(u.uid, true) : setConfirmAction({ uid: u.uid, type: "ban" })}
                  >
                    <UserX className="h-3 w-3 mr-1" />
                    {u.banned ? "Unban" : "Ban"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmAction({ uid: u.uid, type: "reset" })}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No users found.</p>
        )}
      </div>

      <ConfirmDialog
        open={confirmAction?.type === "reset"}
        title="Reset Reputation"
        message="Reset this user's points, reports, and verification count to zero?"
        confirmLabel="Reset"
        cancelLabel="Cancel"
        variant="default"
        onConfirm={() => confirmAction && resetReputation(confirmAction.uid)}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction?.type === "ban"}
        title="Ban User"
        message="Ban this user? They will be suspended and unable to use the platform."
        confirmLabel="Ban"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={() => confirmAction && toggleBan(confirmAction.uid, false)}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
