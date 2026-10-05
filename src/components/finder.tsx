"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import PlaceMap from "./place-map";
import {
  ArrowUpRight,
  ArrowRight,
  LocateFixed,
  Search,
  MapPin,
  List,
  Map as MapIcon,
  ChevronDown,
  X,
  Navigation,
  ShieldCheck,
} from "lucide-react";
import type { Result, Unit, Option } from "@/lib/types";
const UnitMap = dynamic(() => import("./unit-map"), {
  ssr: false,
  loading: () => <div className="map-wrap loading">Loading map…</div>,
});
const title = (s: string) =>
  s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
export default function Finder({ initial }: { initial: Result }) {
  const [data, setData] = useState(initial),
    [state, setState] = useState(""),
    [lga, setLga] = useState(""),
    [ward, setWard] = useState(""),
    [q, setQ] = useState(""),
    [page, setPage] = useState(1),
    [view, setView] = useState<"list" | "map">("list"),
    [unit, setUnit] = useState<Unit | null>(null),
    [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null),
    [nearby, setNearby] = useState(false),
    [loading, setLoading] = useState(false),
    [locating, setLocating] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null),
    searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      const p = new URLSearchParams({
        state,
        lga,
        ward,
        q,
        page: String(page),
      });
      if (nearby && origin) {
        p.set("lat", String(origin.lat));
        p.set("lng", String(origin.lng));
      }
      try {
        const response = await fetch(`/api/polling-units?${p}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        setData(await response.json());
      } catch (e) {
        if ((e as Error).name !== "AbortError")
          setError(
            "We couldn’t load polling units. Check your connection and try again.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [state, lga, ward, q, page, nearby, origin, retry]);
  useEffect(() => {
    if (unit) dialog.current?.showModal();
    else dialog.current?.close();
  }, [unit]);
  function locate() {
    setNotice("");
    if (!navigator.geolocation) {
      setNotice(
        "Location is unavailable in this browser. You can search by state, LGA and ward below.",
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setOrigin({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        if (!data.coordinateCount) {
          setNotice(
            "Your location is available, but this directory has no verified polling-unit coordinates yet. Choose your state, LGA and ward to find units. We won’t estimate distances from unverified locations.",
          );
          searchInput.current?.focus();
          return;
        }
        setNearby(true);
        setPage(1);
        setState("");
        setLga("");
        setWard("");
        setQ("");
      },
      (e) => {
        setLocating(false);
        setNotice(
          e.code === 1
            ? "Location permission was denied. You can still find your polling unit using the search below."
            : "We couldn’t get your location. Try again or search manually below.",
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }
  function manual() {
    setNearby(false);
    setNotice("");
    document
      .getElementById("search")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    searchInput.current?.focus();
  }
  function select(
    label: string,
    value: string,
    options: Option[],
    onChange: (v: string) => void,
    disabled = false,
  ) {
    return (
      <label className="field">
        <span>{label}</span>
        <div className="select-wrap">
          <select
            aria-label={label}
            value={value}
            disabled={disabled}
            onChange={(e) => {
              onChange(e.target.value);
              setPage(1);
              setNearby(false);
            }}
          >
            <option value="">
              {disabled
                ? `Select ${label === "LGA" ? "a state" : "an LGA"} first`
                : `All ${label === "State" ? "states" : label === "LGA" ? "LGAs" : "wards"}`}
            </option>
            {options.map((o) => (
              <option value={o.code} key={o.code}>
                {title(o.name)}
              </option>
            ))}
          </select>
          <ChevronDown size={15} />
        </div>
      </label>
    );
  }
  function directions(u: Unit) {
    return u.coordinates
      ? `https://www.google.com/maps/dir/?api=1&destination=${u.coordinates.lat},${u.coordinates.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${u.location || u.name}, ${u.ward}, ${u.lga}, ${u.state}, Nigeria`)}`;
  }
  return (
    <>
      <header className="header">
        <Link className="brand" href="/">
          <span className="brand-icon">
            <MapPin size={23} />
          </span>
          unit<span className="brand-light">finder</span>
          <span className="country">NIGERIA</span>
        </Link>
        <a
          href="https://cvr.inecnigeria.org/pu"
          target="_blank"
          rel="noreferrer"
          className="official"
        >
          Visit INEC <ArrowUpRight size={16} />
        </a>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> EVERY VOTE STARTS SOMEWHERE
            </div>
            <h1>
              Find your place.
              <br />
              <em>Make your voice count.</em>
            </h1>
            <p>
              Locate a polling unit anywhere in Nigeria.
              <br className="desktop" /> A clearer path from your doorstep to
              the ballot box.
            </p>
            <div className="hero-actions">
              <button className="primary" onClick={locate} disabled={locating}>
                <LocateFixed size={19} />
                {locating ? "Finding your location…" : "Find units near me"}
                <ArrowRight size={17} />
              </button>
              <button className="manual" onClick={manual}>
                Search manually <ArrowDown />
              </button>
            </div>
            <span className="privacy">
              <ShieldCheck size={14} /> Your location is used only for this
              search.
            </span>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="grid-art" />
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="art-pin">
              <MapPin size={62} strokeWidth={1.5} />
            </div>
            <span className="art-label">YOUR NEXT STEP STARTS HERE</span>
            <span className="art-dot dot-one" />
            <span className="art-dot dot-two" />
            <span className="art-dot dot-three" />
          </div>
        </section>
        <div className="facts">
          <span>
            <strong>{data.totalUnits.toLocaleString()}</strong> polling units
          </span>
          <span>
            <strong>36 states + FCT</strong> nationwide
          </span>
          <span className="facts-note">
            <span className="tiny-dot" /> Public INEC directory data
          </span>
        </div>
        {notice && (
          <div className="notice" role="status">
            <LocateFixed size={20} />
            <p>{notice}</p>
            <button
              aria-label="Dismiss location message"
              onClick={() => setNotice("")}
            >
              <X size={18} />
            </button>
          </div>
        )}
        <section id="search" className="search-section">
          <div className="section-intro">
            <div>
              <span className="eyebrow">THE POLLING-UNIT DIRECTORY</span>
              <h2>A little closer to your polling unit.</h2>
            </div>
            <p>
              Know the area? Start with a state.
              <br />
              Have a name or code? Search directly.
            </p>
          </div>
          <form
            className="search-box"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setRetry((r) => r + 1);
            }}
          >
            <div className="filter-grid">
              {select("State", state, data.states, (v) => {
                setState(v);
                setLga("");
                setWard("");
              })}
              {select(
                "LGA",
                lga,
                data.lgas,
                (v) => {
                  setLga(v);
                  setWard("");
                },
                !state,
              )}
              {select("Ward", ward, data.wards, setWard, !lga)}
            </div>
            <div className="query-row">
              <Search size={21} />
              <input
                ref={searchInput}
                aria-label="Polling unit name or code"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                  setNearby(false);
                }}
                placeholder="Search polling unit name or code, e.g. 01/01/01/001"
              />
              <button type="submit">
                Search <ArrowRight size={16} />
              </button>
            </div>
          </form>
          <div className="results-toolbar">
            <div>
              <h3>
                {nearby
                  ? "Nearest mapped units"
                  : state
                    ? `Polling units in ${title(data.states.find((s) => s.code === state)?.name || "your state")}`
                    : "Explore polling units"}
              </h3>
              <p aria-live="polite">
                {loading
                  ? "Searching the directory…"
                  : `${data.total.toLocaleString()} ${data.total === 1 ? "unit" : "units"} found`}
                {nearby ? " · straight-line distance" : ""}
              </p>
            </div>
            <div className="view-toggle" aria-label="Results view">
              <button
                aria-pressed={view === "list"}
                className={view === "list" ? "active" : ""}
                onClick={() => setView("list")}
              >
                <List size={17} />
                List
              </button>
              <button
                aria-pressed={view === "map"}
                className={view === "map" ? "active" : ""}
                onClick={() => setView("map")}
              >
                <MapIcon size={17} />
                Map
              </button>
            </div>
          </div>
          {nearby && (
            <button className="text-button" onClick={manual}>
              Return to manual search
            </button>
          )}
          <div className="coverage">
            <MapPin size={16} />
            <p>
              {data.coordinateCount
                ? `${data.coordinateCount.toLocaleString()} units have verified coordinates. Nearby results include only mapped units; other units remain searchable manually.`
                : "Open a unit in List view to look up its location on Google Maps. Verified coordinates for nearby-distance rankings are not available yet."}
            </p>
          </div>
          {error ? (
            <div className="empty" role="alert">
              <h3>Something interrupted your search</h3>
              <p>{error}</p>
              <button
                className="primary"
                onClick={() => setRetry((r) => r + 1)}
              >
                Try again
              </button>
            </div>
          ) : (
            <div
              aria-busy={loading}
              className={loading ? "results loading-results" : "results"}
            >
              {view === "map" ? (
                <UnitMap
                  units={data.units}
                  origin={origin}
                  onSelect={setUnit}
                />
              ) : data.units.length ? (
                <div className="unit-list">
                  {data.units.map((u, i) => (
                    <button
                      className="unit-card"
                      key={u.code}
                      onClick={() => setUnit(u)}
                    >
                      <span className="unit-number">
                        {String((data.page - 1) * 30 + i + 1).padStart(2, "0")}
                      </span>
                      <span className="unit-info">
                        <span className="code">{u.code}</span>
                        <strong>{title(u.name)}</strong>
                        <span>
                          {title(u.ward)} <span className="separator">/</span>{" "}
                          {title(u.lga)} <span className="separator">/</span>{" "}
                          {title(u.state)}
                        </span>
                      </span>
                      <span className="unit-status">
                        {u.distance !== undefined
                          ? `${u.distance.toFixed(2)} km`
                          : "View details"}
                        <ArrowUpRight size={18} />
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <Search size={30} />
                  <h3>No polling units found</h3>
                  <p>
                    {nearby
                      ? "No verified coordinates match this search. Search manually to see all units."
                      : "Try a shorter name, check the code, or broaden your filters."}
                  </p>
                  <button
                    className="primary"
                    onClick={() => {
                      setState("");
                      setLga("");
                      setWard("");
                      setQ("");
                      setNearby(false);
                      setPage(1);
                    }}
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          )}
          {!error && data.pages > 1 && (
            <nav className="pagination" aria-label="Search result pages">
              <button
                disabled={data.page <= 1 || loading}
                onClick={() => setPage(data.page - 1)}
              >
                ← Previous
              </button>
              <span>
                Page {data.page} of {data.pages.toLocaleString()}
              </span>
              <button
                disabled={data.page >= data.pages || loading}
                onClick={() => setPage(data.page + 1)}
              >
                Next →
              </button>
            </nav>
          )}
        </section>
        <aside className="voting-note">
          <ShieldCheck size={25} />
          <div>
            <strong>Finding a unit is the first step.</strong>
            <p>
              You can only vote at the polling unit where you are registered.
              Confirm your assignment through INEC before election day.
            </p>
          </div>
          <a
            href="https://cvr.inecnigeria.org/pu"
            target="_blank"
            rel="noreferrer"
          >
            Check with INEC <ArrowUpRight size={16} />
          </a>
        </aside>
      </main>
      <footer>
        <span className="brand">
          unit<span className="brand-light">finder</span>
        </span>
        <p>An independent civic utility. Not affiliated with INEC.</p>
        <a
          href="https://github.com/saidiadegoke/nigeria-inec-geo/tree/3cf617721aea519eef960681d3d86a4fad4325da"
          target="_blank"
          rel="noreferrer"
        >
          Data source · August 2026 snapshot <ArrowUpRight size={14} />
        </a>
      </footer>
      <dialog
        aria-label="Polling unit details"
        ref={dialog}
        onCancel={() => setUnit(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setUnit(null);
        }}
      >
        {unit && (
          <div className="detail">
            <button
              className="close"
              aria-label="Close details"
              onClick={() => setUnit(null)}
            >
              <X />
            </button>
            <span className="detail-icon">
              <MapPin size={26} />
            </span>
            <span className="eyebrow">POLLING UNIT</span>
            <h2>{title(unit.name)}</h2>
            <span className="code">{unit.code}</span>
            <section className="detail-map" aria-label="Polling unit map">
              <h3>Explore the location</h3>
              <p className="detail-note">
                {unit.coordinates
                  ? "Pan and zoom to explore this polling unit without leaving the app."
                  : "Look up the published location on Google Maps without leaving the app."}
              </p>
              {unit.coordinates ? (
                <UnitMap
                  key={unit.code}
                  units={[unit]}
                  origin={null}
                  onSelect={setUnit}
                  detail
                />
              ) : (
                <PlaceMap key={unit.code} unit={unit} />
              )}
            </section>
            <dl>
              {[
                ["State", unit.state],
                ["Local government", unit.lga],
                ["Ward", unit.ward],
                ["Published location", unit.location || "Not supplied"],
                ["INEC portal ID", unit.portalId],
                [
                  "Coordinates",
                  unit.coordinates
                    ? `${unit.coordinates.lat}, ${unit.coordinates.lng}`
                    : "Not available in this dataset",
                ],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>
                    {k === "Coordinates" || k === "INEC portal ID"
                      ? v
                      : title(v)}
                  </dd>
                </div>
              ))}
              {unit.coordinates && (
                <div>
                  <dt>Coordinate source</dt>
                  <dd>{unit.coordinates.source}</dd>
                </div>
              )}
            </dl>
            <a
              className="primary"
              href={directions(unit)}
              target="_blank"
              rel="noreferrer"
            >
              <Navigation size={18} />
              {unit.coordinates
                ? "Get directions"
                : "Get directions · search location"}
              <ArrowUpRight size={17} />
            </a>
            {!unit.coordinates && (
              <p className="detail-note">
                Opens a place search using the published location. Confirm the
                matching place before starting directions; a precise pin is
                unavailable.
              </p>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
function ArrowDown() {
  return <ChevronDown size={17} />;
}
