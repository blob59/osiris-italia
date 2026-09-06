import type { Metadata, Viewport } from "next";
import ErrorBoundary from '@/components/ErrorBoundary';
import OsirisItaliaSignature from '@/components/OsirisItaliaSignature';
import OsirisItaliaAbout from '@/components/OsirisItaliaAbout';
import FlightAutoStart from '@/components/FlightAutoStart';
import AircraftTrackOverlay from '@/components/AircraftTrackOverlay';
import AircraftIconEnhancer from '@/components/AircraftIconEnhancer';
import MobileAviationQuickToggle from '@/components/MobileAviationQuickToggle';
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SITE_NAME = "OSIRIS Italia";
const SITE_TITLE = "OSIRIS Italia — Piattaforma Open Source Intelligence con Luma";
const SITE_DESCRIPTION = "Piattaforma OSINT open source per consultare e correlare fonti pubbliche, mappe e flussi informativi globali, con Luma, assistente AI basato su Gemini.";

export const viewport: Viewport = {
  themeColor: "#D4AF37",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s | OSIRIS Italia" },
  description: SITE_DESCRIPTION,
  keywords: [
    "OSIRIS Italia", "OSINT", "open source intelligence", "Luma AI", "Gemini",
    "intelligence platform", "geospatial intelligence", "GEOINT", "real-time tracking",
    "flight tracker", "aircraft tracking", "satellite tracking", "earthquake monitor",
    "wildfire tracker", "NASA FIRMS", "cyber threat intelligence", "CVE tracker"
  ],
  authors: [{ name: "Franco Ficara" }],
  creator: "Franco Ficara",
  publisher: "OSIRIS Italia",
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/android-chrome-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/android-chrome-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: SITE_NAME,
    locale: "it_IT",
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: "OSIRIS Italia — Piattaforma OSINT con Luma", type: "image/png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },
  category: "technology",
  classification: "Open Source Intelligence",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "OSIRIS Italia",
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#06060C",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "OSIRIS Italia",
  alternateName: ["OSIRIS Italia", "Luma OSINT"],
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  browserRequirements: "Browser web moderno",
  author: { "@type": "Person", name: "Franco Ficara" },
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", availability: "https://schema.org/InStock" },
  featureList: [
    "Analisi di fonti aperte e pubbliche",
    "Monitoraggio di voli e satelliti da fonti disponibili pubblicamente",
    "Monitoraggio terremoti e incendi",
    "Intelligence su vulnerabilità e minacce cyber",
    "Mappe e flussi informativi globali",
    "Assistente AI Luma basato su Gemini"
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="canonical" href={SITE_URL} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="antialiased">
        <FlightAutoStart />
        <AircraftTrackOverlay />
        <AircraftIconEnhancer />
        <MobileAviationQuickToggle />
        <ErrorBoundary name="OSIRIS Italia Core">{children}</ErrorBoundary>
        <OsirisItaliaSignature />
        <OsirisItaliaAbout />
      </body>
    </html>
  );
}
