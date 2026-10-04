import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import type { Unit, Option } from "./types";
import { searchUnits } from "./search";
let cache: Unit[] | undefined;
export function getUnits(): Unit[] {
  if (cache) return cache;
  const rows = parse(
    readFileSync(path.join(process.cwd(), "data/polling-units.csv"), "utf8"),
    { columns: true, skip_empty_lines: true },
  ) as Record<string, string>[];
  const overlay = JSON.parse(
    readFileSync(
      path.join(process.cwd(), "data/verified-coordinates.json"),
      "utf8",
    ),
  ) as { code: string; lat: number; lng: number; source: string }[];
  const coordinates = new Map<string, Unit["coordinates"]>();
  for (const c of overlay) {
    if (
      !Number.isFinite(c.lat) ||
      !Number.isFinite(c.lng) ||
      c.lat < 4 ||
      c.lat > 14 ||
      c.lng < 2.5 ||
      c.lng > 15 ||
      !c.source?.trim() ||
      coordinates.has(c.code)
    )
      throw new Error("Invalid verified coordinate overlay");
    coordinates.set(c.code, { lat: c.lat, lng: c.lng, source: c.source });
  }
  const codes = new Set<string>();
  cache = rows.map((r) => {
    if (
      !r.pu_name ||
      !/^\d{2}\/\d{2}\/\d{2}\/\d{3}$/.test(r.full_code) ||
      codes.has(r.full_code) ||
      r.full_code !==
        `${r.state_code}/${r.lga_code}/${r.ward_code}/${r.pu_code}`
    )
      throw new Error("Invalid directory record");
    codes.add(r.full_code);
    return {
      code: r.full_code,
      name: r.pu_name,
      location: r.pu_location,
      state: r.state_name,
      stateCode: r.state_code,
      lga: r.lga_name,
      lgaCode: r.lga_code,
      ward: r.ward_name,
      wardCode: r.ward_code,
      portalId: r.portal_id,
      coordinates: coordinates.get(r.full_code) || null,
    };
  });
  for (const code of coordinates.keys())
    if (!codes.has(code)) throw new Error("Unknown coordinate code");
  return cache;
}
function options(units: Unit[], level: "state" | "lga" | "ward"): Option[] {
  return [
    ...new Map(
      units.map((u) => [
        u[`${level}Code`],
        { code: u[`${level}Code`], name: u[level] },
      ]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));
}
export function query(p: URLSearchParams) {
  const units = getUnits();
  const state = p.get("state"),
    lga = p.get("lga");
  return {
    ...searchUnits(units, p),
    states: options(units, "state"),
    lgas: state
      ? options(
          units.filter((u) => u.stateCode === state),
          "lga",
        )
      : [],
    wards:
      state && lga
        ? options(
            units.filter((u) => u.stateCode === state && u.lgaCode === lga),
            "ward",
          )
        : [],
    coordinateCount: units.filter((u) => u.coordinates).length,
    totalUnits: units.length,
  };
}
