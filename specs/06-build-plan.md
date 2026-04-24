# NATG Publisher — Build Plan

Scope: phased implementation plan. Each milestone is a *shippable cut* of the project with concrete exit criteria. Milestones sequence to reduce rework: no milestone invalidates a prior one.

This plan defers the test strategy (`05-test-plan.md`) and visual palette (Q03). Both are addressed once a skeleton exists to test and style against.

---

## Execution model

Milestones are approval gates. The agent works through a milestone's deliverables until exit criteria are met, then reports at the boundary and waits for Mike's approval before starting the next one. Within a milestone, commits are incremental; blockers and judgment calls are surfaced rather than guessed through. See [CLAUDE.md](../CLAUDE.md) for the full working agreement.

## Principles

- **Build in thin vertical slices.** Each milestone takes the site end-to-end (sync → build → pages) a little further, rather than building every collection schema before any page exists.
- **No premature polish.** Styling, animations, and design refinements land in M5 or later, not scattered across earlier milestones.
- **Source fixtures first, real content second.** A stable fixture directory lets early work progress even when the upstream vault is mid-edit.
- **Every milestone is deployable.** Even M1 should be demonstrable — a screenshot, a terminal session, a running dev server.

---

## Minimum viable vs. full v1

Mike's hard requirement is **a browseable site before Session 1 of the campaign**. That defines a narrower "minimum viable" cut:

| Target                        | Requires           |
|-------------------------------|--------------------|
| **Minimum viable (pre-session-1)** | M1 + M2 + M3 + M4-lite + M6 |
| **Full v1**                   | M1 through M6      |

**M4-lite**: a wikilink plugin that *strips brackets and renders target text as plain text* with no link resolution. Avoids `[[Captain Riker]]` literals showing up in prose on day one. Full wikilink resolution (+ backlinks + container hierarchy) can land post-launch as M4-full.

If the campaign starts before M4-full + M5 ship, the site is ugly and cross-reference-poor but not embarrassing.

---

## Milestones

### M1 — Skeleton & sync

**Goal.** A repo that can take a source folder and populate `src/content/`.

**Deliverables.**
- Astro project scaffolded (`npm create astro@latest`, minimal starter).
- `package.json`, `package-lock.json`, `.nvmrc`, `.gitignore` (R-NF-08, R-NF-10).
- `natg.config.ts` reading `NATG_SOURCE` env var.
- `scripts/sync.ts` implementing R-F-02/03/04/05/06 (copy, skip rules, idempotency).
- `fixtures/natg-vault/` — a minimal source folder exercising every folder in R-F-04: at least one NPC, one character, one faction, one location, one starship, one timeline, one episode (`S00E01`), one handout (markdown + one PDF stub), one `_season.md`. Small, stable, handwritten.
- `npm run sync` command wired to `scripts/sync.ts`, defaulting to the fixtures folder.

**Exit criteria.**
- `npm run sync` produces a fully-populated `src/content/` tree matching the fixture, exits 0.
- Rerunning `npm run sync` is idempotent (no diffs).
- `git status` shows `src/content/` as tracked and committable.
- `.env.example` documents `NATG_SOURCE` (R-NF-08).

**Size.** S. ~half a day.

**Explicit non-goals.** No content schemas, no pages, no styling. Astro hasn't been asked to build anything yet.

---

### M2 — Content collections & schemas

**Goal.** Every file in `src/content/` is loaded through a typed collection and validated.

**Deliverables.**
- `src/content/config.ts` defining the 8 collections per `03-content-model.md` with Zod schemas.
- Utilities for slug derivation (filename → kebab URL slug) and title resolution (frontmatter → filename fallback), shared between collections and the (future) link index.
- Custom handling for `episodes/S##E##/index.md` (episode code must match folder name) and season-level `_season.md` files (loaded separately, not as a collection entry).
- PDF handouts loaded as data-only entries (filename + size), not as markdown.

**Exit criteria.**
- `npm run build` succeeds against the M1 fixture.
- Intentionally malforming a fixture file's frontmatter (e.g. set `episode: S99E99` on `S00E01/index.md`) makes the build fail with the file path + field in the error (R-F-13).
- `astro check` (if we adopt it) passes.

**Size.** S/M. ~half to one day.

**Explicit non-goals.** No page templates yet, no remark plugins, no custom rendering. Just schemas and validation.

---

### M3 — Templates (unstyled)

**Goal.** Every page in `04-design.md` renders from real content. Markdown bodies render with default typography. Wikilinks show as literal `[[target]]` text for now.

**Deliverables.**
- Shared `Layout.astro` with the header nav, footer disclaimer, and skip-to-content link.
- The ten templates from `04-design.md`:
  1. Landing
  2. Collection index (shared across 6 sub-collections)
  3. Entity page (shared across NPC/Character/Faction/Starship/Timeline)
  4. Location page (entity + hierarchy, breadcrumb + Contains section placeholders)
  5. Encyclopedia landing
  6. Episode log index
  7. Season page
  8. Episode page
  9. Handout page
  10. About + 404
- "Current episode" derivation helper (highest `S##E##` in episodes, R-F-44).
- All route paths from `02-architecture.md` resolve (navigating from the landing to any entity works).

**Exit criteria.**
- `npm run dev`: every page in the route table is reachable with no 404s.
- Every entity in the fixture has an entity page.
- Breadcrumbs appear everywhere except the landing.
- About page shows the fan-project disclaimer and license text (R-NF-16/17).

**Size.** M. One to two days — ten templates is the bulk of the work, but each is short.

**Explicit non-goals.** Styling beyond browser defaults. No wikilink resolution, no backlinks, no container hierarchy. Portraits reference raw paths (may be broken until M4-full).

---

### M4 — Cross-references & hierarchy

Split into a pre-launch minimum and a post-launch full version.

#### M4-lite (pre-launch)

**Goal.** Prose doesn't leak wikilink syntax to readers.

**Deliverables.**
- A remark plugin that matches `[[target]]` / `[[target|alias]]` / `![[image.ext]]` and:
  - For alias form: renders the alias as plain text.
  - For unaliased form: renders the target as plain text.
  - For image embeds: rewrites to `<img>` with the target as `alt` fallback and the resolved asset path (R-F-30).
- No link building yet, no warnings report, no backlinks.

**Exit criteria.**
- No `[[…]]` syntax visible in any rendered page.
- Images in fixture prose render inline.

**Size.** S. Few hours.

#### M4-full (post-launch)

**Goal.** Wikilinks resolve per ADR-0002, backlinks appear, locations show hierarchy.

**Deliverables.**
- **Link index builder**: walks all collections once per build, indexing by normalized filename / title / alias; exposes a resolver used by the remark plugin.
- **Wikilink resolution** per ADR-0002: filename → scoped → title → alias → broken. Broken links get `.wikilink-broken` + `title` attribute; warning emitted.
- **Backlinks accumulation**: during plugin execution, reverse edges recorded by target; entity templates render the "Referenced by" section (R-F-24).
- **Container hierarchy**:
  - At build time, resolve each location's `container` (with cycle detection).
  - Build the parent-chain breadcrumb renderer used by the location-page variant.
  - Accumulate reverse "contains" relation for the Contains section.
- **Build warnings report**: a console summary at end of build grouping unresolved wikilinks, unresolved containers, missing image/PDF assets, and filename-fallback alt text (R-F-53, R-NF-18, R-NF-19).
- **Failure thresholds** wired per R-NF-18: broken wikilinks fail the build above threshold (default: any). Container cycles always hard-fail.

**Exit criteria.**
- Every wikilink in the fixture either resolves to a working link or shows a broken-link style and logs a warning.
- Fixture NPC page shows backlinks from faction / location pages referencing it.
- Fixture location page shows breadcrumbs up through `container` chain and a Contains list of children.
- Introducing a bad wikilink in a fixture file produces exactly one warning line with file + line + target.
- Introducing a container cycle fails the build with a clear message.

**Size.** M/L. Two to three days — the link index + plugin is the single biggest piece of code in the project.

---

### M5 — Styling pass

**Goal.** Site matches the principles in `04-design.md`. Palette and typography answered (Q03).

**Deliverables.**
- `src/styles/theme.css` with the full palette as CSS custom properties (ADR-0004).
- `src/styles/base.css` with resets, element defaults, and focus/skip-link behavior.
- Component-level styles in each template's `<style>` block.
- Responsive layout: mobile-first, with the two-column entity page above ~720px.
- Self-hosted fonts (R-NF-15).
- Honor `prefers-color-scheme` (if light + dark both committed) and `prefers-reduced-motion`.
- A contrast audit pass against the chosen palette, resolving any AA failures.

**Exit criteria.**
- Every template matches its composition from `04-design.md`.
- Lighthouse accessibility score ≥ 95 on a representative page.
- No hex literals outside `theme.css` (grep-enforced).
- Site works with JavaScript disabled (R-NF-01).
- R-NF-04 page-weight budget met on a representative entity page.

**Size.** M. One to two days — driven by how fiddly Q03 ends up being.

**Dependency.** This is the milestone that unblocks Q03; expect one iteration cycle with Mike between a draft palette and the accepted one.

---

### M6 — Hardening & deploy

**Goal.** Site is live on Vercel with baseline security and repo hygiene.

**Deliverables.**
- `vercel.json` with security headers per R-NF-14.
- `LICENSE` (MIT) per R-NF-17.
- `README.md` with setup, sync workflow, and the code-vs-content license note.
- `/about/` page populated (referenced in M3, content finalized here).
- Vercel project created; GitHub integration connected (ADR-0001); first deploy to a Vercel-assigned URL.
- `npm audit --production` clean (R-NF-11).
- `.env.example` finalized (R-NF-08).

**Exit criteria.**
- Pushing to `main` triggers a Vercel build that succeeds and publishes.
- `curl -I https://<url>` shows CSP, X-Frame-Options, Referrer-Policy (R-NF-14).
- DevTools Network tab shows only same-origin requests (R-NF-15).
- Footer disclaimer appears on every page (R-NF-16).

**Size.** S. Half a day, most of it in Vercel dashboard clicks.

---

## Critical path summary

```
M1 (skeleton)
  └─ M2 (schemas)
       └─ M3 (templates)
            ├─ M4-lite ──┐
            │           ├─> M6 (deploy) ──> SESSION 1 GO-LIVE
            └─ M4-full  ─┤
                        └─> M5 (styling) ──> FULL v1
```

M4-lite and the first deploy can ship in parallel with authoring real content into the upstream vault; M4-full and M5 continue post-launch.

---

## Risks & contingencies

| Risk                                                                                 | Mitigation                                                                                                                         |
|--------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| Obsidian wikilink corner cases not covered by ADR-0002 surface during M4-full.       | Log specific cases, patch ADR-0002 (or supersede with a follow-up ADR), don't widen scope silently.                                |
| Source vault evolves faster than the publisher (new top-level folder appears).       | The sync script should log unknown top-level folders as a warning, not fail. Addressed at M1.                                     |
| Q03 palette iteration stalls the styling pass.                                       | M5 can ship with a placeholder palette (plain neutral theme) and swap later; ADR-0004 makes palette a one-file change.            |
| Vercel's Astro preset changes or breaks.                                             | Pin the Astro version in `package.json`; maintain a local `npm run build` check before relying on Vercel's build.                 |
| PDF handouts grow large enough to bloat the repo.                                    | Revisit Git LFS per ADR-0003's open-items. Not v1.                                                                                 |
| The upstream vault produces a file type we don't handle (e.g. `.canvas`, `.excalidraw`). | M1 sync skips non-allowlisted types silently; add coverage when it becomes real.                                                  |

---

## Scheduled revisits

Tasks pinned to events rather than dates. Revisit when the triggering condition is met.

- **Content schema tightening** — trigger: ~3 real play sessions' worth of content has landed from the upstream agent (approximately 6–10 entries per collection). Audit frontmatter field presence; promote universally-populated fields from optional to required in [03-content-model.md](03-content-model.md) and [src/content.config.ts](../src/content.config.ts). Re-run the build against accumulated content to confirm the tightened schema holds.

## Out of scope for v1 (explicit)

These are **not in any milestone**. Revisit post-launch:

- Search (client or server). Possibly Pagefind later.
- Tag clouds, graph views, "recently updated."
- Draft / preview mode (R-NF-07).
- Per-season branding or faction sub-themes.
- Image optimization (Astro `<Image>` / remark rewrite). Q07 deferred.
- RSS/feeds for new episodes.
- Authentication or gated content.
- Automated dependency updates (Dependabot/Renovate setup — trivial to add, but post-launch).
- GitHub Actions CI checks (audit/typecheck/a11y). Not required for Vercel deploy.
- Automated accessibility tests (axe, pa11y). Manual audit in M5 only.

---

## What this doc does NOT cover

- **What "tested" means.** That's `05-test-plan.md` (next).
- **Task-level breakdown inside a milestone.** Intentionally — the milestones are the plan; sub-tasks live in the actual implementation session.
- **Hours/days estimates.** Sizing is `S / M / L` only; real time depends on Mike's session cadence.
