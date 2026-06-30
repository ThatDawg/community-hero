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
  pothole: "\u{1F573}\uFE0F",
  garbage: "\u{1F5D1}\uFE0F",
  overflowing_bin: "\u{1F4E6}",
  broken_streetlight: "\u{1F4A1}",
  water_leakage: "\u{1F4A7}",
  fallen_tree: "\u{1F333}",
  road_crack: "\u{1F6E3}\uFE0F",
  illegal_dumping: "\u{26A0}\uFE0F",
  open_manhole: "\u{1F573}\uFE0F",
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

interface MapProps {
  reports: Report[];
  showHeatmap?: boolean;
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export default function LeafletMap({ reports, showHeatmap = false, center, zoom, height }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const defaultCenter: [number, number] = center || [28.6139, 77.209];
    const defaultZoom = zoom || 12;

    const map = L.map(mapRef.current).setView(defaultCenter, defaultZoom);
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
      const icon = categoryIcons[report.category] || "\u{1F4CD}";

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
            <span style="background: ${color}20; color: ${color}; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">${report.severity}</span>
            <span style="background: #f3f4f6; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${report.status}</span>
          </div>
          <p style="margin: 0; font-size: 12px; color: #888;">Category: ${report.category.replace("_", " ")}</p>
        </div>
      `);
    });

    if (showHeatmap && reports.length > 0) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
      const heatData: [number, number, number][] = reports.map((r) => {
        const intensity = r.severity === "critical" ? 1.0 : r.severity === "high" ? 0.7 : r.severity === "medium" ? 0.4 : 0.2;
        return [r.lat, r.lng, intensity];
      });

      const heatCanvas = document.createElement("canvas");
      heatCanvas.width = 256;
      heatCanvas.height = 256;
      const ctx = heatCanvas.getContext("2d");

      if (ctx) {
        heatData.forEach(([lat, lng, intensity]) => {
          const point = map.latLngToContainerPoint(L.latLng(lat, lng));
          const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 50);
          gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity * 0.6})`);
          gradient.addColorStop(0.5, `rgba(255, 255, 0, ${intensity * 0.3})`);
          gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = gradient;
          ctx.fillRect(point.x - 50, point.y - 50, 100, 100);
        });

        const imageOverlay = L.imageOverlay(heatCanvas.toDataURL(), map.getBounds(), { opacity: 0.6 });
        imageOverlay.addTo(map);
        heatLayerRef.current = imageOverlay;
      }
    }
  }, [reports, showHeatmap]);

  return <div ref={mapRef} style={{ height: height || "600px" }} className="w-full" />;
}
