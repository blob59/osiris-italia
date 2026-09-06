'use client';

import { useEffect } from 'react';

export interface AircraftTrackOverlayProps {
  watched: Array<{ icao24: string; callsign?: string }>;
}

type AircraftDetail = {
  icao24?: string;
  track?: [number, number][];
};

/**
 * Draws only reported ADS-B history for aircraft explicitly selected by the user.
 * No projected or predicted route is generated: every segment comes from /api/aircraft.
 *
 * OsirisMap exposes its MapLibre instance in production through a small custom event
 * bridge, so this component stays isolated from the large map renderer.
 */
export default function AircraftTrackOverlay({ watched }: AircraftTrackOverlayProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const wanted = watched.filter(w => /^[0-9a-f]{6}$/i.test(w.icao24));
    if (!wanted.length) {
      window.dispatchEvent(new CustomEvent('osiris:aircraft-tracks', { detail: [] }));
      return;
    }

    let cancelled = false;
    Promise.all(wanted.map(async (w) => {
      try {
        const r = await fetch(`/api/aircraft?icao24=${encodeURIComponent(w.icao24)}`);
        if (!r.ok) return null;
        const d = await r.json() as AircraftDetail;
        const coords = Array.isArray(d.track) ? d.track.filter(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)) : [];
        if (coords.length < 2) return null;
        return { icao24: w.icao24.toLowerCase(), callsign: w.callsign || w.icao24.toUpperCase(), coordinates: coords };
      } catch { return null; }
    })).then(rows => {
      if (!cancelled) window.dispatchEvent(new CustomEvent('osiris:aircraft-tracks', { detail: rows.filter(Boolean) }));
    });

    const timer = window.setInterval(() => {
      // Re-run the effect's fetch path without predicting positions.
      window.dispatchEvent(new CustomEvent('osiris:aircraft-tracks-refresh'));
    }, 120000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [watched]);

  return null;
}
