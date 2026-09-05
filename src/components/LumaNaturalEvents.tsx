'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Flame, Loader2, Sparkles, X } from 'lucide-react';
import { pushLumaContext } from '@/lib/luma-context';

type Earthquake = {
  id: string;
  lat: number;
  lng: number;
  depth: number;
  magnitude: number;
  place: string;
  time: number;
  tsunami?: number;
  felt?: number | null;
  alert?: string | null;
};

type Fire = {
  lat: number;
  lng: number;
  brightness: number;
  confidence?: string;
  date?: string;
  time?: string;
  frp?: number;
  title?: string;
  type?: 'fire' | 'volcano';
};

export default function LumaNaturalEvents() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [fires, setFires] = useState<Fire[]>([]);
  const [error, setError] = useState('');

  async function loadEvents() {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const [eqRes, fireRes] = await Promise.all([
        fetch('/api/earthquakes', { cache: 'no-store' }),
        fetch('/api/fires', { cache: 'no-store' }),
      ]);
      const [eqData, fireData] = await Promise.all([
        eqRes.ok ? eqRes.json() : Promise.resolve({ earthquakes: [] }),
        fireRes.ok ? fireRes.json() : Promise.resolve({ fires: [] }),
      ]);
      setEarthquakes(Array.isArray(eqData?.earthquakes) ? eqData.earthquakes : []);
      setFires(Array.isArray(fireData?.fires) ? fireData.fires : []);
      if (!eqRes.ok && !fireRes.ok) setError('Le fonti naturali non sono disponibili in questo momento.');
    } catch {
      setError('Non riesco a caricare adesso i dati naturali.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && earthquakes.length === 0 && fires.length === 0) void loadEvents();
  }, [open]);

  const topEarthquakes = useMemo(
    () => [...earthquakes].sort((a, b) => (b.magnitude ?? 0) - (a.magnitude ?? 0)).slice(0, 5),
    [earthquakes],
  );
  const topFires = useMemo(
    () => [...fires].sort((a, b) => (b.frp ?? b.brightness ?? 0) - (a.frp ?? a.brightness ?? 0)).slice(0, 5),
    [fires],
  );

  function selectEarthquake(eq: Earthquake) {
    pushLumaContext({
      kind: 'earthquake',
      label: `Terremoto M${eq.magnitude} · ${eq.place || 'località non disponibile'}`,
      summary: 'Evento sismico da feed pubblico USGS delle ultime 24 ore. I dati possono essere aggiornati o rivisti dalla fonte.',
      lat: eq.lat,
      lng: eq.lng,
      data: {
        id: eq.id,
        magnitude: eq.magnitude,
        place: eq.place,
        depthKm: eq.depth,
        eventTime: eq.time ? new Date(eq.time).toISOString() : null,
        tsunamiFlag: Boolean(eq.tsunami),
        feltReports: eq.felt ?? null,
        alert: eq.alert ?? null,
        source: 'USGS',
      },
    });
    setOpen(false);
  }

  function selectFire(fire: Fire, index: number) {
    pushLumaContext({
      kind: 'wildfire',
      label: fire.type === 'volcano' ? (fire.title || 'Evento vulcanico NASA') : `Punto termico NASA ${index + 1}`,
      summary: fire.type === 'volcano'
        ? 'Evento vulcanico da NASA EONET.'
        : 'Rilevamento termico da NASA FIRMS. Un punto caldo satellitare non equivale automaticamente a un incendio confermato al suolo.',
      lat: fire.lat,
      lng: fire.lng,
      data: {
        type: fire.type || 'fire',
        brightness: fire.brightness ?? null,
        confidence: fire.confidence ?? null,
        frp: fire.frp ?? null,
        acquisitionDate: fire.date ?? null,
        acquisitionTime: fire.time ?? null,
        title: fire.title ?? null,
        source: fire.type === 'volcano' ? 'NASA EONET' : 'NASA FIRMS',
      },
    });
    setOpen(false);
  }

  return (
    <div className="fixed bottom-4 left-4 z-[10000] pointer-events-auto font-mono">
      {open ? (
        <div className="w-[min(92vw,370px)] max-h-[70vh] overflow-hidden rounded-xl border border-white/10 bg-[#07080d]/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div>
              <div className="text-sm font-semibold text-white">Eventi naturali</div>
              <div className="text-[10px] text-white/45">Seleziona un evento e passalo a Luma</div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded hover:bg-white/10 text-white/60" aria-label="Chiudi eventi naturali"><X className="w-4 h-4" /></button>
          </div>

          <div className="max-h-[58vh] overflow-y-auto p-3 space-y-4">
            {loading && <div className="flex items-center gap-2 text-xs text-white/55"><Loader2 className="w-4 h-4 animate-spin" /> Caricamento fonti NASA/USGS…</div>}
            {error && <div className="text-xs text-amber-300/80">{error}</div>}

            {!loading && (
              <>
                <section>
                  <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-[0.14em] text-white/45"><Activity className="w-3.5 h-3.5" /> Terremoti più forti</div>
                  <div className="space-y-1.5">
                    {topEarthquakes.map((eq) => (
                      <button key={eq.id} onClick={() => selectEarthquake(eq)} className="w-full text-left rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/[0.05] transition-colors">
                        <div className="text-xs text-white">M{eq.magnitude} · {eq.place || 'Località non disponibile'}</div>
                        <div className="mt-0.5 text-[10px] text-white/40">Profondità {Number.isFinite(eq.depth) ? `${eq.depth} km` : 'n/d'}</div>
                      </button>
                    ))}
                    {topEarthquakes.length === 0 && <div className="text-[10px] text-white/35">Nessun terremoto disponibile.</div>}
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-[0.14em] text-white/45"><Flame className="w-3.5 h-3.5" /> Punti termici / vulcani</div>
                  <div className="space-y-1.5">
                    {topFires.map((fire, index) => (
                      <button key={`${fire.lat}-${fire.lng}-${index}`} onClick={() => selectFire(fire, index)} className="w-full text-left rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/[0.05] transition-colors">
                        <div className="text-xs text-white">{fire.type === 'volcano' ? (fire.title || 'Evento vulcanico') : `Punto termico · ${fire.lat.toFixed(3)}, ${fire.lng.toFixed(3)}`}</div>
                        <div className="mt-0.5 text-[10px] text-white/40">{fire.type === 'volcano' ? 'NASA EONET' : `NASA FIRMS · FRP ${fire.frp ?? 'n/d'}`}</div>
                      </button>
                    ))}
                    {topFires.length === 0 && <div className="text-[10px] text-white/35">Nessun punto termico disponibile.</div>}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-full border border-white/15 bg-[#07080d]/95 px-4 py-3 shadow-xl backdrop-blur hover:border-[#D4AF37]/45 transition-colors" aria-label="Apri eventi naturali">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-xs font-semibold text-white">Eventi → Luma</span>
        </button>
      )}
    </div>
  );
}
