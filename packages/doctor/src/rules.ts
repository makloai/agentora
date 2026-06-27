// @agentora/doctor/rules — the agent-readiness rule set, evaluated per action
// over the manifest IR. Each rule inspects one ManifestEntry and may emit a
// finding. Severities feed the weighted score in ./index.ts.

import type { ManifestEntry } from '@agentora/core';
import type { Finding, Severity } from './index';

export interface Rule {
  id: string;
  /** Inspect one action; return a problem finding or null when it passes. */
  check(entry: ManifestEntry): { severity: Severity; message: string } | null;
}

export const RULES: Rule[] = [
  {
    id: 'description',
    check: (e) =>
      e.description && e.description.trim().length > 0
        ? null
        : { severity: 'warn', message: 'no description (agents read it to choose tools)' },
  },
  {
    id: 'write-idempotency',
    check: (e) =>
      e.sideEffects === 'write' && e.idempotency === 'none'
        ? { severity: 'error', message: 'write action declares no idempotency key' }
        : null,
  },
  {
    id: 'write-permission',
    check: (e) =>
      e.sideEffects === 'write' && e.auth === undefined
        ? { severity: 'warn', message: 'no permission hook (declare auth or mark public)' }
        : null,
  },
  {
    id: 'write-concurrency',
    check: (e) =>
      e.sideEffects === 'write' && e.concurrency === undefined
        ? { severity: 'warn', message: 'unbounded concurrency (declare a concurrency limit)' }
        : null,
  },
];

/** Run every rule against one action. */
export function evaluate(entry: ManifestEntry): Finding[] {
  const findings: Finding[] = [];
  for (const rule of RULES) {
    const result = rule.check(entry);
    if (result) {
      findings.push({ action: entry.name, rule: rule.id, ...result });
    }
  }
  return findings;
}
