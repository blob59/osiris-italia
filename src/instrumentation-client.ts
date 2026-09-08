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

function applyOsirisItaliaBranding() {
  document.title = 'OSIRIS ITALIA — Franco Ficara';

  const headings = Array.from(document.querySelectorAll('h1'));
  for (const heading of headings) {
    if (heading.textContent?.trim() === 'OSIRIS') {
      heading.textContent = 'OSIRIS ITALIA';
      heading.setAttribute('title', 'OSIRIS ITALIA — Franco Ficara');

      const parent = heading.parentElement;
      if (parent && !parent.querySelector('[data-osiris-italia-author]')) {
        const author = document.createElement('span');
        author.dataset.osirisItaliaAuthor = 'true';
        author.textContent = 'FRANCO FICARA';
        author.style.fontFamily = 'monospace';
        author.style.fontSize = '9px';
        author.style.letterSpacing = '0.22em';
        author.style.color = '#00e5ff';
        author.style.opacity = '0.9';
        author.style.textTransform = 'uppercase';
        parent.appendChild(author);
      }
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
