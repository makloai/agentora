import type { Metadata } from 'next';
import { site } from '@/lib/site';
import { pageMetadata } from '@/lib/metadata';

export const metadata: Metadata = pageMetadata({
  title: 'Terms',
  description: `Terms for the ${site.name} project website and the ${site.license}-licensed software.`,
  path: '/legal/terms',
});

export default function Terms() {
  return (
    <article className="prose">
      <h1>Terms</h1>
      <p>
        <em>Last updated: June 2026.</em>
      </p>
      <p>
        These terms cover your use of this website. Your use of the{' '}
        <strong>{site.name}</strong> software is governed separately by the{' '}
        {site.license} license that ships with the source code.
      </p>

      <h2>The software license</h2>
      <p>
        <code>{site.name}</code> is free and open-source software distributed
        under the {site.license} license. That license is the authoritative
        agreement for using, copying, modifying, and distributing the code,
        including its disclaimer of warranty and limitation of liability. The
        canonical text lives in the{' '}
        <a href={site.github} rel="noreferrer" target="_blank">
          repository
        </a>
        .
      </p>

      <h2>Use of this website</h2>
      <p>
        This site is provided for informational and documentation purposes. You
        agree not to misuse it — for example, by attempting to disrupt it,
        probe it for vulnerabilities without authorization, or scrape it in a way
        that degrades service for others.
      </p>

      <h2>No warranty</h2>
      <p>
        The website and its content are provided &ldquo;as is,&rdquo; without
        warranties of any kind, express or implied. Documentation may contain
        errors or become out of date, and is not a guarantee of how any version
        of the software behaves.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, the maintainers are not liable
        for any damages arising from your use of this website or the software.
      </p>

      <h2>Trademarks</h2>
      <p>
        The {site.name} name and logo identify the project. The {site.license}{' '}
        license grants rights to the code, not a license to use project marks in
        a way that implies endorsement.
      </p>

      <h2>Changes</h2>
      <p>
        We may revise these terms over time. Continued use of the site after an
        update constitutes acceptance of the revised terms.
      </p>
    </article>
  );
}
