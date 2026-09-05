'use client';

import { useEffect, useRef } from 'react';
import { pushLumaContext, type LumaContextKind } from '@/lib/luma-context';

function clean(text: string | null | undefined) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function kindFor(text: string): LumaContextKind {
  const t = text.toUpperCase();
  if (/EARTHQUAKE|TERREMOTO|USGS/.test(t)) return 'earthquake';
  if (/FIRE|WILDFIRE|FIRMS|INCENDIO/.test(t)) return 'wildfire';
  if (/MMSI|VESSEL|SHIP|TANKER|CARGO|AIS/.test(t)) return 'generic';
  if (/GDELT|NEWS|ARTICLE|NOTIZ/.test(t)) return 'news';
  if (/CAM-|CAMERA|WEBCAM|CCTV/.test(t)) return 'generic';
  return 'generic';
}

function labelFor(text: string) {
  const compact = clean(text);
  if (!compact) return 'Elemento selezionato sulla mappa';
  return compact.length > 90 ? `${compact.slice(0, 87)}…` : compact;
}

function contextFromPopup(popup: Element) {
  const text = clean(popup.textContent);
  if (!text) return null;
  const links = Array.from(popup.querySelectorAll('a[href]'))
    .map(a => (a as HTMLAnchorElement).href)
    .filter(Boolean)
    .slice(0, 5);

  const upper = text.toUpperCase();
  const isShip = /MMSI|VESSEL|SHIP|TANKER|CARGO|AIS/.test(upper);
  const isCamera = /CAMERA|WEBCAM|CCTV|CAM-/.test(upper);

  return {
    kind: kindFor(text),
    label: isShip ? `Nave/AIS · ${labelFor(text)}` : isCamera ? `Webcam · ${labelFor(text)}` : labelFor(text),
    summary: isShip
      ? 'Elemento marittimo selezionato direttamente sulla mappa. Il contenuto seguente proviene dal popup OSIRIS; i dati AIS possono essere incompleti o ritardati e non vanno trattati come tracciamento tattico in tempo reale.'
      : isCamera
        ? 'Webcam pubblica selezionata direttamente sulla mappa. Descrivi solo ciò che è osservabile e non identificare persone o inferire dati personali.'
        : 'Elemento selezionato direttamente sulla mappa di OSIRIS Italia. Distingui i dati mostrati dal popup dalle inferenze e segnala eventuali limiti della fonte.',
    data: {
      popupText: text.slice(0, 1800),
      sourceLinks: links,
      selectionOrigin: 'map-popup',
    },
    openLuma: false,
  };
}

export default function LumaMapBridge() {
  const lastFingerprint = useRef('');

  useEffect(() => {
    const publishPopup = () => {
      const popup = document.querySelector('.maplibregl-popup-content');
      if (!popup) return;
      const ctx = contextFromPopup(popup);
      if (!ctx) return;
      const fingerprint = JSON.stringify(ctx.data);
      if (fingerprint === lastFingerprint.current) return;
      lastFingerprint.current = fingerprint;
      pushLumaContext(ctx);
    };

    const publishViewer = () => {
      const candidates = Array.from(document.querySelectorAll('h3'));
      for (const heading of candidates) {
        const panel = heading.closest('.fixed');
        if (!panel) continue;
        const text = clean(panel.textContent);
        if (!/SOURCE:|CAM-/.test(text)) continue;
        const fingerprint = `camera:${text.slice(0, 500)}`;
        if (fingerprint === lastFingerprint.current) return;
        lastFingerprint.current = fingerprint;
        pushLumaContext({
          kind: 'generic',
          label: `Webcam ${clean(heading.textContent) || 'pubblica'}`,
          summary: 'Webcam pubblica aperta dalla mappa. Usa solo metadati e contenuti osservabili; non identificare persone riprese e non inferire identità, abitudini o dati personali.',
          data: {
            viewerText: text.slice(0, 1200),
            selectionOrigin: 'camera-viewer',
          },
          openLuma: false,
        });
        return;
      }
    };

    const onClick = (event: Event) => {
      const target = event.target as Element | null;
      if (!target) return;

      const cctv = target.closest('.cctv-tile');
      if (cctv) {
        const title = clean(cctv.getAttribute('title') || cctv.textContent);
        const fingerprint = `cctv:${title}`;
        if (fingerprint !== lastFingerprint.current) {
          lastFingerprint.current = fingerprint;
          pushLumaContext({
            kind: 'generic',
            label: `Webcam ${title || 'pubblica'}`,
            summary: 'Webcam pubblica selezionata direttamente sulla mappa. Non identificare persone e non inferire dati personali.',
            data: { selectionOrigin: 'cctv-map-tile' },
            openLuma: false,
          });
        }
      }

      const news = target.closest('.news-tile');
      if (news) {
        const title = clean(news.textContent).replace(/^OPEN\s*/i, '');
        const fingerprint = `news:${title}`;
        if (fingerprint !== lastFingerprint.current) {
          lastFingerprint.current = fingerprint;
          pushLumaContext({
            kind: 'news',
            label: `Fonte live ${title || 'notizia'}`,
            summary: 'Fonte giornalistica/live selezionata direttamente sulla mappa. Distingui ciò che la fonte afferma dai fatti corroborati indipendentemente.',
            data: { selectionOrigin: 'news-map-tile' },
            openLuma: false,
          });
        }
      }

      window.setTimeout(() => {
        publishPopup();
        publishViewer();
      }, 80);
    };

    const observer = new MutationObserver(() => {
      publishPopup();
      publishViewer();
    });

    document.addEventListener('click', onClick, true);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    publishPopup();
    publishViewer();

    return () => {
      document.removeEventListener('click', onClick, true);
      observer.disconnect();
    };
  }, []);

  return null;
}
