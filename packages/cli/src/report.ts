// @agentora/cli/report — render a doctor Report as the `agentora doctor` output.

import type { Report, Severity } from '@agentora/doctor';

const GLYPH: Record<Severity, string> = { ok: '✓', warn: '⚠', error: '✗' };

function worst(severities: Severity[]): Severity {
  if (severities.includes('error')) {
    return 'error';
  }
  if (severities.includes('warn')) {
    return 'warn';
  }
  return 'ok';
}

/**
 * Render the readiness report. `actions` is the full action list so clean
 * actions render a ✓; the report only carries problem findings.
 */
export function renderReport(report: Report, actions: string[]): string {
  const width = actions.reduce((max, name) => Math.max(max, name.length), 0);
  const lines = actions.map((name) => {
    const findings = report.findings.filter((f) => f.action === name);
    const glyph = GLYPH[worst(findings.map((f) => f.severity))];
    const detail = findings.length === 0 ? 'ready' : findings.map((f) => f.message).join(', ');
    return `  ${glyph} ${name.padEnd(width)}   ${detail}`;
  });
  lines.push(`  Agent-readiness: ${report.score}/100`);
  return lines.join('\n');
}

/** Non-zero exit when any action has an error-severity finding. */
export function reportExitCode(report: Report): number {
  return report.findings.some((f) => f.severity === 'error') ? 1 : 0;
}
