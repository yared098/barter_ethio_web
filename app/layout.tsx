import type { Metadata, Viewport } from 'next';
import './globals.css';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://barterethio.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: 'Barter Ethio — Trade what you have for what you need',
    template: '%s · Barter Ethio',
  },
  description:
    "Ethiopia's modern barter platform. Trade what you have for what you need — no cash required.",

  applicationName: 'Barter Ethio',
  authors: [{ name: 'Barter Ethio' }],
  keywords: [
    'barter',
    'Ethiopia',
    'trade',
    'exchange',
    'wanted board',
    'marketplace',
    'Addis Ababa',
    'Addis',
    'swap',
  ],

  // ── Icons (Next.js auto-detects app/icon.svg, but explicit = safer) ──
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    shortcut: '/icon.svg',
    apple: '/apple-icon.svg',
  },

  // ── Open Graph (social share preview) ──
  openGraph: {
    type: 'website',
    siteName: 'Barter Ethio',
    title: 'Barter Ethio — Trade what you have for what you need',
    description:
      "Ethiopia's modern barter platform. Trade what you have for what you need.",
    url: SITE_URL,
    locale: 'en_ET',
    images: [
      {
        url: '/opengraph-image.svg',
        width: 1200,
        height: 630,
        alt: 'Barter Ethio',
      },
    ],
  },

  // ── Twitter / X ──
  twitter: {
    card: 'summary_large_image',
    title: 'Barter Ethio',
    description: 'Trade what you have for what you need.',
    images: ['/opengraph-image.svg'],
  },

  // ── PWA / mobile ──
  appleWebApp: {
    capable: true,
    title: 'Barter Ethio',
    statusBarStyle: 'default',
  },

  // ── Robots + canonical ──
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: '#00A86B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}