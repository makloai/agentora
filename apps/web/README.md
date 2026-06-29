# agentora website

The marketing/landing site for [agentora](https://github.com/makloai/agentora) —
Next.js (App Router) + Tailwind v4, deployed on Vercel.

It is **isolated from the SDK pnpm workspace** (own `pnpm-workspace.yaml`) so its
deps and build never touch the package publish pipeline.

```bash
cd apps/web
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # production build
```

## Deploy

The Vercel project's **Root Directory** is set to `apps/web`. The `preview` and
`production` GitHub Actions workflows deploy on PRs and on merge to `main`.
