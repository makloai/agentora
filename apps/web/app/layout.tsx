import type { Metadata } from 'next';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider, themeScript } from '@/components/theme';
import { site } from '@/lib/site';
import './globals.css';

// Warm geometric sans + clean mono to match the coconut palette.
const sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans-src',
  display: 'swap',
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-src',
  display: 'swap',
});

const title = `${site.name} — ${site.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: title,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    'agentora',
    'MCP',
    'Model Context Protocol',
    'AI SDK',
    'OpenAI tools',
    'agent tools',
    'capability layer',
    'typed contracts',
    'TypeScript',
  ],
  authors: [{ name: 'makloai', url: site.github }],
  openGraph: {
    type: 'website',
    siteName: site.name,
    title,
    description: site.description,
    url: site.url,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description: site.description,
  },
  alternates: { canonical: '/' },
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      className={`${sans.variable} ${mono.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        {/* Sets the theme class before first paint to avoid a flash. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: trusted static string */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
