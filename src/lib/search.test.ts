import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { distanceKm, searchUnits } from "./search";
import type { Unit } from "./types";
const rows = parse(readFileSync("data/polling-units.csv", "utf8"), {
  columns: true,
}) as Record<string, string>[];
const units: Unit[] = rows.map((r) => ({
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
  coordinates: null,
}));
test("snapshot has unique national codes and complete hierarchy", () => {
  assert.equal(units.length, 176846);
  assert.equal(new Set(units.map((u) => u.code)).size, units.length);
  assert.equal(new Set(units.map((u) => u.stateCode)).size, 37);
  assert.equal(
    new Set(units.map((u) => `${u.stateCode}/${u.lgaCode}`)).size,
    774,
  );
  assert.equal(
    new Set(units.map((u) => `${u.stateCode}/${u.lgaCode}/${u.wardCode}`)).size,
    8809,
  );
  for (const r of rows)
    assert.equal(
      r.full_code,
      `${r.state_code}/${r.lga_code}/${r.ward_code}/${r.pu_code}`,
    );
});
test("exact code search returns the source record", () => {
  const result = searchUnits(units, new URLSearchParams({ q: "01/01/01/001" }));
  assert.equal(result.total, 1);
  assert.equal(result.units[0].name, "RAILWAY QUARTERS I");
});
test("cascading filters scope results and pagination does not overlap", () => {
  const p = new URLSearchParams({ state: "01", lga: "01", ward: "01" });
  const a = searchUnits(units, p);
  assert.ok(a.units.every((u) => u.code.startsWith("01/01/01/")));
  p.set("page", "2");
  const b = searchUnits(units, p);
  assert.ok(!a.units.some((u) => b.units.some((v) => u.code === v.code)));
});
test("name search is case insensitive and unknown queries are empty", () => {
  assert.ok(
    searchUnits(units, new URLSearchParams({ q: "railway quarters i" })).total >
      0,
  );
  assert.equal(
    searchUnits(units, new URLSearchParams({ q: "zzzz_nonexistent_unit" }))
      .total,
    0,
  );
});
test("missing coordinates never produce distances or nearby units", () => {
  assert.equal(
    searchUnits(units, new URLSearchParams({ lat: "6.5", lng: "3.4" })).total,
    0,
  );
  assert.ok(
    searchUnits(units, new URLSearchParams()).units.every(
      (u) => u.distance === undefined,
    ),
  );
});
test("distance uses great-circle kilometers", () => {
  assert.equal(distanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 0 }), 0);
  assert.ok(
    Math.abs(distanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 }) - 111.195) <
      0.01,
  );
});
test("nearest sorting excludes unmapped records (test-only coordinate fixture)", () => {
  const fixtures = [
    { ...units[0], coordinates: { lat: 6, lng: 3, source: "test-only" } },
    { ...units[1], coordinates: { lat: 7, lng: 3, source: "test-only" } },
    units[2],
  ];
  const r = searchUnits(fixtures, new URLSearchParams({ lat: "7", lng: "3" }));
  assert.equal(r.total, 2);
  assert.equal(r.units[0].code, units[1].code);
  assert.equal(r.units[0].distance, 0);
});
test("invalid query inputs are rejected", () => {
  for (const params of [
    { lat: "abc", lng: "3" },
    { lat: "91", lng: "3" },
    { lat: "6" },
    { page: "0" },
    { page: "NaN" },
  ])
    assert.throws(() =>
      searchUnits(units, new URLSearchParams(Object.entries(params))),
    );
});
