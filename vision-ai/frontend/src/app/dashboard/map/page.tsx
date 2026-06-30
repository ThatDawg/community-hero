"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { getAllReports } from "@/lib/firestore";
import { MapPin, Layers, Navigation } from "lucide-react";

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

const severityColors: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapPage() {
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyRadius, setNearbyRadius] = useState(5);

  useEffect(() => {
    getAllReports()
      .then((data) => {
        const mapped = data
          .filter((r) => r.latitude && r.longitude)
          .map((r) => ({
            id: r.id,
            title: r.title || r.description?.slice(0, 40) || "Untitled",
            category: r.category || "other",
            severity: r.severity || "medium",
            status: r.status || "reported",
            lat: r.latitude ?? 28.6139,
            lng: r.longitude ?? 77.209,
            address: r.address || "",
          }));
        setReports(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const enableNearby = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setNearbyMode(true);
        },
        () => {
          setUserLocation({ lat: 28.6139, lng: 77.209 });
          setNearbyMode(true);
        }
      );
    }
  };

  let filteredReports = filter === "all" ? reports : reports.filter((r) => r.severity === filter);
  filteredReports = categoryFilter === "all" ? filteredReports : filteredReports.filter((r) => r.category === categoryFilter);

  if (nearbyMode && userLocation) {
    filteredReports = filteredReports.filter((r) => {
      const dist = haversineDistance(userLocation.lat, userLocation.lng, r.lat, r.lng);
      return dist <= nearbyRadius;
    });
  }

  const categories = [...new Set(reports.map((r) => r.category))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Live Issue Map</h1>
          <p className="text-muted-foreground">
            {filteredReports.length} issues {nearbyMode ? `within ${nearbyRadius}km` : "total"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={showHeatmap ? "default" : "outline"} size="sm" onClick={() => setShowHeatmap(!showHeatmap)}>
            <Layers className="h-4 w-4 mr-1" /> Heatmap
          </Button>
          <Button variant={nearbyMode ? "default" : "outline"} size="sm" onClick={nearbyMode ? () => setNearbyMode(false) : enableNearby}>
            <Navigation className="h-4 w-4 mr-1" /> {nearbyMode ? "Show All" : "Nearby"}
          </Button>
          {nearbyMode && (
            <select
              value={nearbyRadius}
              onChange={(e) => setNearbyRadius(Number(e.target.value))}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              <option value={1}>1 km</option>
              <option value={2}>2 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
            </select>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "critical", "high", "medium", "low"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="text-muted-foreground text-xs self-center mx-2">|</span>
        {["all", ...categories].map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              categoryFilter === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {c === "all" ? "All Types" : c.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-[600px] items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <LeafletMap reports={filteredReports} showHeatmap={showHeatmap} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Issues ({filteredReports.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[500px] overflow-auto">
              {filteredReports.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {loading ? "Loading..." : nearbyMode ? "No issues nearby. Try increasing the radius." : "No issues on map yet. Report one!"}
                </p>
              )}
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-lg border p-3 space-y-2 hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-sm">{report.title}</h3>
                    <Badge variant="secondary" className={severityColors[report.severity]}>
                      {report.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{report.address}</p>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{report.category}</span>
                    <span className="text-xs text-muted-foreground">{report.status}</span>
                    {nearbyMode && userLocation && (
                      <span className="text-xs text-primary">
                        {haversineDistance(userLocation.lat, userLocation.lng, report.lat, report.lng).toFixed(1)} km
                      </span>
                    )}
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
