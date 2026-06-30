"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Star } from "lucide-react";
import { useAuth } from "@/lib/firebase-context";
import { getAllReports } from "@/lib/firestore";

interface UserData {
  userId: string;
  userName: string;
  reports: number;
  resolved: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<{ reports: number; resolved: number; points: number } | null>(null);

  useEffect(() => {
    getAllReports().then((reports) => {
      const userMap: Record<string, UserData> = {};
      reports.forEach((r) => {
        const uid = r.user_id || "unknown";
        if (!userMap[uid]) {
          userMap[uid] = { userId: uid, userName: r.user_name || "Anonymous", reports: 0, resolved: 0 };
        }
        userMap[uid].reports++;
        if (r.status === "resolved") userMap[uid].resolved++;
      });

      const sorted = Object.values(userMap)
        .sort((a, b) => (b.reports * 10 + b.resolved * 20) - (a.reports * 10 + a.resolved * 20))
        .slice(0, 10);

      setLeaderboard(sorted);

      if (user) {
        const me = userMap[user.uid];
        if (me) {
          setUserStats({ reports: me.reports, resolved: me.resolved, points: me.reports * 10 + me.resolved * 20 });
        } else {
          setUserStats({ reports: 0, resolved: 0, points: 0 });
        }
      }

      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-muted-foreground text-sm font-medium">#{rank}</span>;
    }
  };

  const getBadges = (reports: number, resolved: number) => {
    const b = [];
    if (reports >= 1) b.push({ name: "First Report", icon: "🎯" });
    if (reports >= 5) b.push({ name: "Active Citizen", icon: "🌟" });
    if (reports >= 10) b.push({ name: "Community Hero", icon: "🦸" });
    if (resolved >= 5) b.push({ name: "Problem Solver", icon: "✅" });
    if (reports >= 25) b.push({ name: "Gold Reporter", icon: "🥇" });
    if (resolved >= 20) b.push({ name: "Champion", icon: "🏆" });
    return b;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">Top contributors based on real reports</p>
      </div>

      {userStats && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Your Stats</p>
                <p className="text-sm text-muted-foreground">{userStats.reports} reports • {userStats.resolved} resolved</p>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">{userStats.points}</span>
                <span className="text-sm text-muted-foreground">pts</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" /> Top Contributors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((entry, i) => (
              <div key={entry.userId} className={`flex items-center gap-4 rounded-lg border p-3 ${
                entry.userId === user?.uid ? "border-primary bg-primary/5" : ""
              }`}>
                <div className="flex h-8 w-8 items-center justify-center">{getRankIcon(i + 1)}</div>
                <div className="flex-1">
                  <p className="font-medium">{entry.userName}</p>
                  <p className="text-xs text-muted-foreground">{entry.reports} reports • {entry.resolved} resolved</p>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-semibold">{entry.reports * 10 + entry.resolved * 20}</span>
                </div>
                <div className="flex gap-1">
                  {getBadges(entry.reports, entry.resolved).slice(0, 3).map((b) => (
                    <span key={b.name} className="text-lg" title={b.name}>{b.icon}</span>
                  ))}
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No reports yet. Be the first!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
