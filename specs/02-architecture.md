# NATG Publisher — Architecture

Scope: high-level shape of the system. Decisions live in ADRs; this doc summarizes and cross-references them.

---

## System diagram

```
┌──────────────────┐  sync   ┌──────────────────┐  astro build  ┌─────────┐  deploy  ┌────────┐
│ Obsidian vault   │────────▶│ src/content/     │──────────────▶│  dist/  │─────────▶│ Vercel │
│ (source, read-   │  (copy) │ (git-tracked)    │               │ static  │  (git    │        │
│  only, sanitized)│         │                  │               │  site   │   push)  │        │
└──────────────────┘         └──────────────────┘               └─────────┘          └────────┘
         ▲                            ▲
         │                            │
   upstream "publish                  │
   skill" agent writes         remark/rehype pipeline:
   sanitized files here         - wikilink resolver
                                - image/pdf rewriter
                                - frontmatter validator
```

Key invariant: **`src/content/` is the build-time source of truth.** The external vault path is only consulted during `npm run sync`. Builds on CI/Vercel never touch the vault.

---

## Tech stack

| Layer             | Choice                                              | Rationale                                                             |
|-------------------|-----------------------------------------------------|-----------------------------------------------------------------------|
| SSG               | Astro (latest stable) with content collections     | First-class markdown, typed schemas, zero-JS by default (R-NF-01).    |
| Language          | TypeScript                                          | Schema validation via Zod, shared types for link index.               |
| Markdown pipeline | remark + rehype plugins (custom)                    | Wikilink + asset rewriting at build time.                             |
| Styling           | Plain CSS (or minimal utility via Astro scoping)    | Avoid build-time JS cost; LCARS-inspired palette in CSS custom props. |
| Package manager   | npm                                                 | Matches Vercel defaults, no contributor onboarding cost.              |
| Hosting           | Vercel (proposed)                                   | See ADR-0001.                                                         |
| Node version      | LTS, pinned via `.nvmrc` / `engines`                | Reproducible builds.                                                  |

---

## Content pipeline

### Sync (`npm run sync`)

1. Read source path from project config (env var or `natg.config.ts`, TBD in implementation).
2. Remove `src/content/` entirely.
3. Recursively copy supported files from source (see R-F-03) into `src/content/`, preserving structure.
4. Skip files starting with `_` or `.`; skip any `CLAUDE.md` at any depth. Preserve `episodes/S##/_season.md` (leading underscore but name-matched).
5. Print a summary: files copied per collection, bytes, duration.
6. Exit non-zero if the source path is missing or unreadable.

See ADR-0003 for why copy (vs. symlink / direct read).

### Build (`npm run build`)

Astro invokes the content loader, which:

1. Loads each collection using a Zod schema (see `03-content-model.md`, TBD).
2. Pre-builds a **link index** mapping normalized slugs → `{collection, slug, title}` for wikilink resolution.
3. Runs the markdown pipeline per entry:
   - **Wikilink remark plugin** rewrites `[[target]]` / `[[target|alias]]` / `![[image.png]]` per ADR-0002.
   - **Asset rewrite plugin** resolves image/PDF references to their copied path under `src/content/`.
   - **Frontmatter validator** fails the build on schema mismatch (R-F-13).
4. Renders pages via Astro page templates (see Routes below).
5. Emits a **warnings report** at end of build: unresolved links, missing assets, empty collections (R-F-53).

### Backlinks

During build, as each entry's links are resolved, the reverse edges are accumulated into a `backlinks` map keyed by target. Entity templates read from this map to render the backlinks section (R-F-24). This is a pure in-memory build step — no runtime.

---

## Routes

| Path                                            | Page                                              | Source                                    |
|-------------------------------------------------|---------------------------------------------------|-------------------------------------------|
| `/`                                             | Landing (current-episode callout + section links) | Derived                                   |
| `/characters/`                                  | Characters index                                  | `characters/` collection                  |
| `/characters/[slug]/`                           | Character page                                    | `characters/[slug].md`                    |
| `/encyclopedia/`                                | Encyclopedia landing (5 subsection links)         | Derived                                   |
| `/encyclopedia/npcs/` + `/npcs/[slug]/`         | NPC index + page                                  | `npcs/` collection                        |
| `/encyclopedia/factions/` + `[slug]/`           | Factions                                          | `factions/` collection                    |
| `/encyclopedia/locations/` + `[slug]/`          | Locations                                         | `locations/` collection                   |
| `/encyclopedia/starships/` + `[slug]/`          | Starships                                         | `starships/` collection                   |
| `/encyclopedia/timelines/` + `[slug]/`          | Timelines                                         | `timelines/` collection                   |
| `/episodes/`                                    | Episode log (seasons list, current highlighted)   | Derived from `episodes/`                  |
| `/episodes/[season]/`                           | Season page (e.g. `/episodes/S00/`)               | Derived; uses `_season.md` display name   |
| `/episodes/[season]/[episode]/`                 | Episode page (e.g. `/episodes/S00/S00E01/`)       | `episodes/S##E##/index.md`                |
| `/episodes/[season]/[episode]/handouts/[slug]/` | Handout page (markdown handouts only)             | `handouts/S##E##/[slug].md`               |
| `/assets/…`                                     | Images and PDFs (direct file serving)             | Copied from source                        |

Slug rules: kebab-case from filename, lowercased. Collisions within a collection fail the build.

Seasons use `S##` in URLs, not display names — keeps URLs stable if display names change. "Pilot" is a nav label, not a route.

---

## Configuration

A single `natg.config.ts` at the repo root holds the small amount of operator configuration:

```ts
export default {
  sourcePath: process.env.NATG_SOURCE ?? '../natg-vault/encyclopedia',
  siteTitle: 'NATG Encyclopedia',
  siteUrl: 'https://TBD.vercel.app',
};
```

No per-collection config; collections are discovered by folder name.

---

## What's intentionally NOT in this architecture (v1)

- No database. Everything is flat files + build-time derivation.
- No serverless functions. Fully static output.
- No client-side framework (React/Vue/Svelte). Astro-native components only.
- No search index. Deferred; if added later, likely Pagefind (build-time static index).
- No preview environments per branch. Single deploy pipeline.

---

## ADRs referenced

- **ADR-0001** — Hosting target (Vercel).
- **ADR-0002** — Wikilink resolution algorithm.
- **ADR-0003** — Sync strategy (copy vs. symlink vs. direct read).

Future ADRs expected as implementation proceeds (image handling, search, deploy automation).
