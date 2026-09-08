'use client';

export type LumaContextKind = 'region' | 'map' | 'aircraft' | 'earthquake' | 'wildfire' | 'news' | 'generic';

export interface LumaUiContext {
  kind: LumaContextKind;
  label: string;
  summary?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
  data?: Record<string, unknown>;
  timestamp: string;
  /** When false, update Luma's context without forcing the chat window open. */
  openLuma?: boolean;
}

export const LUMA_CONTEXT_EVENT = 'osiris:luma-context';

export function pushLumaContext(context: Omit<LumaUiContext, 'timestamp'>) {
  if (typeof window === 'undefined') return;
  const detail: LumaUiContext = { ...context, timestamp: new Date().toISOString() };
  window.dispatchEvent(new CustomEvent<LumaUiContext>(LUMA_CONTEXT_EVENT, { detail }));
}
