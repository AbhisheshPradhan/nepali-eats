"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Map, {
  Source,
  Layer,
  Popup,
  NavigationControl,
  type MapRef,
  type MapMouseEvent,
  type LayerProps,
} from "react-map-gl/mapbox";
import type { GeoJSONSource } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { RestaurantPin, Bbox } from "@/lib/types";
import { PlaceCard } from "@/components/PlaceCard";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const STYLE = "mapbox://styles/mapbox/streets-v12";

const clusterLayer: LayerProps = {
  id: "clusters",
  type: "circle",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": ["step", ["get", "point_count"], "#fbcb6b", 25, "#f5a623", 100, "#e2900f"],
    "circle-radius": ["step", ["get", "point_count"], 16, 25, 20, 100, 26],
    "circle-stroke-width": 2,
    "circle-stroke-color": "#fffbf4",
  },
};
const clusterCountLayer: LayerProps = {
  id: "cluster-count",
  type: "symbol",
  filter: ["has", "point_count"],
  layout: {
    "text-field": ["get", "point_count_abbreviated"],
    "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
    "text-size": 13,
  },
  paint: { "text-color": "#2b1a12" },
};

function pointLayer(activeId: number): LayerProps {
  return {
    id: "points",
    type: "circle",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "#e5392b",
      "circle-radius": ["case", ["==", ["get", "id"], activeId], 18, 13],
      "circle-stroke-width": ["case", ["==", ["get", "id"], activeId], 3, 1.5],
      "circle-stroke-color": ["case", ["==", ["get", "id"], activeId], "#2b1a12", "#ffffff"],
    },
  };
}
function pointLabelLayer(): LayerProps {
  return {
    id: "point-labels",
    type: "symbol",
    filter: ["!", ["has", "point_count"]],
    layout: {
      "text-field": ["get", "ratingLabel"],
      "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
      "text-size": 11,
      "text-allow-overlap": true,
    },
    paint: { "text-color": "#ffffff" },
  };
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
  onSelect: (id: number | null) => void;
  onBounds: (b: Bbox) => void;
  center: [number, number];
  zoom: number;
}) {
  const mapRef = useRef<MapRef>(null);
  const [cursor, setCursor] = useState("");
  const [popup, setPopup] = useState<RestaurantPin | null>(null);
  const activeId = selectedId ?? hoveredId ?? -1;

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: pins.map((p) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
        properties: {
          id: p.id,
          rating: p.rating ?? 0,
          ratingLabel: p.rating != null ? p.rating.toFixed(1) : "",
        },
      })),
    }),
    [pins]
  );

  const fire = (b: Bbox) => onBounds(b);
  const emitBounds = () => {
    const m = mapRef.current;
    if (!m) return;
    const b = m.getBounds();
    if (b) fire({ w: b.getWest(), s: b.getSouth(), e: b.getEast(), n: b.getNorth() });
  };

  useEffect(() => {
    mapRef.current?.flyTo({ center: [center[1], center[0]], zoom, duration: 800 });
  }, [center, zoom]);

  const onClick = (e: MapMouseEvent) => {
    const f = e.features?.[0];
    if (!f) {
      setPopup(null);
      onSelect(null);
      return;
    }
    if (f.properties?.point_count) {
      const clusterId = f.properties.cluster_id as number;
      const src = mapRef.current?.getMap().getSource("restaurants") as GeoJSONSource | undefined;
      const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
      src?.getClusterExpansionZoom(
        clusterId,
        (err: Error | null | undefined, z: number | null | undefined) => {
          if (err || z == null) return;
          mapRef.current?.easeTo({ center: coords, zoom: z, duration: 600 });
        }
      );
      return;
    }
    const id = f.properties?.id as number;
    onSelect(id);
    const pin = pins.find((p) => p.id === id);
    if (pin) setPopup(pin);
  };

  const onMouseMove = (e: MapMouseEvent) => {
    const f = e.features?.[0];
    if (f && f.layer?.id === "points") {
      setCursor("pointer");
      onHover(f.properties?.id as number);
    } else if (f && f.layer?.id === "clusters") {
      setCursor("pointer");
      onHover(null);
    } else {
      setCursor("");
      onHover(null);
    }
  };

  if (!TOKEN) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-paper-100 text-ink-500 p-6 text-center">
        Set NEXT_PUBLIC_MAPBOX_TOKEN to enable the map.
      </div>
    );
  }

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={TOKEN}
      mapStyle={STYLE}
      initialViewState={{ longitude: center[1], latitude: center[0], zoom }}
      style={{ position: "absolute", inset: 0 }}
      dragRotate={false}
      pitchWithRotate={false}
      touchPitch={false}
      interactiveLayerIds={["clusters", "points"]}
      cursor={cursor}
      onLoad={(e) => {
        // reduce map noise: hide Mapbox POI/transit labels, keep streets + place names.
        // NOTE: exclude our own layers ("points" contains "poi" as a substring!).
        const map = e.target;
        const ours = new Set(["points", "point-labels", "clusters", "cluster-count"]);
        for (const layer of map.getStyle()?.layers ?? []) {
          if (ours.has(layer.id)) continue;
          if (/poi-|transit-/i.test(layer.id)) {
            try {
              map.setLayoutProperty(layer.id, "visibility", "none");
            } catch {}
          }
        }
        emitBounds();
      }}
      onMoveEnd={emitBounds}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={() => {
        setCursor("");
        onHover(null);
      }}
      reuseMaps
    >
      <NavigationControl position="top-right" showCompass={false} />
      <Source
        id="restaurants"
        type="geojson"
        data={geojson}
        cluster
        clusterMaxZoom={14}
        clusterRadius={50}
      >
        <Layer {...clusterLayer} />
        <Layer {...clusterCountLayer} />
        <Layer {...pointLayer(activeId)} />
        <Layer {...pointLabelLayer()} />
      </Source>

      {popup && (
        <Popup
          longitude={popup.lng}
          latitude={popup.lat}
          offset={16}
          closeButton={false}
          onClose={() => {
            setPopup(null);
            onSelect(null);
          }}
          className="ne-popup"
          maxWidth="240px"
        >
          <PlaceCard
            r={{ ...popup, openingHours: null }}
            className="w-[230px]"
            newTab
          />
        </Popup>
      )}
    </Map>
  );
}
