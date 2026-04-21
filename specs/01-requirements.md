# NATG Publisher — Requirements

Requirement IDs are stable. Other specs cite them (e.g. "satisfies R-F-12"). Append new requirements; do not renumber.

---

## Functional requirements

### Source ingestion

- **R-F-01** A configurable source folder path identifies the Obsidian vault slice to publish. Path is read from a project-level config (not hard-coded).
- **R-F-02** A `sync` command copies all supported files from the source folder into `src/content/` within the repo. `src/content/` is treated as a build artifact: fully overwritten on each sync, never hand-edited.
- **R-F-03** Supported file types: `.md`, image formats (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`), and `.pdf`.
- **R-F-04** Folder structure under the source root is preserved under `src/content/`. Recognized top-level folders: the collection folders `characters/`, `factions/`, `locations/`, `npcs/`, `starships/`, `timelines/`, `handouts/S##E##/`, `episodes/S##E##/`, plus the asset-carrier folder `images/` (not a content collection; holds image files referenced by wikilinks elsewhere). Other top-level folders are still copied but emit a sync-time warning so a drift in the source vault's shape is noticed early.
- **R-F-05** Files whose names start with `_` or `.` are skipped. **`CLAUDE.md` files at any depth in the source tree are skipped** — they belong to the authoring environment, not the published encyclopedia. `episodes/S##/_season.md` is explicitly whitelisted despite its leading underscore (see R-F-16).
- **R-F-06** Sync is idempotent: running it twice against an unchanged source produces no diff in `src/content/`.

### Content model

- **R-F-10** Each entity folder (`factions/`, `locations/`, `npcs/`, `starships/`, `timelines/`, `characters/`) corresponds to an Astro content collection with a typed schema.
- **R-F-11** `handouts/` is a collection whose entries carry an `episode` field (e.g. `S00E01`) derived from the `S##E##` parent subfolder. Handouts are in-world documents (PDFs or markdown). Episode summaries are **not** in `handouts/` — see R-F-14.
- **R-F-12** Every markdown entry supports a minimum frontmatter schema: `title` (required, falls back to filename), `aliases` (optional list), plus type-specific fields defined per collection.
- **R-F-13** The content loader fails the build if a required frontmatter field is missing or malformed, with the file path in the error. The upstream authoring agent is responsible for producing complete entries; there is no `draft` state in the source (R-NF-07).
- **R-F-14** `episodes/` is a collection structured as one folder per episode (`episodes/S##E##/`), each containing an `index.md` (the episode recap) and any number of referenced files. The recap's frontmatter requires: `episode` (e.g. `S00E01`, must match folder name), `title`, `airDate` (ISO date of the first play session covering this episode), `teaser` (short summary). The recap body may link to handouts, characters, and other entities via wikilinks.
- **R-F-15** `characters/` extends the `npcs/` schema with one additional optional field, `player` (the player's first name only — a narrow, author-acknowledged exception to R-NF-09). Schema will expand as authored content accrues.
- **R-F-16** Seasons are a navigation grouping derived from the `S##` prefix of episode folders. An optional `episodes/S##/_season.md` file may provide season-level frontmatter; the only recognized field in v1 is `displayName` (e.g. `S00` → "Pilot"). If absent, display name defaults to `Season ##`.
- **R-F-17** `timelines/` entries are chronological-list markdown documents. v1 treats them as free-form markdown with the standard `title`/`aliases` frontmatter — no structured event schema. Two usage patterns are expected: a single PC-focused master timeline, and optional per-entity timelines (one per file). Schema will expand if patterns emerge after initial authoring.

### Wikilinks

- **R-F-20** Markdown is parsed with Obsidian-style `[[wikilink]]` syntax, including `[[target|alias]]` display aliases.
- **R-F-21** Resolution order: (a) exact filename match across all collections; (b) if ambiguous, require a scoped form `[[folder/Target]]`; (c) match against `aliases` frontmatter as a secondary pass.
- **R-F-22** Unresolved wikilinks render as visibly broken (distinct styling, non-navigable) and emit a build warning listing source file, line, and target.
- **R-F-23** Resolved wikilinks render as internal `<a>` links to the target entity page; the link text is the alias if provided, otherwise the target's display title.
- **R-F-24** Backlinks: each entity page lists the other entities whose content links to it, grouped by collection.

### Images & PDFs

- **R-F-30** Embedded images in markdown (including Obsidian `![[image.png]]` syntax) resolve to the copied file under `src/content/` and render inline with appropriate `alt` text (fallback: filename; see R-NF-19).
- **R-F-31** PDFs are not rendered inline. They appear as download links with filename and size. Handout PDFs are listed on their episode page.
- **R-F-32** Missing image or PDF references emit a build warning and render a broken-asset placeholder.

### Site structure

- **R-F-40** The site has three top-level sections accessible from global navigation: **Characters**, **Encyclopedia**, **Episode Log**.
- **R-F-41** The Encyclopedia section subdivides by entity type: NPCs, Factions, Locations, Starships, Timelines. Each subsection is an index page listing all entries alphabetically by title.
- **R-F-42** The Episode Log is organized by season. The log index lists seasons (using their `displayName`, e.g. "Pilot, Season 01, Season 02…"); each season page lists its episodes in ascending `S##E##` order with teaser. Each episode page shows recap body, air date, and links to its handouts.
- **R-F-43** The landing page highlights the **current episode** (see R-F-44) and links to the three top-level sections.
- **R-F-44** "Current episode" is defined as the episode with the highest `S##E##` present in `src/content/episodes/`. No separate config flag in v1.
- **R-F-45** Every entity page shows: title, aliases (if any), rendered body, backlinks section.

### Build & deploy

- **R-F-50** `npm run sync` ingests source → `src/content/`.
- **R-F-51** `npm run build` produces a static site in `dist/`, independent of the source folder (builds succeed without the source folder present, as long as `src/content/` is populated).
- **R-F-52** `npm run dev` runs Astro's dev server against current `src/content/`.
- **R-F-53** Build surfaces all warnings (broken links, missing assets, schema issues) as a summary at the end of the build (see R-NF-18 for fail-vs-warn thresholds).
- **R-F-54** `src/content/` is git-tracked. Content updates are committed explicitly after a sync.

---

## Non-functional requirements

- **R-NF-01** No JavaScript is required to read any page. JS may enhance (e.g. search), but must not gate content.
- **R-NF-02** Accessibility: pages meet WCAG 2.1 AA for color contrast, keyboard navigation, and semantic markup. LCARS-inspired palettes are permitted only if they meet contrast requirements.
- **R-NF-03** Static build time for ~200 entries should complete in under 30 seconds on Mike's laptop.
- **R-NF-04** Total page weight for an average entity page should be under 200 KB (excluding images).
- **R-NF-05** The repo is publishable to Vercel with zero additional configuration beyond a standard Astro preset.
- **R-NF-06** No analytics or third-party tracking in v1.
- **R-NF-07** The source folder is assumed complete: every file present is publishable. There is no `draft` or gating flag. The upstream authoring agent is responsible for only landing entries that are ready.

### Secrets & configuration

- **R-NF-08** No credentials, API keys, or tokens are committed to the repo. Secrets are loaded from `.env.local` (local dev) or Vercel environment variables (production). A `.env.example` file documents required variable names with no values. `.gitignore` excludes `.env*` except `.env.example`.
- **R-NF-09** No personally identifying information (player real names, email addresses, etc.) is authored into source content. In-world character names only. Enforced by authoring convention and review, not by code.

### Dependency & build hygiene

- **R-NF-10** The package lockfile (`package-lock.json`) is committed. Node version is pinned via `.nvmrc` and `engines` in `package.json`. Fresh clones build identically.
- **R-NF-11** `npm audit --production` exits clean (no high/critical advisories) at release. Automated dependency updates (Dependabot or Renovate) are enabled once the repo is on GitHub.

### Content safety

- **R-NF-12** Markdown rendering is safe-by-default: raw HTML embedded in source markdown is disabled or sanitized, so no source file can inject scripts or arbitrary attributes into rendered pages. Astro's default markdown pipeline satisfies this; any deviation requires an ADR.
- **R-NF-13** All external (non-same-origin) `<a>` tags render with `rel="noopener noreferrer"`.

### Deployment security

- **R-NF-14** Production deploy sets a baseline set of security headers via `vercel.json`: a restrictive `Content-Security-Policy` (no inline scripts, no third-party domains), `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy` with unused features disabled. The specific CSP will be captured in a future ADR.
- **R-NF-15** No third-party resources load at runtime. No external fonts, CDN scripts, analytics, or embeds. Fonts are self-hosted; all assets are served same-origin. Strengthens R-NF-06.

### IP & licensing

- **R-NF-16** The site footer displays on every page: "Unofficial fan project. Star Trek and related marks are trademarks of Paramount/CBS. Not affiliated with or endorsed by the rights holders." The disclaimer links to an `/about` page expanding on this.
- **R-NF-17** The publisher code (Astro site, scripts, config) is licensed under MIT in `LICENSE`. Campaign content under `src/content/` is not open-licensed; rights are retained by Mike. The distinction is stated in `README.md` and on the `/about` page. Captured in a future ADR.

### Operational

- **R-NF-18** Sync scripts and any helper CLIs exit with non-zero status on error, write human-readable errors to stderr, and never fail silently. Build-time issues are categorized:
  - **Fail the build:** broken wikilinks (count exceeding a configurable threshold, default: any), malformed frontmatter (R-F-13), unreadable source files.
  - **Warn only:** missing image/PDF assets (R-F-32), filename-fallback alt text (R-NF-19), ambiguous wikilinks where the author has not yet scoped.
- **R-NF-19** Alt text is an authoring convention: use Obsidian's `![[image.png|alt text]]` or standard markdown `![alt](path)`. Images falling through to the filename-based alt (R-F-30) emit a **build warning only** and never block the build or deploy. Filename-fallback alt is a valid published state.

---

## Open questions

- **Q03 — Visual design direction.** LCARS-inspired palette acceptable, but full LCARS chrome is out. Needs a design pass (specs/04-design.md) before implementation.
- **Q07 — Image optimization.** Astro's `<Image>` component requires images to be imported, which is awkward with markdown-authored references. Either accept unoptimized images in v1, or invest in a remark plugin that rewrites refs. Defer.

### Resolved

- **Q01 (resolved)** — Characters section sourced from a presumed `characters/` folder in the vault; same schema as NPCs for v1.
- **Q02 (resolved)** — Vercel is the initial deployment target. May change later; ADR-0001 is accepted.
- **Q04 (resolved)** — Wikilink normalization + resolution order specified in ADR-0002 (accepted).
- **Q05 (resolved)** — Timelines are chronological-list markdown; mix of a single PC-focused master and optional per-entity timelines. No structured schema in v1 (R-F-17).
- **Q06 (resolved)** — Seasons are a navigation level; `S00` displays as "Pilot" via season `displayName`.
