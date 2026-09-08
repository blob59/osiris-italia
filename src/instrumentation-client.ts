// OSIRIS Italia — Render cold-start CCTV compatibility shim + lightweight branding.

const nativeFetch = window.fetch.bind(window);

window.fetch = async function osirisItaliaFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  const isGlobalCctvRequest =
    url.includes('/api/cctv') &&
    url.includes('region=all') &&
    !url.includes('__osiris_cctv_retry=1');

  if (!isGlobalCctvRequest) return nativeFetch(input, init);

  const first = await nativeFetch(input, init);
  if (!first.ok) return first;

  try {
    const payload = await first.clone().json();
    const total = Number(payload?.total ?? payload?.cameras?.length ?? 0);
    if (total >= 8000) return first;
  } catch {
    return first;
  }

  await new Promise(resolve => setTimeout(resolve, 13_500));

  const separator = url.includes('?') ? '&' : '?';
  const retryUrl = `${url}${separator}__osiris_cctv_retry=1&_warm=${Date.now()}`;

  try {
    const retry = await nativeFetch(retryUrl, { ...init, cache: 'no-store' });
    return retry.ok ? retry : first;
  } catch {
    return first;
  }
};

function makeAuthorBadge(parent: Element) {
  if (parent.querySelector('[data-osiris-italia-author]')) return;
  const author = document.createElement('span');
  author.dataset.osirisItaliaAuthor = 'true';
  author.textContent = 'FRANCO FICARA';
  author.style.fontFamily = 'monospace';
  author.style.fontSize = '9px';
  author.style.fontWeight = '700';
  author.style.letterSpacing = '0.22em';
  author.style.color = '#00e5ff';
  author.style.opacity = '0.95';
  author.style.textTransform = 'uppercase';
  author.style.textShadow = '0 0 8px rgba(0,229,255,.35)';
  parent.appendChild(author);
}

function applyOsirisItaliaBranding() {
  document.title = 'OSIRIS ITALIA — Franco Ficara';

  // Main map header. Keep the original Eye of Horus and all map logic untouched.
  for (const heading of Array.from(document.querySelectorAll('h1'))) {
    const text = heading.textContent?.trim();
    if (text === 'OSIRIS' || text === 'OSIRIS ITALIA') {
      heading.textContent = 'OSIRIS ITALIA';
      heading.setAttribute('title', 'OSIRIS ITALIA — Franco Ficara');
      if (heading.parentElement) makeAuthorBadge(heading.parentElement);
    }
  }

  // Splash screen uses individual letter spans rather than an h1.
  const candidates = Array.from(document.querySelectorAll('div'));
  for (const el of candidates) {
    const children = Array.from(el.children);
    if (children.length !== 6) continue;
    const word = children.map(c => c.textContent || '').join('');
    if (word !== 'OSIRIS') continue;
    if (el.getAttribute('data-osiris-italia-splash') === 'true') continue;

    el.setAttribute('data-osiris-italia-splash', 'true');
    // Do not disturb Framer Motion's six animated letters; add ITALIA beside them.
    const italy = document.createElement('span');
    italy.textContent = ' ITALIA';
    italy.style.color = '#d4af37';
    italy.style.fontFamily = 'monospace';
    italy.style.fontSize = 'clamp(1.5rem, 4vw, 3rem)';
    italy.style.fontWeight = '700';
    italy.style.letterSpacing = '.18em';
    italy.style.marginLeft = '.25em';
    italy.style.textShadow = '0 0 30px rgba(212,175,55,.2)';
    el.appendChild(italy);
  }

  // Replace only presentation copy, never data/source labels.
  for (const el of Array.from(document.querySelectorAll('p, span'))) {
    const text = el.textContent?.trim();
    if (text === 'GLOBAL INTELLIGENCE PLATFORM') {
      el.textContent = 'PIATTAFORMA DI INTELLIGENCE OPEN SOURCE';
    }
    if (text === 'REAL-TIME GLOBAL MONITORING · FLIGHTS · MARITIME · SATELLITES · CCTV · WEATHER · CYBER THREATS') {
      el.textContent = 'MONITORAGGIO GLOBALE IN TEMPO REALE · VOLI · MARITTIMO · SATELLITI · CCTV · METEO · MINACCE INFORMATICHE';
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyOsirisItaliaBranding, { once: true });
} else {
  applyOsirisItaliaBranding();
}

const brandingObserver = new MutationObserver(() => applyOsirisItaliaBranding());
brandingObserver.observe(document.documentElement, { childList: true, subtree: true });
