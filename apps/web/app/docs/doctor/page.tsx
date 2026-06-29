import type { Metadata } from 'next';
import { DocPager } from '@/components/doc-pager';
import { pageMetadata } from '@/lib/metadata';

export const metadata: Metadata = pageMetadata({
  title: 'Agent-readiness doctor',
  description:
    'agentora doctor scores how agent-ready your actions are by linting the manifest IR — its rules, deterministic scoring, and CI integration.',
  path: '/docs/doctor',
});

const rules: { rule: string; severity: string; fires: string }[] = [
  {
    rule: 'description',
    severity: 'warn',
    fires: 'An action has no description (agents read it to choose tools).',
  },
  {
    rule: 'write-idempotency',
    severity: 'error',
    fires: 'A write action declares no idempotency.',
  },
  {
    rule: 'write-permission',
    severity: 'warn',
    fires: 'A write action declares no auth (permission hook).',
  },
  {
    rule: 'write-concurrency',
    severity: 'warn',
    fires: 'A write action declares no bounded concurrency.',
  },
];

export default function Doctor() {
  return (
    <>
      <article className="prose">
        <h1>Agent-readiness doctor</h1>
        <p>
          <code>@agentora/doctor</code> scores how agent-ready your actions are
          by linting the manifest IR. It is agentora&rsquo;s headline feature: a
          number that tells you whether the capabilities you exposed are safe and
          legible for agents to call.
        </p>
        <pre>
          <code>{`$ npx agentora doctor
  ✓ products.search   ready
  ⚠ invoices.create   no permission hook
  ✗ accounts.delete   no idempotency key, unbounded concurrency
  Agent-readiness: 72/100`}</code>
        </pre>

        <h2>Rules</h2>
        <table>
          <thead>
            <tr>
              <th>Rule</th>
              <th>Severity</th>
              <th>Fires when</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.rule}>
                <td>
                  <code>{r.rule}</code>
                </td>
                <td>{r.severity}</td>
                <td>{r.fires}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Scoring</h2>
        <p>
          The score starts at 100 and deducts per finding (warning −5, error
          −20), clamped to <code>[0, 100]</code>. It is{' '}
          <strong>deterministic</strong> and <strong>monotonic</strong> — fixing
          a problem never lowers the score, and an empty manifest scores 100.
        </p>
        <pre>
          <code>{`import { doctor } from '@agentora/doctor'

const report = doctor(app.manifest())
report.score    // 0–100
report.findings // [{ action, severity, rule, message }]`}</code>
        </pre>
        <p>
          The <code>agentora doctor</code> CLI renders this report and exits
          non-zero when any error-severity finding is present — wire it into CI
          to gate agent-readiness.
        </p>
      </article>

      <DocPager href="/docs/doctor" />
    </>
  );
}
