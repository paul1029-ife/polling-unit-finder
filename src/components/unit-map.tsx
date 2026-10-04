"use client";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import { useEffect, useState } from "react";
import type { Unit } from "@/lib/types";
import "leaflet/dist/leaflet.css";
function Bounds({
  units,
  origin,
}: {
  units: Unit[];
  origin: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  useEffect(() => {
    const points = units
      .filter((u) => u.coordinates)
      .map((u) => [u.coordinates!.lat, u.coordinates!.lng] as [number, number]);
    if (origin) points.push([origin.lat, origin.lng]);
    if (points.length)
      map.fitBounds(points, { maxZoom: 15, padding: [35, 35] });
  }, [units, origin, map]);
  return null;
}
export default function UnitMap({
  units,
  origin,
  onSelect,
}: {
  units: Unit[];
  origin: { lat: number; lng: number } | null;
  onSelect: (u: Unit) => void;
}) {
  const [tileError, setTileError] = useState(false);
  return (
    <div className="map-wrap">
      <MapContainer
        center={[9.08, 8.67]}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{ tileerror: () => setTileError(true) }}
        />
        <Bounds units={units} origin={origin} />
        {origin && (
          <CircleMarker
            center={[origin.lat, origin.lng]}
            radius={9}
            pathOptions={{ color: "#3069bf", fillOpacity: 0.8 }}
          >
            <Popup>Your approximate location</Popup>
          </CircleMarker>
        )}
        {units
          .filter((u) => u.coordinates)
          .map((u) => (
            <CircleMarker
              key={u.code}
              center={[u.coordinates!.lat, u.coordinates!.lng]}
              radius={7}
              pathOptions={{ color: "#087554", fillOpacity: 0.9 }}
            >
              <Popup>
                <strong>{u.name}</strong>
                <br />
                {u.code}
                <br />
                <button onClick={() => onSelect(u)}>View details</button>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>
      {tileError && (
        <p className="map-notice">
          Map tiles could not load. Switch to list view to keep searching.
        </p>
      )}
      {!units.some((u) => u.coordinates) && (
        <p className="map-notice">
          No verified polling-unit coordinates in these results. All units
          remain available in list view.
        </p>
      )}
    </div>
  );
}
