'use client';

import { useEffect, useState } from 'react';
import { X, Plane, Gauge, ArrowUp, Radio, Crosshair, Loader2, Sparkles } from 'lucide-react';
import { pushLumaContext } from '@/lib/luma-context';

export interface WatchedFlight { icao24: string; callsign: string; category?: string; }
export interface FlightTelemetry { lat: number; lng: number; alt: number; speed_knots: number; heading: number; grounded?: boolean; squawk?: string; }
export interface Airport { icao: string; iata?: string; city?: string; lat: number; lng: number; }
export interface AircraftDetail {
  icao24: string; registration: string | null; typeCode: string | null; model: string | null; operator: string | null;
  track: [number, number][]; points: number; departure?: Airport | null; arrival?: Airport | null; origin?: Airport | null; destination?: Airport | null;
}
export interface ScheduledRoute { found?: boolean; origin?: Airport | null; destination?: Airport | null; }

const R_KM = 6371;
export function greatCircleKm(a: [number, number], b: [number, number]): number {
  const t = Math.PI / 180; const dLat = (b[1] - a[1]) * t; const dLng = (b[0] - a[0]) * t;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * t) * Math.cos(b[1] * t) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.sqrt(h));
}
const sameAirport = (a: Airport, b: Airport) => a.icao === b.icao || (Boolean(a.iata) && a.iata === b.iata);
export function onCorridor(here: [number, number], origin: Airport, destination: Airport): boolean {
  const direct = greatCircleKm([origin.lng, origin.lat], [destination.lng, destination.lat]);
  const detour = greatCircleKm([origin.lng, origin.lat], here) + greatCircleKm(here, [destination.lng, destination.lat]);
  return detour <= direct * 1.15 + 150;
}
export function resolveEndpoints(ac: AircraftDetail, schedule: ScheduledRoute | null): { origin: Airport | null; destination: Airport | null } {
  const observedDep = ac.departure || null; const observedArr = ac.arrival || null; const sched = schedule?.found ? schedule : null;
  const here = ac.track.length ? ac.track[ac.track.length - 1] : null;
  if (observedDep && observedArr) return { origin: observedDep, destination: observedArr };
  let destination: Airport | null = observedArr;
  if (!destination && sched?.origin && sched?.destination && here) {
    const corroborated = observedDep ? sameAirport(observedDep, sched.origin) : onCorridor(here, sched.origin, sched.destination);
    if (corroborated) destination = sched.destination;
  }
  return { origin: observedDep, destination };
}
interface FlightWatchPanelProps { watched: WatchedFlight[]; telemetry: Record<string, FlightTelemetry>; onRemove: (icao24: string) => void; onLocate: (lat: number, lng: number) => void; onDetail: (icao24: string, detail: AircraftDetail | null) => void; }
export function toFeet(metres: number): number { return Math.round((metres * 3.28084) / 25) * 25; }
export function formatAlt(metres: number | undefined, grounded?: boolean): string {
  if (grounded) return 'A terra'; if (typeof metres !== 'number' || !Number.isFinite(metres)) return '—'; return `${toFeet(metres).toLocaleString()} ft`;
}

function Row({ flight, telem, onRemove, onLocate, onDetail }: { flight: WatchedFlight; telem?: FlightTelemetry; onRemove: (icao24: string) => void; onLocate: (lat: number, lng: number) => void; onDetail: (icao24: string, d: AircraftDetail | null) => void; }) {
  const [detail, setDetail] = useState<AircraftDetail | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false; const cs = (flight.callsign || '').replace(/\s+/g, '');
    Promise.all([
      fetch(`/api/aircraft?icao24=${flight.icao24}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      cs ? fetch(`/api/flight-route?callsign=${encodeURIComponent(cs)}&icao24=${flight.icao24}`).then((r) => (r.ok ? r.json() : null)).catch(() => null) : Promise.resolve(null),
    ]).then(([ac, route]) => {
      if (cancelled) return; const base = ac && !ac.error ? (ac as AircraftDetail) : null;
      const merged = base ? { ...base, ...resolveEndpoints(base, route as ScheduledRoute | null) } : null;
      setDetail(merged); setLoading(false); onDetail(flight.icao24, merged);
    });
    return () => { cancelled = true; };
  }, [flight.icao24, flight.callsign, onDetail]);

  function sendToLuma() {
    const callsign = (flight.callsign || '').trim() || flight.icao24.toUpperCase();
    pushLumaContext({
      kind: 'aircraft', label: `Velivolo ${callsign}`,
      summary: 'Velivolo selezionato dal pannello di osservazione. I dati sono telemetria pubblica disponibile e possono essere incompleti o ritardati.',
      lat: telem?.lat, lng: telem?.lng,
      data: {
        icao24: flight.icao24.toUpperCase(), callsign, category: flight.category || null,
        registration: detail?.registration || null, typeCode: detail?.typeCode || null, model: detail?.model || null, operator: detail?.operator || null,
        altitudeFeet: telem ? toFeet(telem.alt) : null, speedKnots: telem?.speed_knots ?? null, heading: telem?.heading ?? null, grounded: telem?.grounded ?? null,
        squawk: telem?.squawk || null,
        origin: detail?.origin ? (detail.origin.iata || detail.origin.icao) : null,
        destination: detail?.destination ? (detail.destination.iata || detail.destination.icao) : null,
        routeStatus: detail?.arrival ? 'osservato-atterrato' : detail?.destination ? 'destinazione-programmata-corroborata' : 'destinazione-non-disponibile',
        trackPoints: detail?.points ?? null,
      },
    });
  }

  return <div className="glass-panel overflow-hidden" style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}>
    <header className="flex items-center gap-2 px-2.5 h-8 border-b border-[var(--border-secondary)]">
      <Plane className="w-3 h-3 text-[var(--cyan-primary)]"/><span className="text-[10px] text-[var(--text-primary)] tracking-wide truncate">{flight.callsign || flight.icao24.toUpperCase()}</span>
      <span className="text-[9px] text-[var(--text-muted)] tabular-nums ml-auto">{flight.icao24.toUpperCase()}</span>
      {telem && <button onClick={() => onLocate(telem.lat, telem.lng)} title="Centra questo velivolo" className="p-0.5 text-[var(--text-muted)] hover:text-[var(--cyan-primary)]"><Crosshair className="w-3 h-3"/></button>}
      <button onClick={sendToLuma} title="Analizza con Luma" className="p-0.5 text-[var(--text-muted)] hover:text-[var(--gold-primary)]"><Sparkles className="w-3 h-3"/></button>
      <button onClick={() => onRemove(flight.icao24)} title="Smetti di osservare" aria-label={`Smetti di osservare ${flight.callsign || flight.icao24}`} className="p-0.5 text-[var(--text-muted)] hover:text-[var(--alert-red)]"><X className="w-3 h-3"/></button>
    </header>
    <div className="px-2.5 py-2">
      {loading ? <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]"><Loader2 className="w-3 h-3 animate-spin"/> Identificazione velivolo…</div> : <><div className="text-[11px] text-[var(--text-primary)] leading-snug">{detail?.model || 'Tipo non identificato'}</div><div className="flex flex-wrap gap-x-2.5 gap-y-0.5 mt-0.5 text-[9px] text-[var(--text-muted)]">{detail?.registration && <span>{detail.registration}</span>}{detail?.typeCode && <span>{detail.typeCode}</span>}{detail?.operator && <span className="truncate max-w-[170px]">{detail.operator}</span>}</div></>}
      <div className="grid grid-cols-3 gap-1.5 mt-2"><div className="flex items-center gap-1"><ArrowUp className="w-2.5 h-2.5 text-[var(--text-muted)]"/><span className="text-[10px] text-[var(--text-secondary)]">{formatAlt(telem?.alt, telem?.grounded)}</span></div><div className="flex items-center gap-1"><Gauge className="w-2.5 h-2.5 text-[var(--text-muted)]"/><span className="text-[10px] text-[var(--text-secondary)]">{telem ? `${Math.round(telem.speed_knots)} kt` : '—'}</span></div><div className="flex items-center gap-1"><Radio className="w-2.5 h-2.5 text-[var(--text-muted)]"/><span className="text-[10px] text-[var(--text-secondary)]">{telem?.squawk || '—'}</span></div></div>
      {(detail?.origin || detail?.destination) && <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-[var(--border-secondary)]"><span className="text-[11px] text-[var(--text-primary)]">{detail.origin ? detail.origin.iata || detail.origin.icao : '····'}</span><span className="text-[10px] text-[var(--text-muted)]">→</span><span className="text-[11px] text-[var(--text-primary)]">{detail.destination ? detail.destination.iata || detail.destination.icao : '····'}</span><span className="text-[9px] text-[var(--text-muted)] ml-auto">{detail.arrival ? 'atterrato' : detail.destination ? 'programmato' : 'destinazione ignota'}</span></div>}
      {detail && detail.points > 0 && <div className="mt-1.5 text-[9px] text-[var(--text-muted)]">{detail.points} punti della traccia</div>}
      {!telem && <div className="mt-1.5 text-[9px] text-[var(--alert-orange)]">Non più presente nel feed live</div>}
    </div>
  </div>;
}
export default function FlightWatchPanel({ watched, telemetry, onRemove, onLocate, onDetail }: FlightWatchPanelProps) {
  if (watched.length === 0) return null;
  return <div className="flex flex-col gap-1.5">{watched.map((f) => <Row key={f.icao24} flight={f} telem={telemetry[f.icao24]} onRemove={onRemove} onLocate={onLocate} onDetail={onDetail}/>)}</div>;
}
