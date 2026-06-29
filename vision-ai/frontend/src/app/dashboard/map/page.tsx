"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("@/components/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-lg border bg-muted">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  ),
});

interface Report {
  id: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  lat: number;
  lng: number;
  address: string;
}

const mockReports: Report[] = [
  {
    id: "1",
    title: "Pothole on Main Street",
    category: "pothole",
    severity: "high",
    status: "pending",
    lat: 28.6139,
    lng: 77.209,
    address: "Main Street, New Delhi",
  },
  {
    id: "2",
    title: "Garbage Overflow",
    category: "garbage",
    severity: "medium",
    status: "verified",
    lat: 28.62,
    lng: 77.215,
    address: "Oak Avenue, New Delhi",
  },
  {
    id: "3",
    title: "Broken Streetlight",
    category: "broken_streetlight",
    severity: "medium",
    status: "in_progress",
    lat: 28.608,
    lng: 77.202,
    address: "Pine Road, New Delhi",
  },
  {
    id: "4",
    title: "Water Leakage",
    category: "water_leakage",
    severity: "critical",
    status: "pending",
    lat: 28.625,
    lng: 77.218,
    address: "Water Works Lane, New Delhi",
  },
];

const severityColors: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function MapPage() {
  const [filter, setFilter] = useState("all");

  const filteredReports =
    filter === "all" ? mockReports : mockReports.filter((r) => r.severity === filter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Issue Map</h1>
          <p className="text-muted-foreground">
            Real-time civic issues in your area
          </p>
        </div>
        <div className="flex gap-2">
          {["all", "critical", "high", "medium", "low"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <LeafletMap reports={filteredReports} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Issues ({filteredReports.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[500px] overflow-auto">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-lg border p-3 space-y-2 hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-sm">{report.title}</h3>
                    <Badge
                      variant="secondary"
                      className={severityColors[report.severity]}
                    >
                      {report.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{report.address}</p>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {report.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {report.status}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
