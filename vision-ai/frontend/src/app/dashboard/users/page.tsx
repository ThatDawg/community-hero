"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Ban, CheckCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

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
}

const roleBadge: Record<string, string> = {
  citizen: "bg-blue-100 text-blue-700",
  volunteer: "bg-green-100 text-green-700",
  official: "bg-purple-100 text-purple-700",
  admin: "bg-red-100 text-red-700",
};

export default function UsersPage() {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

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

  const filtered = allUsers.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

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
          <p className="text-muted-foreground">{allUsers.length} total users</p>
        </div>
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
          <Card key={u.uid} className={u.suspended ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {u.displayName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-medium">{u.displayName || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge className={roleBadge[u.role] || "bg-gray-100"}>{u.role}</Badge>
                      {u.suspended && <Badge className="bg-red-100 text-red-700">Suspended</Badge>}
                      <span className="text-xs text-muted-foreground">{u.points || 0} pts</span>
                      <span className="text-xs text-muted-foreground">{u.reports_count || 0} reports</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {u.role !== "admin" && (
                    <>
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.uid, e.target.value)}
                        className="text-xs rounded border px-2 py-1 bg-background"
                      >
                        <option value="citizen">Citizen</option>
                        <option value="volunteer">Volunteer</option>
                        <option value="official">Official</option>
                      </select>
                      <Button
                        size="sm"
                        variant={u.suspended ? "outline" : "destructive"}
                        onClick={() => toggleSuspend(u.uid, !!u.suspended)}
                      >
                        {u.suspended ? <CheckCircle className="h-3 w-3 mr-1" /> : <Ban className="h-3 w-3 mr-1" />}
                        {u.suspended ? "Unsuspend" : "Suspend"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No users found.</p>
        )}
      </div>
    </div>
  );
}
