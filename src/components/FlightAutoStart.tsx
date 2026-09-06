'use client';

import { useEffect } from 'react';

const DEFAULT_LAYERS = [
  'flights',
  'maritime',
  'cctv',
  'cctv_previews',
  'live_news',
  'earthquakes',
  'global_incidents',
  'day_night',
  'cables',
  'sdk_sea',
  'sdk_air',
  'sdk_naval',
];

/**
 * Ensures the public live flight layer is enabled on a fresh dashboard load.
 * Existing shared/bookmarked URLs that already carry an explicit `layers`
 * selection are respected and left untouched.
 */
export default function FlightAutoStart() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    if (url.pathname !== '/' || url.searchParams.has('layers')) return;

    url.searchParams.set('layers', DEFAULT_LAYERS.join(','));
    window.location.replace(`${url.pathname}?${url.searchParams.toString()}${url.hash}`);
  }, []);

  return null;
}
