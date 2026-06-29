"use client";

import { useAuth } from "@/lib/firebase-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star, Award } from "lucide-react";

const leaderboard = [
  { rank: 1, name: "Priya Sharma", reports: 47, verified: 42, reputation: 1250, badges: ["Gold Reporter", "Community Hero"] },
  { rank: 2, name: "Rahul Kumar", reports: 38, verified: 35, reputation: 980, badges: ["Silver Reporter"] },
  { rank: 3, name: "Anita Singh", reports: 32, verified: 28, reputation: 850, badges: ["Bronze Reporter"] },
  { rank: 4, name: "Vikram Patel", reports: 28, verified: 25, reputation: 720, badges: ["Rising Star"] },
  { rank: 5, name: "Meera Reddy", reports: 24, verified: 20, reputation: 650, badges: ["Active Citizen"] },
];

const badges = [
  { name: "First Report", icon: "🎯", description: "Submit your first report", unlocked: true },
  { name: "Community Hero", icon: "🦸", description: "Verify 10 reports", unlocked: true },
  { name: "Gold Reporter", icon: "🥇", description: "Submit 25 reports", unlocked: true },
  { name: "Streak Master", icon: "🔥", description: "7-day reporting streak", unlocked: false },
  { name: "AI Champion", icon: "🤖", description: "Use AI chat 50 times", unlocked: false },
  { name: "Voice Reporter", icon: "🎤", description: "Submit 5 voice reports", unlocked: false },
];

export default function LeaderboardPage() {
  const { user } = useAuth();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-muted-foreground">#{rank}</span>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard & Badges</h1>
        <p className="text-muted-foreground">Top contributors and achievements</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Contributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-4 rounded-lg border p-3 ${
                    entry.name === user?.displayName ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.reports} reports • {entry.verified} verified
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">{entry.reputation}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.name}
                  className={`rounded-lg border p-3 text-center ${
                    badge.unlocked ? "bg-primary/5" : "opacity-50"
                  }`}
                >
                  <div className="text-3xl">{badge.icon}</div>
                  <p className="mt-1 text-sm font-medium">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                  {badge.unlocked ? (
                    <Badge className="mt-2" variant="secondary">Unlocked</Badge>
                  ) : (
                    <Badge className="mt-2" variant="outline">Locked</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
