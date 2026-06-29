# Agent-readiness doctor

`@agentora/doctor` scores how agent-ready your actions are by linting the manifest IR. It is
agentora's headline feature: a number that tells you whether the capabilities you exposed are
safe and legible for agents to call.

```
$ npx agentora doctor
  ✓ products.search   ready
  ⚠ invoices.create   no permission hook
  ✗ accounts.delete   no idempotency key, unbounded concurrency
  Agent-readiness: 72/100
```

## Rules

| Rule | Severity | Fires when |
| --- | --- | --- |
| `description` | warn | An action has no description (agents read it to choose tools). |
| `write-idempotency` | error | A `write` action declares no idempotency. |
| `write-permission` | warn | A `write` action declares no `auth` (permission hook). |
| `write-concurrency` | warn | A `write` action declares no bounded `concurrency`. |

## Scoring

The score starts at 100 and deducts per finding (warning −5, error −20), clamped to
`[0, 100]`. It is **deterministic** and **monotonic** — fixing a problem never lowers the
score, and an empty manifest scores 100.

```ts
import { doctor } from '@agentora/doctor'

const report = doctor(app.manifest())
report.score    // 0–100
report.findings // [{ action, severity, rule, message }]
```

The `agentora doctor` CLI renders this report and exits non-zero when any error-severity
finding is present — wire it into CI to gate agent-readiness.
