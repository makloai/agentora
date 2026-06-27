// @agentora/doctor — the differentiator. Score how agent-ready a router is by
// linting the manifest IR for the things agents need.
import type { Manifest } from '@agentora/core';
import { evaluate } from './rules';

export type Severity = 'ok' | 'warn' | 'error';

export interface Finding {
  action: string;
  severity: Severity;
  /** Which readiness rule fired, e.g. "write-permission". */
  rule: string;
  message: string;
}

export interface Report {
  /** 0–100 agent-readiness score. */
  score: number;
  findings: Finding[];
}

/** Per-severity score deduction. Errors weigh 4x a warning. */
const WEIGHT: Record<Severity, number> = { ok: 0, warn: 5, error: 20 };

/**
 * Score a manifest's agent-readiness. Start at 100 and deduct per finding;
 * the score is deterministic and monotonic — removing a problem never lowers it.
 * An empty manifest scores 100 (nothing to flag).
 *
 * Rules (see ./rules.ts): every action needs a description; write actions must
 * declare idempotency, should declare a permission hook (auth), and should
 * declare bounded concurrency.
 */
export function doctor(manifest: Manifest): Report {
  const findings: Finding[] = [];
  for (const entry of manifest.actions) {
    findings.push(...evaluate(entry));
  }
  const deductions = findings.reduce((sum, f) => sum + WEIGHT[f.severity], 0);
  const score = Math.max(0, Math.min(100, 100 - deductions));
  return { score, findings };
}

export { RULES } from './rules';
