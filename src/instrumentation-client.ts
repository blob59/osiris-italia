// OSIRIS Italia — Render cold-start CCTV compatibility shim.
//
// The CCTV API fans out to many upstream camera catalogues. On a cold Render
// instance some slow regions can miss the API's per-region time budget on the
// very first request, while their in-flight fetches continue and warm the
// server-side source cache. The dashboard normally fetches CCTV only once, so a
// partial first response can otherwise stay on screen for the whole session.
//
// Next.js runs instrumentation-client before React hydration, which lets us
// transparently retry only that first global CCTV catalogue request when it is
// obviously incomplete. No map rendering or camera-source logic is changed.

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

    // A healthy warm catalogue currently contains well over 10k cameras.
    // Keep the threshold deliberately conservative so normal source churn does
    // not add delay; it only catches the clearly partial cold-start response.
    if (total >= 8000) return first;
  } catch {
    // If the response is not inspectable, preserve the original behaviour.
    return first;
  }

  // Let the timed-out regional fetches finish and populate sourceCache, then
  // bypass the CDN/browser cache with a unique retry URL.
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
