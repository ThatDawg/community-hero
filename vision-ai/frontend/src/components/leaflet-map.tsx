"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

const categoryIcons: Record<string, string> = {
  pothole: "🕳️",
  garbage: "🗑️",
  overflowing_bin: "📦",
  broken_streetlight: "💡",
  water_leakage: "💧",
  fallen_tree: "🌳",
  road_crack: "🛣️",
  illegal_dumping: "⚠️",
  open_manhole: "🕳️",
};

export default function LeafletMap({ reports }: { reports: Report[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([28.6139, 77.209], 12);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    reports.forEach((report) => {
      const color = severityColors[report.severity] || "#3b82f6";
      const icon = categoryIcons[report.category] || "📍";

      const markerIcon = L.divIcon({
        html: `<div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          border: 2px solid white;
        ">${icon}</div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([report.lat, report.lng], { icon: markerIcon }).addTo(map);

      marker.bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="font-weight: bold; margin: 0 0 4px 0;">${report.title}</h3>
          <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;">${report.address}</p>
          <div style="display: flex; gap: 4px; margin-bottom: 4px;">
            <span style="
              background: ${color}20;
              color: ${color};
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 500;
            ">${report.severity}</span>
            <span style="
              background: #f3f4f6;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
            ">${report.status}</span>
          </div>
          <p style="margin: 0; font-size: 12px; color: #888;">
            Category: ${report.category.replace("_", " ")}
          </p>
        </div>
      `);
    });
  }, [reports]);

  return <div ref={mapRef} className="h-[600px] w-full" />;
}
