"use client";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "@phosphor-icons/react";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
// Match the Explore map style.
const STYLE = "mapbox://styles/mapbox/streets-v12";

// Single-restaurant map: centres on the venue and drops one pin. No clustering,
// no list wiring — just "here it is" on the detail page.
export default function DetailMap({
  lat,
  lng,
  name,
}: {
  lat: number;
  lng: number;
  name: string;
}) {
  if (!TOKEN) return null;

  return (
    <Map
      mapboxAccessToken={TOKEN}
      mapStyle={STYLE}
      initialViewState={{ longitude: lng, latitude: lat, zoom: 15 }}
      style={{ position: "absolute", inset: 0 }}
      dragRotate={false}
      pitchWithRotate={false}
      touchPitch={false}
      reuseMaps
    >
      <NavigationControl position="top-right" showCompass={false} />
      <Marker longitude={lng} latitude={lat} anchor="bottom">
        <span aria-label={name} className="text-chili-600 drop-shadow-md">
          <MapPin size={40} weight="fill" />
        </span>
      </Marker>
    </Map>
  );
}
