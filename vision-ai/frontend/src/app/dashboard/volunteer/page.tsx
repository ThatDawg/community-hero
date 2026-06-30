"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/firebase-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, increment } from "firebase/firestore";
import { HandHelping, MapPin, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  department?: string;
  assigned_volunteer?: string;
  latitude: number;
  longitude: number;
  address?: string;
  user_name: string;
  created_at: string;
}

export default function VolunteerPage() {
  const { user } = useAuth();
  const [assignedReports, setAssignedReports] = useState<Report[]>([]);
  const [availableReports, setAvailableReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const assignedQ = query(
      collection(db, "reports"),
      where("assigned_volunteer", "==", user.uid),
    );
    const assignedUnsub = onSnapshot(assignedQ, (snap) => {
      setAssignedReports(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report)));
      setLoading(false);
    });

    const allAvailable = query(
      collection(db, "reports"),
      where("status", "in", ["reported", "verified"]),
    );
    const availableUnsub = onSnapshot(allAvailable, (snap) => {
      const unassigned = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Report))
        .filter((r) => !r.assigned_volunteer || r.assigned_volunteer === "");
      setAvailableReports(unassigned);
    });

    return () => { assignedUnsub(); availableUnsub(); };
  }, [user]);

  const handleClaim = async (reportId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "reports", reportId), {
        assigned_volunteer: user.uid,
        status: "in_progress",
      });
      await setDoc(doc(db, "users", user.uid), { reports_verified: increment(1) }, { merge: true });
      toast.success("Issue claimed! Head to the location.");
    } catch (e) {
      toast.error("Action failed", { description: e instanceof Error ? e.message : "Unknown error" });
    }
  };

  const handleResolve = async (reportId: string) => {
    try {
      await updateDoc(doc(db, "reports", reportId), {
        status: "resolved",
        resolved_at: new Date().toISOString(),
      });
      toast.success("Issue resolved! Thanks for your help.");
    } catch (e) {
      toast.error("Action failed", { description: e instanceof Error ? e.message : "Unknown error" });
    }
  };

  const statusColors: Record<string, string> = {
    reported: "bg-blue-100 text-blue-700",
    verified: "bg-purple-100 text-purple-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    resolved: "bg-green-100 text-green-700",
  };

  const severityColors: Record<string, string> = {
    low: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
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
      <div className="flex items-center gap-3">
        <HandHelping className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Volunteer Dashboard</h1>
          <p className="text-muted-foreground">Claim and resolve nearby civic issues</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-orange-500" />
            <p className="text-2xl font-bold mt-2">{assignedReports.length}</p>
            <p className="text-sm text-muted-foreground">Assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto h-8 w-8 text-yellow-500" />
            <p className="text-2xl font-bold mt-2">{assignedReports.filter((r) => r.status === "in_progress").length}</p>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
            <p className="text-2xl font-bold mt-2">{assignedReports.filter((r) => r.status === "resolved").length}</p>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {assignedReports.length > 0 && (
        <Card>
          <CardHeader><CardTitle>My Assigned Issues</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {assignedReports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{report.title || report.description?.slice(0, 50)}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className={severityColors[report.severity]}>{report.severity}</Badge>
                      <Badge className={statusColors[report.status]}>{report.status?.replace("_", " ")}</Badge>
                      {report.department && <Badge variant="outline">{report.department}</Badge>}
                    </div>
                    {report.address && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {report.address}
                      </p>
                    )}
                  </div>
                  {report.status === "in_progress" && (
                    <Button size="sm" onClick={() => handleResolve(report.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Resolve
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Available Issues ({availableReports.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3 max-h-[400px] overflow-auto">
          {availableReports.map((report) => (
            <div key={report.id} className="border rounded-lg p-4 hover:bg-accent/50 transition">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{report.title || report.description?.slice(0, 50)}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={severityColors[report.severity]}>{report.severity}</Badge>
                    <Badge variant="secondary">{report.category}</Badge>
                  </div>
                  {report.address && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {report.address}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => handleClaim(report.id)}>
                  Claim
                </Button>
              </div>
            </div>
          ))}
          {availableReports.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No available issues to claim.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
