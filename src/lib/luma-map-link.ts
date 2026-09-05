'use client';

import { pushLumaContext } from '@/lib/luma-context';

export function pushCameraToLuma(camera: any) {
  if (!camera) return;
  pushLumaContext({
    kind: 'generic',
    label: `Webcam ${camera.name || camera.id || 'pubblica'}`,
    summary: 'Webcam pubblica selezionata sulla mappa. Descrivi solo elementi osservabili e metadati della sorgente; non identificare persone riprese e non inferire identità, abitudini o dati personali.',
    lat: Number.isFinite(camera.lat) ? camera.lat : undefined,
    lng: Number.isFinite(camera.lng) ? camera.lng : undefined,
    data: {
      type: 'public-webcam',
      id: camera.id ?? null,
      name: camera.name ?? null,
      city: camera.city ?? null,
      country: camera.country ?? null,
      source: camera.source ?? null,
      streamType: camera.stream_type ?? null,
      externalUrl: camera.external_url ?? null,
    },
  });
}

export function pushNewsToLuma(item: any) {
  if (!item) return;
  pushLumaContext({
    kind: 'news',
    label: `Notizia ${item.name || item.title || item.source || 'OSINT'}`,
    summary: 'Fonte/notizia pubblica selezionata dall’interfaccia. Distingui il contenuto della fonte dai fatti corroborati e segnala ciò che richiede verifica indipendente.',
    lat: Number.isFinite(item.lat) ? item.lat : undefined,
    lng: Number.isFinite(item.lng) ? item.lng : undefined,
    data: {
      title: item.title ?? item.name ?? null,
      source: item.source ?? null,
      url: item.url ?? item.link ?? null,
      city: item.city ?? null,
      country: item.country ?? null,
      published: item.published ?? item.time ?? null,
    },
  });
}

export function pushShipToLuma(ship: any) {
  if (!ship) return;
  pushLumaContext({
    kind: 'generic',
    label: `Nave ${ship.name || ship.mmsi || ship.id || 'AIS'}`,
    summary: 'Contatto AIS pubblico selezionato. I dati AIS possono essere incompleti, ritardati o assenti; usali per interpretazione OSINT passiva, non come dato tattico in tempo reale.',
    lat: Number.isFinite(ship.lat) ? ship.lat : undefined,
    lng: Number.isFinite(ship.lng) ? ship.lng : undefined,
    data: {
      type: 'ais-vessel',
      name: ship.name ?? null,
      mmsi: ship.mmsi ?? ship.id ?? null,
      vesselType: ship.type ?? null,
      speedKnots: ship.speed ?? null,
      heading: ship.heading ?? null,
      destination: ship.destination ?? null,
      callsign: ship.callsign ?? null,
      imo: ship.imo ?? null,
      timestamp: ship.timestamp ?? null,
    },
  });
}
