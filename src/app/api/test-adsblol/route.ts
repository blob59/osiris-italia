import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  const started = Date.now();
  const url = 'https://api.adsb.lol/v2/lat/42/lon/13/dist/250';

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'OSIRIS-Italia/diagnostic',
      },
    });

    const elapsed_ms = Date.now() - started;
    const text = await response.text();

    let aircraft = 0;
    let message: string | undefined;

    try {
      const data = JSON.parse(text);
      aircraft = Array.isArray(data?.ac) ? data.ac.length : 0;
      message = data?.msg;
    } catch {
      // Keep the diagnostic intentionally small; never echo a provider body.
    }

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      elapsed_ms,
      aircraft,
      message: message ?? null,
      provider: 'adsb.lol',
      region: 'Italy/Adriatic 42,13 radius 250nm',
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: null,
        elapsed_ms: Date.now() - started,
        aircraft: 0,
        provider: 'adsb.lol',
        region: 'Italy/Adriatic 42,13 radius 250nm',
        error: error instanceof Error ? error.message : 'Unknown fetch error',
      },
      { status: 502 },
    );
  }
}
