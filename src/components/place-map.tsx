"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { Unit } from "@/lib/types";

export default function PlaceMap({ unit }: { unit: Unit }) {
  const initialQuery = `${unit.location || unit.name}, ${unit.lga}, ${unit.state}, Nigeria`;
  const [draft, setDraft] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  return (
    <div className="place-map">
      <form className="place-map-search" onSubmit={(event) => {
        event.preventDefault();
        const next = draft.trim();
        if (next && next !== query) {
          setLoading(true);
          setFailed(false);
          setQuery(next);
        }
      }}>
        <label htmlFor="map-place-query">Location to look up</label>
        <div>
          <input id="map-place-query" value={draft} maxLength={250} onChange={(event) => setDraft(event.target.value)} />
          <button type="submit" aria-label="Search this location on the embedded map"><Search size={18} /></button>
        </div>
      </form>
      <div className="embedded-place-map" role="region" aria-label="Google Maps location search">
        {loading && !failed && <p className="place-map-loading" role="status">Loading location map…</p>}
        <iframe
          key={query}
          title={`Google Maps search for ${unit.name}`}
          src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setFailed(true); }}
        />
      </div>
      {failed && <p className="detail-note" role="alert">The map could not load. Try again or use the directions link below.</p>}
      <p className="detail-note">Google Maps search result · not an INEC-verified location. Check the place name and area before travelling. You can refine the search above if the match is wrong.</p>
    </div>
  );
}
