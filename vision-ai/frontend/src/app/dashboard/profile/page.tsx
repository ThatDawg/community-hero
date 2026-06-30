"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/firebase-context";
import { getUserReports } from "@/lib/firestore";
import { User, FileText, CheckCircle, Star } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<number>(0);
  const [resolved, setResolved] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    getUserReports(user.uid).then((data) => {
      setReports(data.length);
      setResolved(data.filter((r) => r.status === "resolved").length);
    }).catch((e) => console.error("Failed to load reports:", e));
  }, [user]);

  const badges = [
    { name: "First Report", icon: "🎯", unlocked: reports >= 1 },
    { name: "Active Citizen", icon: "🌟", unlocked: reports >= 5 },
    { name: "Community Hero", icon: "🦸", unlocked: reports >= 10 },
    { name: "Problem Solver", icon: "✅", unlocked: resolved >= 5 },
    { name: "Gold Reporter", icon: "🥇", unlocked: reports >= 25 },
    { name: "Resolution Champion", icon: "🏆", unlocked: resolved >= 20 },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt="" className="h-16 w-16 rounded-full" />
              ) : (
                <User className="h-8 w-8" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.displayName || "Anonymous"}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="mx-auto h-8 w-8 text-blue-500" />
            <p className="text-2xl font-bold mt-2">{reports}</p>
            <p className="text-sm text-muted-foreground">Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
            <p className="text-2xl font-bold mt-2">{resolved}</p>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="mx-auto h-8 w-8 text-yellow-500" />
            <p className="text-2xl font-bold mt-2">{reports * 10 + resolved * 20}</p>
            <p className="text-sm text-muted-foreground">Points</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {badges.map((badge) => (
              <div key={badge.name} className={`rounded-lg border p-3 text-center ${badge.unlocked ? "bg-primary/5" : "opacity-50"}`}>
                <div className="text-3xl">{badge.icon}</div>
                <p className="mt-1 text-sm font-medium">{badge.name}</p>
                <Badge className="mt-2" variant={badge.unlocked ? "secondary" : "outline"}>
                  {badge.unlocked ? "Unlocked" : "Locked"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
