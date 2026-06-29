import { ImageResponse } from 'next/og';
import { site } from '@/lib/site';

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Branded social-preview card generated at build time via next/og (Satori).
 * Satori requires every element with more than one child to set an explicit
 * `display`, and only renders glyphs present in the bundled font — so the
 * layout is all flex containers and plain Latin text (no decorative glyphs that
 * would trigger a dynamic font fetch).
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#09090b',
          backgroundImage:
            'radial-gradient(circle at 75% 15%, rgba(52,211,153,0.18), transparent 55%)',
          padding: 80,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: '#34d399',
              marginRight: 20,
            }}
          />
          <div style={{ display: 'flex', color: '#e4e4e7', fontSize: 40, fontWeight: 600 }}>
            {site.name}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              color: '#fafafa',
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            One contract,
          </div>
          <div
            style={{
              display: 'flex',
              color: '#34d399',
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              marginBottom: 28,
            }}
          >
            every agent surface.
          </div>
          <div style={{ display: 'flex', color: '#a1a1aa', fontSize: 30, maxWidth: 940 }}>
            Define a capability once as a typed contract — expose it to MCP, the
            AI SDK, OpenAI, HTTP, a CLI, and a typed client.
          </div>
        </div>

        <div style={{ display: 'flex', color: '#71717a', fontSize: 24 }}>
          {site.version} · open source · {site.license} · agentora.dev
        </div>
      </div>
    ),
    { ...size }
  );
}
