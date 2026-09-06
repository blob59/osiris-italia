'use client';

import { useEffect, useState } from 'react';
import { Plane } from 'lucide-react';

function readLayers(url: URL) {
  return (url.searchParams.get('layers') || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}

export default function MobileAviationQuickToggle() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    setActive(readLayers(url).includes('flights'));
  }, []);

  const enableFlights = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const layers = new Set(readLayers(url));
    layers.add('flights');
    url.searchParams.set('layers', [...layers].join(','));
    window.location.replace(url.toString());
  };

  return (
    <button
      type="button"
      onClick={enableFlights}
      className="md:hidden fixed left-3 top-[76px] z-[12050] flex items-center gap-2 rounded-full border px-3 py-2 font-mono text-[11px] font-semibold tracking-wide shadow-xl backdrop-blur-xl"
      style={{
        background: active ? 'rgba(0,229,255,0.16)' : 'rgba(7,8,13,0.94)',
        borderColor: active ? 'rgba(0,229,255,0.65)' : 'rgba(212,175,55,0.55)',
        color: active ? '#9ff7ff' : '#f3d66b',
      }}
      aria-label="Attiva voli commerciali"
      title="Attiva voli commerciali"
    >
      <Plane className="h-4 w-4" />
      <span>{active ? 'AEREI ATTIVI' : 'MOSTRA AEREI'}</span>
    </button>
  );
}
