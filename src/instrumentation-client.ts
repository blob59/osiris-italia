// OSIRIS Italia — Render cold-start CCTV compatibility shim.
//
// The CCTV API fans out to many upstream camera catalogues. On a cold Render
// instance some slow regions can miss the API's per-region time budget on the
// very first request, while their in-flight fetches continue and warm the
// server-side source cache. The dashboard normally fetches CCTV only once, so a
// partial first response can otherwise stay on screen for the whole session.
//
// Next.js runs instrumentation-client before React hydration. We therefore
// retry only the first global CCTV catalogue request when it is clearly partial.
// The map, camera rendering and upstream source logic remain untouched.

const nativeFetch = window.fetch.bind(window);
const HEALTHY_CCTV_TOTAL = 10_000;

async function cameraTotal(response: Response): Promise<number> {
  try {
    const payload = await response.clone().json();
    return Number(payload?.total ?? payload?.cameras?.length ?? 0);
  } catch {
    return 0;
  }
}

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

  let best = first;
  let bestTotal = await cameraTotal(first);
  if (bestTotal >= HEALTHY_CCTV_TOTAL) return first;

  const separator = url.includes('?') ? '&' : '?';

  // First warm-up pass: this covers the normal Render cold-start case where
  // region requests hit the 12s route budget but continue filling sourceCache.
  await new Promise(resolve => setTimeout(resolve, 13_500));

  for (let attempt = 1; attempt <= 2; attempt++) {
    const retryUrl = `${url}${separator}__osiris_cctv_retry=1&_warm=${Date.now()}&attempt=${attempt}`;
    try {
      const retry = await nativeFetch(retryUrl, { ...init, cache: 'no-store' });
      if (retry.ok) {
        const total = await cameraTotal(retry);
        if (total > bestTotal) {
          best = retry;
          bestTotal = total;
        }
        if (bestTotal >= HEALTHY_CCTV_TOTAL) return best;
      }
    } catch {
      // Keep the best successful catalogue collected so far.
    }

    // A second pass helps sources that finished just after the first warm-up.
    if (attempt === 1) {
      await new Promise(resolve => setTimeout(resolve, 10_000));
    }
  }

  return best;
};
