'use client';

import { useEffect } from 'react';

/**
 * Makes every MapLibre aircraft symbol unmistakable at Europe/Italy overview.
 * The core map already uses aircraft icons rotated by ADS-B heading; this
 * presentation bridge enlarges those icons and adds a dark halo so they do not
 * collapse visually into dots against dense OSINT layers.
 */
export default function AircraftIconEnhancer() {
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attachedMap: any = null;
    let styleHandler: (() => void) | null = null;

    const layerIds = ['fl-commercial', 'fl-private', 'fl-jets', 'fl-military'];

    const apply = (map: any) => {
      if (!map || !map.isStyleLoaded?.()) return;
      for (const id of layerIds) {
        if (!map.getLayer?.(id)) continue;
        try {
          map.setLayoutProperty(id, 'icon-size', [
            'interpolate', ['linear'], ['zoom'],
            1, 1.05,
            3, 1.18,
            5, 1.32,
            7, 1.48,
            10, 1.65,
          ]);
          map.setLayoutProperty(id, 'icon-rotate', ['coalesce', ['to-number', ['get', 'heading']], 0]);
          map.setLayoutProperty(id, 'icon-rotation-alignment', 'map');
          map.setLayoutProperty(id, 'icon-allow-overlap', true);
          map.setLayoutProperty(id, 'icon-ignore-placement', true);
          map.setPaintProperty(id, 'icon-opacity', 1);
          map.setPaintProperty(id, 'icon-halo-color', '#05070b');
          map.setPaintProperty(id, 'icon-halo-width', 1.5);
          map.setPaintProperty(id, 'icon-halo-blur', 0.5);
        } catch {
          // Style can be rebuilding; periodic retry below will reapply it.
        }
      }
    };

    const attach = () => {
      if (stopped) return;
      const map = (window as any).__osirisItaliaMap;
      if (map) {
        if (attachedMap !== map) {
          if (attachedMap && styleHandler) attachedMap.off?.('styledata', styleHandler);
          attachedMap = map;
          styleHandler = () => apply(map);
          map.on?.('styledata', styleHandler);
        }
        apply(map);
      }
      timer = setTimeout(attach, 1000);
    };

    attach();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      if (attachedMap && styleHandler) attachedMap.off?.('styledata', styleHandler);
    };
  }, []);

  return null;
}
