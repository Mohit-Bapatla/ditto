"use client";
import { useState } from "react";
import { Search, MapPin, Check, ExternalLink } from "lucide-react";
import type { Venue } from "@/lib/types";
export function VenuePicker({
  city,
  selected,
  onSelect,
}: {
  city: string;
  selected?: Venue;
  onSelect: (v: Venue | undefined) => void;
}) {
  const [query, setQuery] = useState(""),
    [results, setResults] = useState<Venue[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [searched, setSearched] = useState(false);
  async function search() {
    if (query.trim().length < 2 || busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, city }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setResults(d.venues);
      setSearched(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="venue-picker">
      <label htmlFor="venue-query">Find a real venue</label>
      <div className="search-field">
        <Search size={18} />
        <input
          id="venue-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Coffee, bowling, parks in ${city}`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void search();
            }
          }}
        />
        <button
          type="button"
          className="secondary"
          disabled={busy || query.trim().length < 2}
          onClick={search}
        >
          {busy ? "Finding…" : "Search"}
        </button>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error} You can still enter a meeting place below.
        </p>
      )}
      {busy && (
        <div
          className="skeleton venue-skeleton"
          role="status"
          aria-label="Loading places"
        />
      )}
      {searched && !results.length && !busy && (
        <p role="status" className="notice">
          No places found. Try a broader name or another city.
        </p>
      )}
      {selected ? (
        <div className="selected-venue">
          {selected.image && (
            <img
              src={selected.image}
              alt={selected.name}
              referrerPolicy="no-referrer"
            />
          )}
          <div>
            <span className="eyebrow">
              <Check size={13} /> Selected place
            </span>
            <h3>{selected.name}</h3>
            <p>{selected.address}</p>
            <button
              type="button"
              className="text-button"
              onClick={() => onSelect(undefined)}
            >
              Change venue
            </button>
          </div>
        </div>
      ) : (
        <div className="venue-options">
          {results.map((v) => (
            <button
              type="button"
              key={v.id}
              className="venue-option"
              onClick={() => onSelect(v)}
            >
              {v.image ? (
                <img
                  src={v.image}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="photo-placeholder">
                  <MapPin />
                </span>
              )}
              <span>
                <strong>{v.name}</strong>
                <small>{v.address}</small>
                <small>
                  {v.rating ? `★ ${v.rating} · ` : ""}
                  {v.price || "Price not supplied"}
                </small>
              </span>
              <Check size={18} />
            </button>
          ))}
        </div>
      )}
      {selected && (
        <a
          href={selected.url}
          target="_blank"
          rel="noreferrer"
          className="small"
        >
          Place details <ExternalLink size={12} />
        </a>
      )}
      <p className="small muted">
        Place data and photos from SerpApi when supplied. Check hours and
        availability with the venue.
      </p>
    </section>
  );
}
