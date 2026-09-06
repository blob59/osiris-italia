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
        properties: { ...f },
      })),
  };
}

/**
 * Keeps the public ADS-B aircraft layer visibly live between the dashboard's
 * heavier background refreshes. It writes only positions actually returned by
 * /api/flights: no interpolation, prediction or synthetic movement.
 */
export default function LiveFlightRefresh() {
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const layers = (params.get('layers') || '').split(',').filter(Boolean);
        const aviationOn = layers.some((l) => ['flights', 'private', 'jets', 'military'].includes(l));
        if (!aviationOn) return;

        const res = await fetch(`/api/flights?live=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok || stopped) return;
        const payload = (await res.json()) as FlightPayload;

        const map = (window as unknown as { __osirisItaliaMap?: maplibregl.Map }).__osirisItaliaMap;
        if (!map) return;

        for (const [sourceId, bucket] of SOURCE_BUCKETS) {
          const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
          if (source) source.setData(featureCollection(payload[bucket] || []) as GeoJSON.FeatureCollection);
        }
      } catch {
        // The dashboard's normal polling remains the fallback.
      } finally {
        if (!stopped) timer = setTimeout(tick, 30000);
      }
    };

    timer = setTimeout(tick, 6000);
    const onVisible = () => {
      if (!document.hidden) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(tick, 500);
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
