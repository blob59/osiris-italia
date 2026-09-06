'use client';

import { useEffect } from 'react';

/**
 * Makes the existing MapLibre aircraft symbols readable on small screens.
 * OsirisMap already draws real aircraft silhouettes and rotates them with the
 * ADS-B heading; at continent zoom the old 24px icon scaled down to ~10px,
 * which looked like a dot on a phone. This only changes presentation.
 */
export default function AircraftIconEnhancer() {
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attachedMap: any = null;

    const layerIds = ['fl-commercial', 'fl-private', 'fl-jets', 'fl-military'];

    const apply = (map: any) => {
      if (!map || !map.isStyleLoaded?.()) return;
      for (const id of layerIds) {
        if (!map.getLayer?.(id)) continue;
        try {
          // Bigger at Europe/Italy overview, then grows gently when zooming in.
          map.setLayoutProperty(id, 'icon-size', [
            'interpolate', ['linear'], ['zoom'],
            1, 0.72,
            4, 0.90,
            6, 1.08,
            10, 1.28,
          ]);
          map.setLayoutProperty(id, 'icon-allow-overlap', true);
          map.setLayoutProperty(id, 'icon-ignore-placement', true);
          map.setPaintProperty(id, 'icon-opacity', 0.98);
        } catch {
          // Style may be rebuilding; the styledata listener retries.
        }
      }
    };

    const attach = () => {
      if (stopped) return;
      const map = (window as any).__osirisItaliaMap;
      if (map) {
        if (attachedMap !== map) {
          attachedMap = map;
          map.on?.('styledata', () => apply(map));
          map.on?.('idle', () => apply(map));
        }
        apply(map);
      }
      timer = setTimeout(attach, 1200);
    };

    attach();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return null;
}
