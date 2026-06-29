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

## Authentication: npm Trusted Publishing (no tokens)

Publishing authenticates with [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers):
GitHub Actions presents an OIDC identity token, npm verifies it against a
publisher you registered, and issues short-lived credentials for that run. There
is **no `NPM_TOKEN` secret** to create, leak, or rotate, and provenance is
generated automatically.

The workflow already has what it needs: `id-token: write` permission, and a step
that upgrades the runner to npm ≥ 11.5.1 (Trusted Publishing requires it; the
Node 20/22 bundled npm is too old).

### One-time setup on npmjs.com

For **each** `@agentora/*` package, register this repo as a trusted publisher:
package page → **Settings → Trusted Publisher → GitHub Actions**, then enter:

- **Organization / repository:** `makloai/agentora`
- **Workflow filename:** `release.yml`
- **Environment:** leave blank (the workflow defines none)

### First publish (bootstrap)

A trusted publisher can only be attached to a package that already exists on npm.
For the **initial** publish of these brand-new packages, either:

1. publish once manually from a maintainer machine (`pnpm -r publish --access public`,
   while logged in to an account that owns the `@agentora` scope), then register
   the trusted publishers above so every subsequent release is tokenless; or
2. if your npm org allows it, pre-create the trusted-publisher config and let the
   first CI run create the packages.

After bootstrap, releases are fully automated and require no secrets.

### Notes

- **Scope access** — every package sets `publishConfig.access: public`; the
  publishing identity must own (or belong to) the `@agentora` org/scope.
- **Provenance** — Trusted Publishing emits
  [npm provenance](https://docs.npmjs.com/generating-provenance-statements)
  automatically (`id-token: write` enables it). Every package declares the
  `repository` field provenance requires.

## Versioning policy

Packages are versioned independently (no `fixed`/`linked` groups in
`.changeset/config.json`). Internal dependents get a `patch` bump when a
dependency changes (`updateInternalDependencies: patch`).
