import type { Report } from '@agentora/doctor';
import { describe, expect, it } from 'vitest';
import { renderReport, reportExitCode } from '../src/report';

const report: Report = {
  score: 72,
  findings: [
    {
      action: 'invoices.create',
      severity: 'warn',
      rule: 'write-permission',
      message: 'no permission hook',
    },
    {
      action: 'accounts.delete',
      severity: 'error',
      rule: 'write-idempotency',
      message: 'no idempotency key',
    },
    {
      action: 'accounts.delete',
      severity: 'warn',
      rule: 'write-concurrency',
      message: 'unbounded concurrency',
    },
  ],
};

const actions = ['products.search', 'invoices.create', 'accounts.delete'];

describe('renderReport', () => {
  it('renders a glyph and detail per action plus the score line', () => {
    const text = renderReport(report, actions);
    expect(text).toContain('✓ products.search');
    expect(text).toContain('⚠ invoices.create');
    expect(text).toContain('✗ accounts.delete');
    expect(text).toContain('no idempotency key, unbounded concurrency');
    expect(text).toContain('Agent-readiness: 72/100');
  });

  it('marks clean actions ready', () => {
    expect(renderReport(report, actions)).toContain('products.search   ready');
  });
});

describe('reportExitCode', () => {
  it('is non-zero when an error finding is present', () => {
    expect(reportExitCode(report)).toBe(1);
  });

  it('is zero on a clean report', () => {
    expect(reportExitCode({ score: 100, findings: [] })).toBe(0);
  });
});
