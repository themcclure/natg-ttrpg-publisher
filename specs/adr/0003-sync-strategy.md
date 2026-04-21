# ADR-0003 — Sync strategy

**Status:** Accepted (2026-04-18)
**Date:** 2026-04-18

## Context

Source content lives in an Obsidian vault outside this repo. Astro needs the content available at build time. There are three ways to bridge:

1. **Copy** — a sync script copies source files into `src/content/`, which is git-tracked and committed.
2. **Symlink** — `src/content/` is a symlink to the vault path.
3. **Direct read** — a custom content loader reads directly from the vault at build time; nothing lives in the repo.

Constraints that inform the choice:
- Vercel (ADR-0001) builds from a git checkout. The build host has no access to Mike's local vault.
- The source is authored on a different schedule than code changes. Players may get published site updates between code pushes.
- We want `git diff` on `src/content/` to serve as a human-readable changelog of what the upstream agent produced each session.

## Decision

**Copy. `src/content/` is git-tracked, overwrite-synced, and committed as part of the content-update workflow.**

## Why not symlink

- Symlinks don't travel through a `git push` to Vercel. The build host would have nothing to link to.
- Even locally, symlinks outside the repo create surprising behavior for `git status` and editors.

## Why not direct read

- Same fundamental problem: the build host doesn't have the vault.
- Could be solved by uploading the vault as a build artifact or fetching from a remote store, but that's strictly more machinery than copy-then-commit.
- Loses the "commit diff = session changelog" property, which is genuinely valuable for Mike to review before pushing.

## Consequences

- **`src/content/` is a build artifact of sorts** — humans don't edit it by hand. This is documented in R-F-02 and R-NF-07.
- Each sync produces a single commit (or a small cluster) whose diff shows exactly what changed since last session.
- Source files can be large (PDFs): git repo grows over time. Acceptable at expected scale (handouts are small PDFs, few per episode). If ever a concern, Git LFS is an incremental migration.
- Running `npm run build` on a fresh clone works without the vault, as long as `src/content/` is present (R-F-51).
- Sync is destructive: it deletes `src/content/` before copying. Nothing in that tree is precious — it is all derivable from the vault.

## Sync workflow (operational)

1. Author edits in Obsidian; upstream "publish skill" agent updates the sanitized vault.
2. Mike runs `npm run sync` in this repo.
3. Mike reviews `git diff src/content/`.
4. Mike commits and pushes.
5. Vercel builds and deploys.

## Alternatives considered for future

- **Automated sync + commit via a GitHub Action** triggered by a push to the vault repo (if the vault becomes its own repo). Attractive but premature; v1 is manual (R-F-50).
- **Git submodule** for the vault. Rejected: adds ceremony without removing the copy step, since Astro still needs a predictable path.

## Open items

- None. Committing PDFs confirmed acceptable: handouts only, not manuals — a handful per episode at small sizes. Revisit only if repo size ever becomes a nuisance.
