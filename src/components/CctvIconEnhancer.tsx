'use client';

import { useEffect } from 'react';

/**
 * OSIRIS Italia presentation bridge for public CCTV/webcam markers.
 * The core map uses green circles for CCTV; on a dense intelligence map those
 * are easily confused with generic entities. This overlays a compact camera
 * glyph while preserving the original source, click target and availability
 * colour underneath.
 */
export default function CctvIconEnhancer() {
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attachedMap: any = null;
    let styleHandler: (() => void) | null = null;

    const ensure = (map: any) => {
      if (!map?.isStyleLoaded?.() || !map.getSource?.('cctv')) return;

      // Keep a small green availability dot underneath instead of the oversized
      // circle that previously looked like an aircraft/entity marker.
      if (map.getLayer?.('cctv-dots')) {
        try {
          map.setPaintProperty('cctv-dots', 'circle-radius', [
            'interpolate', ['linear'], ['zoom'], 1, 3, 5, 4, 10, 5, 14, 6,
          ]);
          map.setPaintProperty('cctv-dots', 'circle-opacity', 0.75);
          map.setPaintProperty('cctv-dots', 'circle-stroke-width', 1.5);
        } catch {}
      }
      if (map.getLayer?.('cctv-glow')) {
        try {
          map.setPaintProperty('cctv-glow', 'circle-radius', [
            'interpolate', ['linear'], ['zoom'], 1, 5, 5, 7, 10, 10, 14, 13,
          ]);
          map.setPaintProperty('cctv-glow', 'circle-opacity', 0.22);
        } catch {}
      }

      if (!map.getLayer?.('osiris-italia-cctv-icons')) {
        try {
          map.addLayer({
            id: 'osiris-italia-cctv-icons',
            type: 'symbol',
            source: 'cctv',
            minzoom: 3,
            layout: {
              // Unicode camera avoids an external icon asset and survives style reloads.
              'text-field': '▣',
              'text-size': ['interpolate', ['linear'], ['zoom'], 3, 9, 6, 12, 10, 15, 14, 18],
              'text-font': ['Open Sans Bold'],
              'text-allow-overlap': true,
              'text-ignore-placement': true,
            },
            paint: {
              'text-color': '#E8FFF7',
              'text-halo-color': '#06110d',
              'text-halo-width': 2,
              'text-opacity': 0.98,
            },
          });
        } catch {}
      }
    };

    const attach = () => {
      if (stopped) return;
      const map = (window as any).__osirisItaliaMap;
      if (map) {
        if (attachedMap !== map) {
          if (attachedMap && styleHandler) attachedMap.off?.('styledata', styleHandler);
          attachedMap = map;
          styleHandler = () => ensure(map);
          map.on?.('styledata', styleHandler);
        }
        ensure(map);
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
