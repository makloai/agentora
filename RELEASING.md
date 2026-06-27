# Releasing

Publishing is automated with [Changesets](https://github.com/changesets/changesets)
and GitHub Actions. You never run `npm publish` by hand.

## The flow

1. **Add a changeset with your PR.** When a change should ship, run:

   ```bash
   pnpm changeset
   ```

   Pick the affected packages and a bump (patch / minor / major), write a one-line
   summary, and commit the generated file under `.changeset/`. CI fails a PR that
   touches packages without a changeset (the `changeset` job in `ci.yml`).

2. **Merge to `main`.** The `Release` workflow (`.github/workflows/release.yml`)
   runs on every push to `main`:
   - If unreleased changesets exist, it opens/updates a **"Version Packages"** PR
     that applies the version bumps, updates changelogs, and refreshes the
     lockfile.
   - Review and merge that PR. The next `Release` run sees no pending changesets
     and **publishes** the bumped packages to npm (`pnpm release` =
     `pnpm build && changeset publish`).

Private packages (e.g. `examples/*`) are skipped automatically. Internal
`workspace:*` dependencies are rewritten to real versions on publish.

## One-time setup

- **`NPM_TOKEN` repository secret** — a granular/automation npm token with publish
  rights to the `@agentora` scope. Settings → Secrets and variables → Actions.
  The workflow passes it as `NODE_AUTH_TOKEN`, which the npm registry `.npmrc`
  (written by `actions/setup-node`) reads.
- **npm scope access** — every package sets `publishConfig.access: public`, so the
  first publish creates the public `@agentora/*` packages. The publishing account
  must own (or be a member of) the `@agentora` org/scope.
- **Provenance** — the workflow has `id-token: write` and sets
  `NPM_CONFIG_PROVENANCE=true`, so each release is published with
  [npm provenance](https://docs.npmjs.com/generating-provenance-statements).
  Every package declares a `repository` field, which provenance requires.

## Versioning policy

Packages are versioned independently (no `fixed`/`linked` groups in
`.changeset/config.json`). Internal dependents get a `patch` bump when a
dependency changes (`updateInternalDependencies: patch`).
