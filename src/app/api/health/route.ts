import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      status: 'operational',
      platform: 'OSIRIS Italia',
      assistant: 'Luma',
      version: '1.0.0-it',
      uptime: process.uptime ? Math.round(process.uptime()) : 0,
      timestamp: new Date().toISOString(),
      configuration: {
        luma: process.env.GEMINI_API_KEY_1 ? 'configured' : 'not-configured',
        ais: process.env.AIS_API_KEY ? 'configured' : 'not-configured',
      },
      endpoints: [
        '/api/flights',
        '/api/maritime',
        '/api/cctv',
        '/api/satellites',
        '/api/earthquakes',
        '/api/fires',
        '/api/news',
        '/api/ai/analyze',
        '/api/region-dossier',
      ],
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
