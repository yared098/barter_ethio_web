import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Barter Ethio — Trade what you have for what you need',
    template: '%s · Barter Ethio',
  },
  description:
    "Ethiopia's modern barter platform. Trade what you have for what you need — no cash required.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://api.smrestaurant.com/api/v1'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}