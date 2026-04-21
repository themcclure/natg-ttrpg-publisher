# ADR-0001 — Hosting target

**Status:** Accepted (2026-04-18)
**Date:** 2026-04-18

## Context

The publisher produces a fully static site (no serverless, no DB) with manual-trigger deploys. We need a hosting target that is cheap (ideally free at v1 scale), deploys on git push, and supports a custom domain later.

## Options considered

| Option             | Pros                                                            | Cons                                                                   |
|--------------------|------------------------------------------------------------------|------------------------------------------------------------------------|
| Vercel             | Zero-config Astro preset, git push = deploy, generous free tier | Some concerns over vendor lock-in at scale (not relevant here).        |
| Netlify            | Equivalent to Vercel in capability                              | No decisive advantage; team unfamiliar with Netlify's newer features.  |
| Cloudflare Pages   | Best free-tier limits, fastest edge                             | Astro support is good but less polished than Vercel's.                 |
| GitHub Pages       | Zero hosting cost, lives with the repo                          | No preview deploys, clunky for custom domains + HTTPS edge cases.      |
| Self-host (VPS)    | Full control                                                    | Ops overhead not worth it for a static site.                           |

## Decision

Use **Vercel**. The site is static, the deploy story is trivial, and the free tier is more than sufficient for a players-only-scale audience. Git-push-to-deploy aligns with the manual-trigger workflow (R-F-50 ff.): after a sync commit, push lands content in production.

## Consequences

- Repo is hosted on GitHub. Deploy uses **Vercel's native GitHub integration** (configured once in the Vercel dashboard), not GitHub Actions. On every push to `main`, Vercel pulls the commit, runs `npm install && npm run build`, and publishes `dist/`.
- Commit → push → deploy. No separate deploy command, no `.github/workflows/` file required for publishing.
- Preview deploys on non-main branches are available for free — useful for trying design changes.
- No serverless functions in v1 (R-NF-05). If ever needed, Vercel supports them natively.
- DNS for a custom domain will be configured when one is chosen; defer.
- If Vercel's policies or pricing change materially, migration to Netlify or Cloudflare Pages is a weekend's work because the build output is a plain static `dist/`.
- **GitHub Actions are a separate concern**, reserved for pre-merge CI checks (npm audit per R-NF-11, typecheck, accessibility tests, link checking). Actions can be added incrementally without touching the deploy path.

## Open items

- None. Repo host and deploy mechanism are settled.
