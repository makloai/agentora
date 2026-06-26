// @agentora/doctor — the differentiator. Score how agent-ready a router is by
// linting the manifest IR for the things agents need.
import { type Manifest } from '@agentora/core';

export type Severity = 'ok' | 'warn' | 'error';

export interface Finding {
  action: string;
  severity: Severity;
  /** Which readiness rule fired, e.g. "no permission hook", "no idempotency key". */
  rule: string;
  message: string;
}

export interface Report {
  /** 0–100 agent-readiness score. */
  score: number;
  findings: Finding[];
}

/**
 * Rules (initial set):
 *  - write actions must declare idempotency
 *  - write actions should have a permission hook (auth middleware / scopes)
 *  - actions should declare bounded concurrency
 *  - outputs should use the typed error taxonomy
 *  - every action needs a description (agents read it)
 */
export function doctor(_manifest: Manifest): Report {
  // TODO: evaluate each ManifestEntry against the rule set, weight, and score.
  return { score: 0, findings: [] };
}
