# Unit Finder

Independent, mobile-first INEC polling-unit directory built with Next.js App Router, TypeScript, Tailwind CSS and Leaflet.

## Run

```sh
npm ci
npm run dev
```

Open http://localhost:3000. If macOS reaches its file-watcher limit, run `WATCHPACK_POLLING=true npm run dev`, or use the production build/server. For production: `npm run build && npm start`. Geolocation requires HTTPS outside localhost.

## Data and limitations

The bundled CSV contains 176,846 polling units, 37 state/FCT entries, 774 LGAs and 8,809 wards. It is a community-maintained transcription of INEC's public CVR portal, not a live official INEC API or a guarantee of current voting assignments.

Source: https://github.com/saidiadegoke/nigeria-inec-geo
Pinned commit: `3cf617721aea519eef960681d3d86a4fad4325da` (August 11, 2026); downloaded October 4, 2026. Its MIT license is preserved in `data/LICENSE`. Official directory: https://inecnigeria.org/polling-units/ ; CVR lookup: https://cvr.inecnigeria.org/pu (direct access returned HTTP 403 during research).

The source includes names, full codes, State/LGA/Ward codes and names, location descriptions and INEC portal IDs. **It has no coordinates.** No units are fabricated, geocoded or assigned ward centroids. The alternative mykeels coordinate dataset was rejected because its script assigns the first Google Places search result; samples include Canadian coordinates and repeated positions.

Consequently, the bundled application supports complete manual searches and honest missing-location states, but cannot provide real distance rankings or polling-unit markers until verified coordinates are supplied. The map renders OpenStreetMap tiles and, when available, the user's approximate location. Directions for unmapped records open a labeled Google Maps place search, not a fabricated pin.

## Replacing or updating data

The UI consumes `Unit`/`Result` types and `/api/polling-units`. CSV loading and hierarchy metadata live in `src/lib/repository.ts`; pure filtering and distance calculations in `src/lib/search.ts`. Replace the CSV using the same schema or adapt only the repository. Validate source provenance, codes, row count and hierarchy before releasing an update. Update the source/date in the footer and documentation. Source-dependent count tests must change deliberately when the official snapshot changes.

Verified coordinates can be added to `data/verified-coordinates.json`:

```ts
// Schema only; no sample election coordinates are shipped.
type Coordinate = { code: string; lat: number; lng: number; source: string };
```

Each code must match an official full code; coordinates must be finite and within Nigeria's broad bounding box, and a source is required. Bounding-box checks do not certify accuracy. Only add coordinates after independent verification. Server restart/rebuild loads a new snapshot. Mapped units participate in straight-line Haversine ranking and get markers; unmapped units stay available in manual search. This design does not claim the nearest mapped unit is the nearest of all polling units.

## Privacy and map operation

Location is requested on button click, stored only in component memory and sent to the same-origin API only when nearby search has mapped coverage. No location persistence or application analytics. OpenStreetMap receives tile requests, which can reveal the viewed area; Google Maps is opened only when the user activates directions. OSM attribution is shown. Public OSM tiles are appropriate for light development usage; configure a production tile provider consistent with https://operations.osmfoundation.org/policies/tiles/ before high-traffic deployment. Map tile failures leave list search available.

## Validation

`npm test` validates actual source counts, code uniqueness, hierarchy, filtering, pagination, empty results, input validation, missing coordinates and distance calculations. The distance-sort test uses explicitly test-only fixtures and does not write any election coordinates to the dataset. `npm run lint` and `npm run build` validate the application.

## Structure

- `src/app`: server landing page, layout, styles and search API
- `src/components`: client search/detail interface and lazy-loaded map
- `src/lib`: shared types, server repository, pure search logic and tests
- `data`: pinned source CSV, license and optional verified coordinate overlay

The implementation plan and research decisions are in `IMPLEMENTATION_PLAN.md`.

Production dependency audit: zero reported vulnerabilities at setup. Five high-severity audit entries remain in the development-only eslint-config-next → fast-glob → micromatch → braces chain; npm proposes an incompatible Next.js lint-config downgrade rather than a compatible patch. Do not use automated forced downgrades. Recheck when compatible fixes are published.
