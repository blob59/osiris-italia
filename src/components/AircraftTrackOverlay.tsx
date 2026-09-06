'use client';

import { useLayoutEffect } from 'react';
import maplibregl from 'maplibre-gl';

type WatchRequest = { icao24: string; callsign?: string };
type TrackRow = { icao24: string; callsign: string; coordinates: [number, number][] };
type AircraftDetail = { track?: [number, number][] };

declare global {
  interface Window {
    osirisWatchFlight?: (flight: WatchRequest) => void;
    __osirisItaliaMap?: maplibregl.Map;
    __osirisItaliaTrackBridgeInstalled?: boolean;
  }
}

const SOURCE_ID = 'osiris-italia-aircraft-tracks';
const HALO_ID = 'osiris-italia-aircraft-tracks-halo';
const LINE_ID = 'osiris-italia-aircraft-tracks-line';
const LABEL_ID = 'osiris-italia-aircraft-tracks-label';

function featureCollection(rows: TrackRow[]): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  return {
    type: 'FeatureCollection',
    features: rows.map(row => ({
      type: 'Feature',
      properties: { icao24: row.icao24, callsign: row.callsign },
      geometry: { type: 'LineString', coordinates: row.coordinates },
    })),
  };
}

function ensureLayers(map: maplibregl.Map) {
  if (!map.isStyleLoaded()) return false;
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, { type: 'geojson', data: featureCollection([]) });
  }
  if (!map.getLayer(HALO_ID)) {
    map.addLayer({
      id: HALO_ID,
      type: 'line',
      source: SOURCE_ID,
      paint: { 'line-color': '#05070b', 'line-width': 7, 'line-opacity': 0.72 },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    });
  }
  if (!map.getLayer(LINE_ID)) {
    map.addLayer({
      id: LINE_ID,
      type: 'line',
      source: SOURCE_ID,
      paint: { 'line-color': '#35d8ff', 'line-width': 3, 'line-opacity': 0.95 },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    });
  }
  if (!map.getLayer(LABEL_ID)) {
    map.addLayer({
      id: LABEL_ID,
      type: 'symbol',
      source: SOURCE_ID,
      layout: {
        'symbol-placement': 'line-center',
        'text-field': ['get', 'callsign'],
        'text-size': 11,
        'text-allow-overlap': false,
      },
      paint: { 'text-color': '#b9f2ff', 'text-halo-color': '#05070b', 'text-halo-width': 1.5 },
    });
  }
  return true;
}

function drawRows(rows: TrackRow[]) {
  const map = window.__osirisItaliaMap;
  if (!map || !ensureLayers(map)) return;
  const src = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  src?.setData(featureCollection(rows));
}

async function loadTrack(flight: WatchRequest): Promise<TrackRow | null> {
  const icao24 = String(flight.icao24 || '').trim().toLowerCase();
  if (!/^[0-9a-f]{6}$/.test(icao24)) return null;
  try {
    const response = await fetch(`/api/aircraft?icao24=${encodeURIComponent(icao24)}`, { cache: 'no-store' });
    if (!response.ok) return null;
    const detail = await response.json() as AircraftDetail;
    const coordinates = Array.isArray(detail.track)
      ? detail.track.filter((p): p is [number, number] => Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]))
      : [];
    if (coordinates.length < 2) return null;
    return { icao24, callsign: flight.callsign?.trim() || icao24.toUpperCase(), coordinates };
  } catch {
    return null;
  }
}

/**
 * OSIRIS Italia aircraft-track bridge.
 * It draws only positions actually reported by the existing /api/aircraft endpoint.
 * No straight airport-to-airport line, interpolation or predicted future path is added.
 */
export default function AircraftTrackOverlay() {
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const proto = maplibregl.Map.prototype as maplibregl.Map & { addSource: maplibregl.Map['addSource'] };
    const originalAddSource = proto.addSource;
    if (!window.__osirisItaliaTrackBridgeInstalled) {
      window.__osirisItaliaTrackBridgeInstalled = true;
      proto.addSource = function(this: maplibregl.Map, ...args: Parameters<maplibregl.Map['addSource']>) {
        window.__osirisItaliaMap = this;
        return originalAddSource.apply(this, args);
      } as maplibregl.Map['addSource'];
    }

    const watched = new Map<string, WatchRequest>();
    const tracks = new Map<string, TrackRow>();
    let wrappedFn: Window['osirisWatchFlight'];
    let originalWatch: Window['osirisWatchFlight'];
    let stopped = false;

    const refreshOne = async (flight: WatchRequest) => {
      const row = await loadTrack(flight);
      if (stopped || !row) return;
      tracks.set(row.icao24, row);
      drawRows([...tracks.values()]);
    };

    const wrapWatch = () => {
      const current = window.osirisWatchFlight;
      if (!current || current === wrappedFn) return;
      originalWatch = current;
      wrappedFn = (flight: WatchRequest) => {
        originalWatch?.(flight);
        const icao24 = String(flight?.icao24 || '').toLowerCase();
        if (!/^[0-9a-f]{6}$/.test(icao24)) return;
        watched.set(icao24, { ...flight, icao24 });
        void refreshOne({ ...flight, icao24 });
      };
      window.osirisWatchFlight = wrappedFn;
    };

    const watchPoll = window.setInterval(wrapWatch, 400);
    wrapWatch();

    const refreshTimer = window.setInterval(() => {
      watched.forEach(flight => void refreshOne(flight));
    }, 120000);

    const onStyle = () => drawRows([...tracks.values()]);
    const stylePoll = window.setInterval(() => {
      const map = window.__osirisItaliaMap;
      if (map) {
        map.off('styledata', onStyle);
        map.on('styledata', onStyle);
        drawRows([...tracks.values()]);
      }
    }, 1500);

    return () => {
      stopped = true;
      window.clearInterval(watchPoll);
      window.clearInterval(refreshTimer);
      window.clearInterval(stylePoll);
      window.__osirisItaliaMap?.off('styledata', onStyle);
      if (window.osirisWatchFlight === wrappedFn && originalWatch) window.osirisWatchFlight = originalWatch;
    };
  }, []);

  return null;
}
