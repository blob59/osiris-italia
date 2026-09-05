'use client';

import { useEffect, useMemo, useState } from 'react';
import { Newspaper, Camera, Ship, Sparkles, Loader2, X } from 'lucide-react';
import { pushLumaContext } from '@/lib/luma-context';

type SourceTab = 'news' | 'cctv' | 'ships';

type NewsItem = { id?: string; title?: string; description?: string; source?: string; published?: string; link?: string; risk_score?: number; coords?: [number, number] | null };
type CameraItem = { id?: string; name?: string; city?: string; country?: string; source?: string; lat?: number; lng?: number; external_url?: string; feed_url?: string };
type ShipItem = { id?: string | number; mmsi?: string | number; name?: string; type?: string; lat?: number; lng?: number; speed?: number; heading?: number; timestamp?: number | string };

export default function SourcesToLumaPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<SourceTab>('news');
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [ships, setShips] = useState<ShipItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    const url = tab === 'news' ? '/api/news' : tab === 'cctv' ? '/api/cctv?region=italy' : '/api/maritime';
    fetch(url)
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (cancelled) return;
        if (tab === 'news') setNews(Array.isArray(data.news) ? data.news.slice(0, 20) : []);
        if (tab === 'cctv') setCameras(Array.isArray(data.cameras) ? data.cameras.slice(0, 30) : []);
        if (tab === 'ships') setShips(Array.isArray(data.ships) ? data.ships.slice(0, 30) : []);
      })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Errore sorgente'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, tab]);

  const items = useMemo(() => tab === 'news' ? news : tab === 'cctv' ? cameras : ships, [tab, news, cameras, ships]);

  function sendNews(item: NewsItem) {
    const coords = item.coords;
    pushLumaContext({
      kind: 'news',
      label: `Notizia: ${item.title || 'senza titolo'}`,
      summary: 'Notizia proveniente da una fonte OSINT/RSS della piattaforma. Il punteggio di rischio è un indicatore automatico, non una verifica indipendente del contenuto.',
      lat: coords?.[0], lng: coords?.[1],
      data: { title: item.title || null, description: item.description || null, source: item.source || null, published: item.published || null, link: item.link || null, riskScore: item.risk_score ?? null },
    });
  }

  function sendCamera(item: CameraItem) {
    pushLumaContext({
      kind: 'generic',
      label: `Webcam pubblica: ${item.name || item.city || 'camera'}`,
      summary: 'Webcam pubblica indicizzata da OSIRIS Italia. Luma riceve solo metadati e posizione; non deve dedurre identità delle persone riprese.',
      lat: item.lat, lng: item.lng,
      data: { type: 'public-webcam', id: item.id || null, name: item.name || null, city: item.city || null, country: item.country || null, source: item.source || null, feedUrl: item.feed_url || null, externalUrl: item.external_url || null },
    });
  }

  function sendShip(item: ShipItem) {
    pushLumaContext({
      kind: 'generic',
      label: `Nave: ${item.name || item.mmsi || item.id || 'AIS'}`,
      summary: 'Traccia AIS pubblica disponibile nella piattaforma. Posizione e telemetria possono essere incomplete, ritardate o assenti; non usarle come dato tattico in tempo reale.',
      lat: item.lat, lng: item.lng,
      data: { type: 'vessel', id: item.id ?? null, mmsi: item.mmsi ?? null, name: item.name || null, vesselType: item.type || null, speed: item.speed ?? null, heading: item.heading ?? null, observedAt: item.timestamp ?? null },
    });
  }

  function send(item: NewsItem | CameraItem | ShipItem) {
    if (tab === 'news') sendNews(item as NewsItem);
    if (tab === 'cctv') sendCamera(item as CameraItem);
    if (tab === 'ships') sendShip(item as ShipItem);
  }

  return (
    <div className="fixed bottom-4 left-4 z-[10000] pointer-events-auto font-mono">
      {open ? (
        <div className="w-[min(92vw,430px)] max-h-[68vh] rounded-xl border border-white/15 bg-[#07080d]/95 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs text-white"><Sparkles className="w-4 h-4 text-[#D4AF37]"/> Sorgenti → Luma</div>
            <button onClick={() => setOpen(false)} className="p-1 text-white/50 hover:text-white" aria-label="Chiudi"><X className="w-4 h-4"/></button>
          </div>
          <div className="grid grid-cols-3 gap-1 p-2 border-b border-white/10">
            <button onClick={() => setTab('news')} className={`px-2 py-2 rounded text-[10px] ${tab === 'news' ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'text-white/55 hover:bg-white/5'}`}><Newspaper className="w-3 h-3 inline mr-1"/>Notizie</button>
            <button onClick={() => setTab('cctv')} className={`px-2 py-2 rounded text-[10px] ${tab === 'cctv' ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'text-white/55 hover:bg-white/5'}`}><Camera className="w-3 h-3 inline mr-1"/>Webcam IT</button>
            <button onClick={() => setTab('ships')} className={`px-2 py-2 rounded text-[10px] ${tab === 'ships' ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'text-white/55 hover:bg-white/5'}`}><Ship className="w-3 h-3 inline mr-1"/>Navi AIS</button>
          </div>
          <div className="max-h-[52vh] overflow-y-auto p-2 space-y-1.5">
            {loading && <div className="py-8 flex justify-center items-center gap-2 text-xs text-white/50"><Loader2 className="w-4 h-4 animate-spin"/> Caricamento…</div>}
            {!loading && error && <div className="p-3 text-xs text-red-300">Sorgente non disponibile: {error}</div>}
            {!loading && !error && items.length === 0 && <div className="p-4 text-xs text-white/45">Nessun dato disponibile in questo momento.{tab === 'ships' ? ' Le navi live richiedono anche il feed AIS configurato sul server.' : ''}</div>}
            {!loading && !error && items.map((raw, i) => {
              const item: any = raw;
              const title = tab === 'news' ? item.title : tab === 'cctv' ? (item.name || item.city) : (item.name || item.mmsi || item.id);
              const sub = tab === 'news' ? `${item.source || 'fonte'}${item.published ? ` · ${new Date(item.published).toLocaleString('it-IT')}` : ''}` : tab === 'cctv' ? [item.city, item.country, item.source].filter(Boolean).join(' · ') : [item.type, item.mmsi ? `MMSI ${item.mmsi}` : null, typeof item.speed === 'number' ? `${item.speed} kn` : null].filter(Boolean).join(' · ');
              return <button key={`${tab}-${item.id || item.mmsi || i}`} onClick={() => send(raw as any)} className="w-full text-left rounded-lg border border-white/10 bg-white/[0.03] hover:border-[#D4AF37]/35 hover:bg-[#D4AF37]/[0.05] p-2.5 transition-colors">
                <div className="text-[11px] text-white/85 line-clamp-2">{title || 'Elemento senza nome'}</div>
                <div className="mt-1 text-[9px] text-white/40 line-clamp-1">{sub || 'Dati pubblici OSIRIS'}</div>
              </button>;
            })}
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-full border border-white/20 bg-[#07080d]/95 px-4 py-3 shadow-xl backdrop-blur hover:border-[#D4AF37]/60" aria-label="Apri sorgenti per Luma"><Sparkles className="w-4 h-4 text-[#D4AF37]"/><span className="text-xs font-semibold text-white">Sorgenti → Luma</span></button>
      )}
    </div>
  );
}
