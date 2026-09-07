'use client';

import { useEffect } from 'react';
import type maplibregl from 'maplibre-gl';

type Flight = {
  icao24?: string;
  callsign?: string;
  lat?: number;
  lng?: number;
  heading?: number;
  [key: string]: unknown;
};

type FlightPayload = {
  commercial_flights?: Flight[];
  private_flights?: Flight[];
  private_jets?: Flight[];
  military_flights?: Flight[];
};

const SOURCE_BUCKETS: Array<[string, keyof FlightPayload]> = [
  ['flights', 'commercial_flights'],
  ['private-fl', 'private_flights'],
  ['jets', 'private_jets'],
  ['military', 'military_flights'],
];

function featureCollection(rows: Flight[] = []) {
  return {
    type: 'FeatureCollection' as const,
    features: rows
      .filter((f) => Number.isFinite(f?.lat) && Number.isFinite(f?.lng))
      .map((f) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [Number(f.lng), Number(f.lat)] },
        properties: { ...f, heading: Number.isFinite(Number(f.heading)) ? Number(f.heading) : 0 },
      })),
  };
}

/**
 * Fast public ADS-B refresh bridge. Only positions returned by /api/flights are
 * drawn: no interpolation, extrapolation or predicted movement.
 */
export default function LiveFlightRefresh() {
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let running = false;

    const aviationEnabled = () => {
      const layers = (new URLSearchParams(window.location.search).get('layers') || '')
        .split(',').filter(Boolean);
      return layers.some((l) => ['flights', 'private', 'jets', 'military'].includes(l));
    };

    const tick = async () => {
      if (running || stopped) return;
      running = true;
      try {
        if (!aviationEnabled()) return;
        const res = await fetch(`/api/flights?live=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok || stopped) return;
        const payload = (await res.json()) as FlightPayload;
        const map = (window as unknown as { __osirisItaliaMap?: maplibregl.Map }).__osirisItaliaMap;
        if (!map || !map.isStyleLoaded()) return;

        for (const [sourceId, bucket] of SOURCE_BUCKETS) {
          const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
          if (source) source.setData(featureCollection(payload[bucket] || []) as GeoJSON.FeatureCollection);
        }
      } catch {
        // Normal dashboard polling remains the fallback if a live refresh fails.
      } finally {
        running = false;
        if (!stopped) timer = setTimeout(tick, 20000);
      }
    };

    timer = setTimeout(tick, 3000);
    const onVisible = () => {
      if (!document.hidden) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(tick, 250);
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
