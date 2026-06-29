import type { Metadata } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import './globals.css';

const title = 'agentora — one contract, every agent surface';
const description =
  'Define an application capability once as a typed contract, then expose it to every agent surface — MCP, AI SDK, OpenAI, HTTP, CLI, and a typed client — with no per-surface re-implementation.';

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL('https://agentora.dev'),
  openGraph: {
    title,
    description,
    type: 'website',
    siteName: 'agentora',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
