'use client';

import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, Satellite, Sun, AlertTriangle, Camera,
  CloudLightning, Ship, Network, Ghost, Megaphone, SlidersHorizontal
} from 'lucide-react';
import StyleStudio from './StyleStudio';

interface LayerPanelProps {
  data: any;
  activeLayers: any;
  setActiveLayers: React.Dispatch<React.SetStateAction<any>>;
  isMobile?: boolean;
  theme?: 'core' | 'ghost';
  setTheme?: (theme: 'core' | 'ghost') => void;
  capabilities?: Record<string, boolean>;
}

interface LayerDef {
  key: string;
  label: string;
  dataKey: string;
  catKey?: string;
  requires?: string;
  parent?: string;
}

interface LayerGroupDef {
  label: string;
  fullLabel: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  layers: LayerDef[];
}

const LAYER_GROUPS: LayerGroupDef[] = [
  {
    label: 'SDK',
    fullLabel: 'OSIRIS SDK',
    icon: Network,
    layers: [
      { key: 'sdk_sea', label: 'Rotte marittime', dataKey: 'sdk_entities' },
    ],
  },
  {
    label: 'AVIAZIONE',
    fullLabel: 'AVIAZIONE',
    icon: Plane,
    layers: [
      { key: 'flights', label: 'Voli commerciali', dataKey: 'commercial_flights' },
      { key: 'private', label: 'Voli privati', dataKey: 'private_flights' },
      { key: 'jets', label: 'Jet privati', dataKey: 'private_jets' },
      { key: 'military', label: 'Voli militari', dataKey: 'military_flights' },
    ],
  },
  {
    label: 'MARE',
    fullLabel: 'TRAFFICO MARITTIMO',
    icon: Ship,
    layers: [
      { key: 'maritime', label: 'Navi / traffico navale', dataKey: 'maritime_ships,maritime_ports,maritime_chokepoints' },
    ],
  },
  {
    label: 'SPAZIO',
    fullLabel: 'MONITORAGGIO SPAZIALE',
    icon: Satellite,
    layers: [
      { key: 'satellites', label: 'Tutti i satelliti', dataKey: 'satellites' },
      { key: 'sat_comms', label: 'Starlink / comunicazioni', dataKey: 'satellites', catKey: 'comms' },
      { key: 'sat_military', label: 'Militari / intelligence', dataKey: 'satellites', catKey: 'military' },
      { key: 'sat_navigation', label: 'GPS / navigazione', dataKey: 'satellites', catKey: 'navigation' },
      { key: 'sat_earth', label: 'Osservazione terrestre', dataKey: 'satellites', catKey: 'earth_obs' },
      { key: 'sat_science', label: 'Stazioni / telescopi', dataKey: 'satellites', catKey: 'science' },
    ],
  },
  {
    label: 'CAMERE',
    fullLabel: 'SORVEGLIANZA PUBBLICA',
    icon: Camera,
    layers: [
      { key: 'cctv', label: 'Telecamere pubbliche', dataKey: 'cameras' },
      { key: 'cctv_previews', label: 'Anteprime live', dataKey: '', parent: 'cctv' },
      { key: 'live_news', label: 'Notizie in diretta', dataKey: 'live_feeds' },
    ],
  },
  {
    label: 'EVENTI',
    fullLabel: 'EVENTI NATURALI',
    icon: CloudLightning,
    layers: [
      { key: 'earthquakes', label: 'Terremoti', dataKey: 'earthquakes' },
      { key: 'fires', label: 'Incendi attivi', dataKey: 'fires' },
      { key: 'weather', label: 'Meteo estremo', dataKey: 'weather_events' },
    ],
  },
  {
    label: 'RISCHI',
    fullLabel: 'RISCHI E INTELLIGENCE',
    icon: AlertTriangle,
    layers: [
      { key: 'infrastructure', label: 'Impianti nucleari', dataKey: 'infrastructure' },
      { key: 'global_incidents', label: 'Incidenti globali', dataKey: 'gdelt' },
      { key: 'gdelt_events', label: 'Eventi GDELT', dataKey: 'gdelt_events' },
    ],
  },
  {
    label: 'RETE',
    fullLabel: 'INTELLIGENCE DI RETE',
    icon: Network,
    layers: [
      { key: 'malware', label: 'Malware in tempo reale', dataKey: 'malware_threats' },
      { key: 'cyber_attacks', label: 'Attacchi in tempo reale', dataKey: 'cyber_attacks' },
    ],
  },
  {
    label: 'INTERNET',
    fullLabel: 'INTERNET ED EVENTI',
    icon: Megaphone,
    layers: [
      { key: 'cf_outages', label: 'Interruzioni Internet', dataKey: 'cf_outages', requires: 'cloudflare' },
      { key: 'cf_attacks', label: 'Origine degli attacchi', dataKey: 'cf_attack_origins', requires: 'cloudflare' },
    ],
  },
  {
    label: 'VISTA',
    fullLabel: 'VISUALIZZAZIONE',
    icon: Sun,
    layers: [
      { key: 'day_night', label: 'Ciclo giorno / notte', dataKey: '' },
      { key: 'terrain_3d', label: 'Terreno ed edifici 3D', dataKey: '' },
    ],
  },
];

function ToggleSwitch({ active }: { active: boolean }) {
  return (
    <span role="presentation" className="relative flex-shrink-0 block" style={{ width: 28, height: 14 }}>
      <div
        className="absolute inset-0 rounded-full transition-all duration-300"
        style={{
          background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
          border: active ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.12)',
          boxShadow: active ? '0 0 8px rgba(255,255,255,0.1)' : 'none',
        }}
      />
      <motion.div
        className="absolute top-[2px] rounded-full"
        style={{
          width: 10,
          height: 10,
          background: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)',
          boxShadow: active ? '0 0 6px rgba(255,255,255,0.4)' : 'none',
        }}
        animate={{ left: active ? 16 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </span>
  );
}

function SubLayerStem() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-[6px] top-0 h-1/2 w-[8px] rounded-bl-[3px] border-b border-l border-white/[0.14]"
    />
  );
}

function LayerPanel({ data, activeLayers, setActiveLayers, isMobile, theme = 'core', setTheme, capabilities = {} }: LayerPanelProps) {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [pinnedGroup, setPinnedGroup] = useState<string | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);

  useEffect(() => {
    if (!pinnedGroup) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPinnedGroup(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pinnedGroup]);

  const toggle = (key: string) => setActiveLayers((prev: any) => ({ ...prev, [key]: !prev[key] }));

  const toggleGroup = (layers: LayerDef[]) => {
    const anyOn = layers.some(l => activeLayers[l.key]);
    setActiveLayers((prev: any) => {
      const next = { ...prev };
      for (const l of layers) next[l.key] = !anyOn;
      return next;
    });
  };

  const visibleGroups = LAYER_GROUPS.map(g => ({
    ...g,
    layers: g.layers.filter(l => !l.requires || capabilities[l.requires]),
  })).filter(g => g.layers.length > 0);

  const getCount = (dk: string, catKey?: string): number | null => {
    if (!dk) return null;
    if (catKey && data.category_counts) return data.category_counts[catKey] || 0;
    let total = 0;
    let found = false;
    for (const k of dk.split(',')) {
      if (data[k] && Array.isArray(data[k])) {
        total += data[k].length;
        found = true;
      }
    }
    return found ? total : null;
  };

  if (isMobile) {
    return (
      <div className="flex flex-col gap-5 py-2">
        {visibleGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/30 border-b border-white/[0.06] pb-1.5">
              {group.fullLabel}
            </div>
            <div className="flex flex-col gap-1">
              {group.layers.map((layer) => {
                const isLayerActive = activeLayers[layer.key];
                const count = getCount(layer.dataKey, layer.catKey);
                const dormant = !!layer.parent && !activeLayers[layer.parent];
                return (
                  <button
                    key={layer.key}
                    onClick={() => toggle(layer.key)}
                    aria-pressed={!!isLayerActive}
                    className={`relative w-full flex items-center gap-3 py-2 rounded-md text-left hover:bg-white/[0.04] transition-colors ${layer.parent ? 'pl-[22px] pr-1' : 'px-1'} ${dormant ? 'opacity-40' : ''}`}
                  >
                    {layer.parent && <SubLayerStem />}
                    <ToggleSwitch active={!!isLayerActive} />
                    <span className={`text-[11px] font-mono uppercase tracking-wider flex-1 transition-colors ${isLayerActive ? 'text-white/80' : 'text-white/40'}`}>
                      {layer.label}
                    </span>
                    {count !== null && <span className="text-[10px] font-mono tabular-nums text-white/25">{count.toLocaleString('it-IT')}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/[0.06] px-1">
          <span className="text-[10px] font-mono tracking-[0.2em] text-white/25 uppercase">Stile mappa</span>
          <button
            onClick={() => setStudioOpen(o => !o)}
            aria-pressed={studioOpen}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: studioOpen ? 'var(--hover-accent)' : 'transparent', boxShadow: studioOpen ? '0 0 12px var(--gold-glow)' : 'none' }}
          >
            <SlidersHorizontal className="w-4 h-4" style={{ color: studioOpen ? 'var(--gold-primary)' : 'rgba(255,255,255,0.25)' }} />
          </button>
        </div>
        <AnimatePresence>{studioOpen && <StyleStudio isMobile onClose={() => setStudioOpen(false)} />}</AnimatePresence>

        {setTheme && (
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] px-1">
            <span className="text-[10px] font-mono tracking-[0.2em] text-white/25 uppercase">Modalità Ghost</span>
            <button
              onClick={() => setTheme(theme === 'core' ? 'ghost' : 'core')}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ background: theme === 'ghost' ? 'rgba(179, 136, 255, 0.15)' : 'transparent', boxShadow: theme === 'ghost' ? '0 0 12px rgba(179, 136, 255, 0.3)' : 'none' }}
            >
              <Ghost className="w-4 h-4" style={{ color: theme === 'ghost' ? '#B388FF' : 'rgba(255,255,255,0.25)' }} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 30, stiffness: 200, delay: 2.8 }}
      className="absolute top-0 left-0 h-full w-[48px] flex flex-col items-center pt-24 pb-6 z-50 pointer-events-auto"
      style={{ background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(24px) saturate(1.2)', WebkitBackdropFilter: 'blur(24px) saturate(1.2)' }}
    >
      <div className="flex-1 flex flex-col items-center gap-1">
        {visibleGroups.map((group) => {
          const counted = group.layers.filter(l => !l.parent);
          const groupActive = counted.some(l => activeLayers[l.key]);
          const isHovered = hoveredGroup === group.label;
          const Icon = group.icon;
          const activeCount = counted.filter(l => activeLayers[l.key]).length;
          const isPinned = pinnedGroup === group.label;
          const isOpen = isHovered || isPinned;

          return (
            <div key={group.label} className="relative flex items-center justify-center" onMouseEnter={() => setHoveredGroup(group.label)} onMouseLeave={() => setHoveredGroup(null)}>
              <button
                onClick={() => setPinnedGroup(isPinned ? null : group.label)}
                aria-expanded={isOpen}
                aria-label={`${group.fullLabel}${activeCount ? ` — ${activeCount} attivi` : ''}`}
                title={group.fullLabel}
                className="relative w-10 h-10 flex items-center justify-center cursor-pointer rounded-lg transition-all duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
                style={{ background: isPinned ? 'rgba(255,255,255,0.10)' : isHovered ? 'rgba(255,255,255,0.05)' : 'transparent' }}
              >
                <Icon
                  className="transition-all duration-300"
                  style={{
                    width: 16,
                    height: 16,
                    color: groupActive ? 'rgba(255,255,255,0.75)' : isOpen ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.22)',
                    filter: groupActive ? 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' : 'none',
                  }}
                />
                {activeCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[13px] h-[13px] px-[3px] rounded-full flex items-center justify-center text-[9px] font-mono tabular-nums leading-none" style={{ background: 'rgba(0,229,255,0.9)', color: '#04040A', boxShadow: '0 0 6px rgba(0,229,255,0.5)' }}>
                    {activeCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -8, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -4, filter: 'blur(2px)' }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute left-[52px] top-1/2 -translate-y-1/2 min-w-[220px] rounded-xl p-3 z-[100] pointer-events-auto"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(40px) saturate(1.5)', WebkitBackdropFilter: 'blur(40px) saturate(1.5)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                  >
                    <div className="flex items-center gap-2 mb-2.5 pb-1.5 border-b border-white/[0.04]">
                      <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/35 flex-1">{group.fullLabel}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleGroup(group.layers); }}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        {activeCount > 0 ? 'NESSUNO' : 'TUTTI'}
                      </button>
                      {isPinned && (
                        <button onClick={(e) => { e.stopPropagation(); setPinnedGroup(null); }} aria-label="Chiudi" className="px-1.5 py-0.5 rounded text-[10px] font-mono text-white/40 hover:text-white hover:bg-white/10 transition-colors">✕</button>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {group.layers.map((layer) => {
                        const isLayerActive = activeLayers[layer.key];
                        const count = getCount(layer.dataKey, layer.catKey);
                        const dormant = !!layer.parent && !activeLayers[layer.parent];
                        return (
                          <button
                            key={layer.key}
                            onClick={() => toggle(layer.key)}
                            aria-pressed={!!isLayerActive}
                            title={dormant ? 'Attiva prima il livello superiore' : undefined}
                            className={`relative w-full flex items-center gap-3 py-1.5 rounded-md hover:bg-white/[0.05] transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30 ${layer.parent ? 'pl-[22px] pr-1' : 'px-1'} ${dormant ? 'opacity-40' : ''}`}
                          >
                            {layer.parent && <SubLayerStem />}
                            <ToggleSwitch active={!!isLayerActive} />
                            <span className={`text-[11px] font-mono uppercase tracking-wider flex-1 transition-colors duration-200 ${isLayerActive ? 'text-white/70' : 'text-white/35'}`}>{layer.label}</span>
                            {count !== null && <span className={`text-[10px] font-mono tabular-nums transition-colors ${isLayerActive ? 'text-white/45' : 'text-white/20'}`}>{count.toLocaleString('it-IT')}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="w-5 h-px bg-white/[0.06] my-2" />

      <button
        onClick={() => setStudioOpen(o => !o)}
        aria-pressed={studioOpen}
        className="w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-500 cursor-pointer"
        style={{ background: studioOpen ? 'var(--hover-accent)' : 'transparent' }}
        title="Stile mappa"
      >
        <SlidersHorizontal className="transition-all duration-500" style={{ width: 15, height: 15, color: studioOpen ? 'var(--gold-primary)' : 'rgba(255,255,255,0.15)', filter: studioOpen ? 'drop-shadow(0 0 6px var(--gold-glow))' : 'none' }} />
      </button>
      <AnimatePresence>{studioOpen && <StyleStudio onClose={() => setStudioOpen(false)} />}</AnimatePresence>

      {setTheme && (
        <button
          onClick={() => setTheme(theme === 'core' ? 'ghost' : 'core')}
          className="w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-500 cursor-pointer"
          style={{ background: theme === 'ghost' ? 'rgba(179, 136, 255, 0.1)' : 'transparent' }}
          title="Modalità Ghost"
        >
          <Ghost className="transition-all duration-500" style={{ width: 15, height: 15, color: theme === 'ghost' ? '#B388FF' : 'rgba(255,255,255,0.15)', filter: theme === 'ghost' ? 'drop-shadow(0 0 6px rgba(179, 136, 255, 0.5))' : 'none' }} />
        </button>
      )}
    </motion.div>
  );
}

export default memo(LayerPanel);