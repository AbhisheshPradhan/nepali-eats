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
import type { ExploreSpot, Bbox, DishPill } from "@/lib/types";
import type { LatLng } from "@/lib/useUserLocation";
import { PlaceCard } from "@/components/PlaceCard";
import { ExploreCard } from "@/components/explore/ExploreCard";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const STYLE = "mapbox://styles/mapbox/streets-v12";

// Docked-card height + bottom margin, roughly — the vertical space the mobile
// card occupies at the bottom of the map.
const CARD_SPACE = 360;

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
  dishPills,
  dishName,
  distOrigin,
}: {
  pins: ExploreSpot[];
  hoveredId: number | null;
  selectedId: number | null;
  onHover: (id: number | null) => void;
  onSelect: (id: number | null) => void;
  onBounds: (b: Bbox, userMoved: boolean) => void;
  center: [number, number];
  zoom: number;
  // Dish-search context: when active, the pin card becomes the Explore list
  // card so the matched dishes + prices show on the map (same as the list). Off
  // dish search these are absent and the compact PlaceCard renders instead.
  dishPills?: Map<number, DishPill[]>;
  dishName?: string;
  distOrigin?: LatLng;
  // On mobile the map is display:none while the list is showing, so Mapbox
  // measures a zero-size container. When it becomes visible we must resize, or
  // the canvas keeps its old (short) height and tiles only cover part of it.
  active?: boolean;
}) {
  const mapRef = useRef<MapRef>(null);
  const [cursor, setCursor] = useState("");
  const [popup, setPopup] = useState<ExploreSpot | null>(null);
  // On phones the map is short, so a pin-anchored popup regularly clips off the
  // bottom edge (and grows after its images lazy-load, past the anchor Mapbox
  // chose). Below md the card docks to the bottom of the map instead —
  // viewport-positioned, so it can never clip.
  const [dockCard, setDockCard] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setDockCard(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  // Gallery for the open popup's carousel, lazy-loaded per spot (pins carry only
  // one photo). Cached by slug so reopening the same pin doesn't refetch.
  type Gallery = { logo: string | null; photos: string[] };
  const [gallery, setGallery] = useState<Gallery>({ logo: null, photos: [] });
  // plain record, not a Map — `Map` is the react-map-gl component in this file.
  const galleryCache = useRef<Record<string, Gallery>>({});
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
    const m = mapRef.current;
    if (!m) return;
    // When this recenter is opening a card (a selected pin — "View on map", a
    // focus search), lift the pin toward the upper area so the card sits BELOW
    // it instead of covering it: a docked card at the bottom on mobile, an
    // anchored popup hanging under the pin on desktop. A plain recenter (suburb
    // search, Near me) centres normally. `offset` is a one-shot pixel shift
    // (negative y = pin higher), so it never persists onto later moves.
    let offset: [number, number] | undefined;
    if (selectedId != null) {
      const h = m.getContainer().clientHeight;
      if (h >= 320)
        offset = [0, -(dockCard ? CARD_SPACE / 2 : Math.min(h * 0.22, 170))];
    }
    // Only include `offset` when set — Mapbox's flyTo tries to Point.convert it
    // and throws on an explicit `offset: undefined`.
    m.flyTo({
      center: [center[1], center[0]],
      zoom,
      duration: 800,
      ...(offset ? { offset } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center, zoom]);

  // Mobile dock: if the opened pin sits where the bottom card will cover it,
  // ease it up into the free space above the card so you can still see WHICH
  // spot you opened. Skips while the camera is animating (projection would be
  // mid-flight) and when the map is hidden/too short to matter.
  const nudgeAboveCard = (lng: number, lat: number) => {
    const m = mapRef.current;
    if (!m || !dockCard || m.isMoving()) return;
    const h = m.getContainer().clientHeight;
    if (h < CARD_SPACE + 80) return;
    if (m.project([lng, lat]).y > h - CARD_SPACE) {
      m.easeTo({
        center: [lng, lat],
        offset: [0, -CARD_SPACE / 2],
        duration: 450,
      });
    }
  };

  // Auto-open the popup for the selected spot (a focus search, or "View on map")
  // as if its pin had been clicked. On a focus search the pin isn't in `pins` at
  // mount, so we wait for it to arrive, then open once. `lastAutoSelect` keeps it
  // from reopening on every refetch/pan or after the user closes it manually.
  const lastAutoSelect = useRef<number | null>(null);
  useEffect(() => {
    if (selectedId == null) {
      lastAutoSelect.current = null;
      return;
    }
    if (selectedId === lastAutoSelect.current) return;
    const pin = pins.find((p) => p.id === selectedId);
    if (!pin) return; // not loaded into view yet; reopen when it arrives
    lastAutoSelect.current = selectedId;
    setPopup(pin);
    nudgeAboveCard(pin.lng, pin.lat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, pins]);

  // Lazy-load the open spot's gallery for the popup carousel.
  useEffect(() => {
    const slug = popup?.slug;
    if (!slug) {
      setGallery({ logo: null, photos: [] });
      return;
    }
    const cached = galleryCache.current[slug];
    if (cached) {
      setGallery(cached);
      return;
    }
    setGallery({ logo: null, photos: [] }); // reset while the new spot loads
    let cancelled = false;
    fetch(`/api/restaurants/${slug}/photos`)
      .then((r) => r.json())
      .then((d: { logo?: string | null; photos?: string[] }) => {
        if (cancelled) return;
        const g: Gallery = { logo: d.logo ?? null, photos: d.photos ?? [] };
        galleryCache.current[slug] = g;
        setGallery(g);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [popup?.slug]);

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
    if (pin) {
      setPopup(pin);
      nudgeAboveCard(pin.lng, pin.lat);
    }
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

  // The open pin's card. In dish-search mode with matched items, render the
  // Explore list card so the matched dishes + prices show on the map (shared
  // with the list); otherwise the compact PlaceCard. `wide` widens the popup to
  // fit the list card.
  const popupPills = popup && dishName ? dishPills?.get(popup.id) : undefined;
  const wide = !!(popupPills && popupPills.length);
  const cardEl = popup ? (
    wide ? (
      // [&>a]:border-b-0 drops ExploreCard's list-row separator — this is a
      // standalone popup card, not a list row.
      <div className="@container w-[320px] max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white overflow-hidden p-3 [&>a]:border-b-0">
        <ExploreCard
          r={popup}
          pills={popupPills}
          dishName={dishName}
          fallbackOrigin={distOrigin}
        />
      </div>
    ) : (
      <PlaceCard
        r={popup}
        gallery={gallery.photos}
        galleryLogo={gallery.logo}
        className="w-[230px]"
        newTab
        noHover
      />
    )
  ) : null;

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={TOKEN}
      mapStyle={STYLE}
      initialViewState={{ longitude: center[1], latitude: center[0], zoom }}
      style={{ position: "absolute", inset: 0 }}
      // Flat map (no 3D globe at low zoom) — it's a single-country directory.
      projection="mercator"
      // Australia-only cage: camera can't pan outside the continent. minZoom is
      // low enough that the most-zoomed-out view frames the WHOLE continent
      // including Tasmania (lat -43.6); maxBounds (which reaches -45) then keeps
      // it from drifting past AU. Bounds padded past the data extent so no edge
      // listing (Perth/Hobart/Cairns) is clipped. [[W,S],[E,N]].
      maxBounds={[[110, -45], [156, -9]]}
      minZoom={2.5}
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
      {/* Zoom +/- is desktop-only: on mobile pinch-to-zoom covers it and the
          buttons would sit under the top bar / crowd the small map. `dockCard`
          is the (max-width:767px) media-query state. */}
      {!dockCard && (
        <NavigationControl position="top-right" showCompass={false} />
      )}
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

      {popup && !dockCard && (
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
          maxWidth={wide ? "340px" : "240px"}
        >
          <div className="relative">
            <CloseCard
              onClose={() => {
                setPopup(null);
                onSelect(null);
              }}
            />
            {cardEl}
          </div>
        </Popup>
      )}

      {/* Mobile: the card docks to the bottom of the map (never clips, never
          fights the pin anchor); the highlighted pin still shows WHERE it is. */}
      {popup && dockCard && (
        <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center pointer-events-none">
          {/* font restore mirrors `.ne-popup .mapboxgl-popup-content`: this sits
              inside .mapboxgl-map, whose Helvetica `font:` shorthand the card
              would otherwise inherit */}
          <div className="relative pointer-events-auto rounded-lg shadow-xl font-body text-[17px] leading-[1.55]">
            <CloseCard
              onClose={() => {
                setPopup(null);
                onSelect(null);
              }}
            />
            {cardEl}
          </div>
        </div>
      )}
    </Map>
  );
}

function CloseCard({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      className="absolute top-2 right-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-ink-900/70 text-white hover:bg-ink-900 cursor-pointer"
    >
      <X size={14} weight="bold" />
    </button>
  );
}
