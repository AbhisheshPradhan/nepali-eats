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
import { X } from "@phosphor-icons/react";
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
  active = true,
}: {
  pins: RestaurantPin[];
  hoveredId: number | null;
  selectedId: number | null;
  onHover: (id: number | null) => void;
  onSelect: (id: number | null) => void;
  onBounds: (b: Bbox, userMoved: boolean) => void;
  center: [number, number];
  zoom: number;
  // On mobile the map is display:none while the list is showing, so Mapbox
  // measures a zero-size container. When it becomes visible we must resize, or
  // the canvas keeps its old (short) height and tiles only cover part of it.
  active?: boolean;
}) {
  const mapRef = useRef<MapRef>(null);
  const [cursor, setCursor] = useState("");
  const [popup, setPopup] = useState<RestaurantPin | null>(null);
  const activeId = selectedId ?? hoveredId ?? -1;
  // true once the visitor has actually panned/zoomed. Until then we (re)emit the
  // settled bounds on every `idle` so the list scopes to the real viewport even
  // when `onLoad` doesn't fire (reuseMaps pools the map across client navigations).
  const userMovedRef = useRef(false);

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

  // userMoved = a real pan/zoom (drag/scroll), not a programmatic flyTo or the
  // initial load. Lets the list drop its seeded suburb scope and go map-area-wide.
  const emitBounds = (userMoved: boolean) => {
    const m = mapRef.current;
    if (!m) return;
    const b = m.getBounds();
    if (b) onBounds({ w: b.getWest(), s: b.getSouth(), e: b.getEast(), n: b.getNorth() }, userMoved);
  };

  useEffect(() => {
    mapRef.current?.flyTo({ center: [center[1], center[0]], zoom, duration: 800 });
  }, [center, zoom]);

  // When the map becomes visible (mobile list→map toggle), the container has just
  // gone from display:none to its full height. Resize on the next frame so the
  // canvas/tiles fill it instead of keeping the zero/short size from when hidden.
  useEffect(() => {
    if (!active) return;
    const id = requestAnimationFrame(() => mapRef.current?.resize());
    return () => cancelAnimationFrame(id);
  }, [active]);

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
      }}
      // Initial bounds: emit on `idle` (fires on every mount once the map is loaded,
      // sized and settled — including reused maps where `onLoad` never re-fires).
      // Stops once the user takes over, so it doesn't double-fetch on interaction.
      onIdle={() => {
        if (!userMovedRef.current) emitBounds(false);
      }}
      // originalEvent is present only for user-driven moves; flyTo/easeTo omit it.
      // (Not surfaced on react-map-gl's ViewStateChangeEvent type, but it's there.)
      onMoveEnd={(e) => {
        const userMoved = !!(e as { originalEvent?: unknown }).originalEvent;
        if (userMoved) userMovedRef.current = true;
        emitBounds(userMoved);
      }}
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
          // don't let the popup self-close on map click: clicking another pin
          // would otherwise close this one in the same click and the new card
          // never opens. Empty-map clicks still close it via the map onClick.
          closeOnClick={false}
          onClose={() => {
            setPopup(null);
            onSelect(null);
          }}
          className="ne-popup"
          maxWidth="240px"
        >
          <div className="relative">
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                setPopup(null);
                onSelect(null);
              }}
              className="absolute top-2 right-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-ink-900/70 text-white hover:bg-ink-900 cursor-pointer"
            >
              <X size={14} weight="bold" />
            </button>
            <PlaceCard
              r={{ ...popup, openingHours: null }}
              className="w-[230px]"
              newTab
              noHover
            />
          </div>
        </Popup>
      )}
    </Map>
  );
}
