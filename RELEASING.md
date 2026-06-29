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

## Authentication: `NPM_TOKEN` secret

Publishing authenticates with an npm access token stored as a repository secret.
The workflow passes it as `NODE_AUTH_TOKEN`, which the registry `.npmrc` (written
by `actions/setup-node`) reads.

### One-time setup

1. **Create an npm token** with publish rights to the `@agentora` scope —
   npmjs.com → **Access Tokens**. Use a **Granular** token scoped to `@agentora`
   with _Read and write_, or a classic **Automation** token. Automation/granular
   tokens bypass 2FA, which CI requires (an interactive OTP can't be entered in a
   workflow).
2. **Add it as a repo secret** named `NPM_TOKEN` — GitHub repo → Settings →
   Secrets and variables → Actions → New repository secret.

### Notes

- **Scope access** — every package sets `publishConfig.access: public`; the token
  owner must own (or belong to) the `@agentora` org/scope.
- **Provenance** — the workflow keeps `id-token: write` and
  `NPM_CONFIG_PROVENANCE=true`, so releases still publish with
  [npm provenance](https://docs.npmjs.com/generating-provenance-statements).
  Every package declares the `repository` field provenance requires.
- **First publish (bootstrap)** — the first release of these brand-new packages
  can also be done manually from a maintainer machine:
  `pnpm -r publish --access public` (the token in your `~/.npmrc` must bypass 2FA,
  i.e. an automation/granular token, since an interactive OTP blocks scripted
  publishes).

## Versioning policy

Packages are versioned independently (no `fixed`/`linked` groups in
`.changeset/config.json`). Internal dependents get a `patch` bump when a
dependency changes (`updateInternalDependencies: patch`).
