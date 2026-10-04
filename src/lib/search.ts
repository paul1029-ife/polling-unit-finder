import type { Unit } from "./types";
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const r = Math.PI / 180;
  const dlat = (b.lat - a.lat) * r,
    dlng = (b.lng - a.lng) * r;
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dlng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export function searchUnits(units: Unit[], p: URLSearchParams) {
  const q = (p.get("q") || "").trim().toLowerCase();
  const lat = p.get("lat"),
    lng = p.get("lng");
  const nearby = lat !== null && lng !== null;
  const origin = { lat: Number(lat), lng: Number(lng) };
  if (
    nearby &&
    (!lat?.trim() ||
      !lng?.trim() ||
      !Number.isFinite(origin.lat) ||
      !Number.isFinite(origin.lng) ||
      Math.abs(origin.lat) > 90 ||
      Math.abs(origin.lng) > 180)
  )
    throw new Error("Invalid location");
  if ((lat === null) !== (lng === null))
    throw new Error("Both latitude and longitude are required");
  let found = units.filter(
    (u) =>
      (!p.get("state") || u.stateCode === p.get("state")) &&
      (!p.get("lga") || u.lgaCode === p.get("lga")) &&
      (!p.get("ward") || u.wardCode === p.get("ward")) &&
      (!q || `${u.name} ${u.code} ${u.location}`.toLowerCase().includes(q)),
  );
  if (nearby)
    found = found
      .filter((u) => u.coordinates)
      .map((u) => ({ ...u, distance: distanceKm(origin, u.coordinates!) }))
      .sort((a, b) => a.distance - b.distance);
  const requested = Number(p.get("page") || 1);
  if (!Number.isInteger(requested) || requested < 1)
    throw new Error("Invalid page");
  const pages = Math.ceil(found.length / 30);
  const page = Math.min(requested, Math.max(1, pages));
  return {
    units: found.slice((page - 1) * 30, page * 30),
    total: found.length,
    page,
    pages,
  };
}
