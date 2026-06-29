import type { Metadata } from 'next';
import { site } from '@/lib/site';
import { pageMetadata } from '@/lib/metadata';

export const metadata: Metadata = pageMetadata({
  title: 'Privacy',
  description: `How the ${site.name} project website handles your data — in short, it doesn't collect personal data.`,
  path: '/legal/privacy',
});

export default function Privacy() {
  return (
    <article className="prose">
      <h1>Privacy</h1>
      <p>
        <em>Last updated: June 2026.</em>
      </p>
      <p>
        <strong>{site.name}</strong> is an open-source software project released
        under the {site.license} license. This page describes how this project
        website handles your information. The <code>{site.name}</code> packages
        themselves are libraries you run on your own infrastructure — they do not
        phone home, and this policy does not govern your use of the code.
      </p>

      <h2>What we collect</h2>
      <p>
        This website is a static informational site. It does not require an
        account, and it does not ask you for personal information. We do not sell,
        rent, or share personal data, because we do not collect it.
      </p>

      <h2>Cookies and analytics</h2>
      <p>
        The site stores a single local preference in your browser — your selected
        color theme (light, dark, or system). This lives in your browser&rsquo;s
        local storage, never leaves your device, and is not used for tracking. We
        do not set advertising cookies.
      </p>

      <h2>Hosting and logs</h2>
      <p>
        The site is served by a third-party hosting provider, which may record
        standard server request metadata (such as IP address and user agent) for
        security and operational purposes. That processing is governed by the host
        provider&rsquo;s own policy.
      </p>

      <h2>Third-party links</h2>
      <p>
        Pages link to external services such as GitHub and npm. Once you follow a
        link, the destination&rsquo;s own privacy policy applies.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy as the project evolves. Material changes will be
        reflected by the &ldquo;last updated&rdquo; date above.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy can be raised as an issue on the{' '}
        <a href={site.github} rel="noreferrer" target="_blank">
          project repository
        </a>
        .
      </p>
    </article>
  );
}
