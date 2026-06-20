"use client";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { RestaurantPin, Bbox } from "@/lib/types";

function tileProps() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (token) {
    return {
      url: `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/512/{z}/{x}/{y}@2x?access_token=${token}`,
      attribution:
        '© <a href="https://www.mapbox.com/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      tileSize: 512,
      zoomOffset: -1,
      maxZoom: 19,
    };
  }
  return {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap · © CARTO",
    subdomains: "abcd",
    maxZoom: 19,
  };
}

function pinIcon(p: RestaurantPin, hi: boolean) {
  const color = (p.rating ?? 0) >= 4.7 ? "#f5a623" : "#e5392b";
  const ring = hi ? "3px solid #2b1a12" : "2px solid #fff";
  const scale = hi ? 1.18 : 1;
  const label = p.rating != null ? p.rating.toFixed(1) : "";
  return L.divIcon({
    className: "",
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    tooltipAnchor: [0, -34],
    html: `<div style="position:relative;transform:scale(${scale})">
      <div style="width:34px;height:34px;background:${color};border:${ring};border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(43,26,18,.35)"></div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--font-baloo),sans-serif;font-weight:700;font-size:12px;padding-bottom:4px">${label}</div>
    </div>`,
  });
}

/* Build a clustered marker layer imperatively; rebuild only when pins change. */
function MarkersLayer({
  pins,
  onHover,
  onSelect,
  markersRef,
}: {
  pins: RestaurantPin[];
  onHover: (id: number | null) => void;
  onSelect: (id: number) => void;
  markersRef: React.MutableRefObject<Record<number, L.Marker>>;
}) {
  const map = useMap();
  useEffect(() => {
    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      showCoverageOnHover: false,
    });
    const byId: Record<number, L.Marker> = {};
    for (const p of pins) {
      const m = L.marker([p.lat, p.lng], { icon: pinIcon(p, false) });
      m.bindTooltip(p.name, { direction: "top", offset: [0, -34] });
      m.on("click", () => onSelect(p.id));
      m.on("mouseover", () => onHover(p.id));
      m.on("mouseout", () => onHover(null));
      cluster.addLayer(m);
      byId[p.id] = m;
    }
    map.addLayer(cluster);
    markersRef.current = byId;
    return () => {
      map.removeLayer(cluster);
      markersRef.current = {};
    };
  }, [pins, map, onHover, onSelect, markersRef]);
  return null;
}

/* Update only the highlighted markers (no full re-render). */
function Highlight({
  hoveredId,
  selectedId,
  pins,
  markersRef,
}: {
  hoveredId: number | null;
  selectedId: number | null;
  pins: RestaurantPin[];
  markersRef: React.MutableRefObject<Record<number, L.Marker>>;
}) {
  const prev = useRef<number[]>([]);
  useEffect(() => {
    for (const id of prev.current) {
      const m = markersRef.current[id];
      const p = pins.find((x) => x.id === id);
      if (m && p) m.setIcon(pinIcon(p, false));
    }
    const active = [hoveredId, selectedId].filter((x): x is number => x != null);
    for (const id of active) {
      const m = markersRef.current[id];
      const p = pins.find((x) => x.id === id);
      if (m && p) {
        m.setIcon(pinIcon(p, true));
        m.setZIndexOffset(1000);
      }
    }
    prev.current = active;
  }, [hoveredId, selectedId, pins, markersRef]);
  return null;
}

function BoundsWatcher({ onBounds }: { onBounds: (b: Bbox) => void }) {
  const map = useMap();
  useEffect(() => {
    const fire = () => {
      const b = map.getBounds();
      onBounds({ w: b.getWest(), s: b.getSouth(), e: b.getEast(), n: b.getNorth() });
    };
    map.whenReady(fire);
    map.on("moveend", fire);
    return () => {
      map.off("moveend", fire);
    };
  }, [map, onBounds]);
  return null;
}

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return; // initial center handled by MapContainer
    }
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

export default function MapView({
  pins,
  hoveredId,
  selectedId,
  onHover,
  onSelect,
  onBounds,
  center,
  zoom,
}: {
  pins: RestaurantPin[];
  hoveredId: number | null;
  selectedId: number | null;
  onHover: (id: number | null) => void;
  onSelect: (id: number) => void;
  onBounds: (b: Bbox) => void;
  center: [number, number];
  zoom: number;
}) {
  const markersRef = useRef<Record<number, L.Marker>>({});
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className="absolute inset-0 h-full w-full">
      <TileLayer {...tileProps()} />
      <BoundsWatcher onBounds={onBounds} />
      <Recenter center={center} zoom={zoom} />
      <MarkersLayer pins={pins} onHover={onHover} onSelect={onSelect} markersRef={markersRef} />
      <Highlight hoveredId={hoveredId} selectedId={selectedId} pins={pins} markersRef={markersRef} />
    </MapContainer>
  );
}
