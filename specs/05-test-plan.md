# NATG Publisher — Test Plan

Scope: what "works" means for this project. Defines pass/fail signals per milestone, the fixture strategy, and the mix of automated vs. manual checks. Keeps testing proportional to project size — this is a solo-maintained static site, not a transactional system.

Cross-referenced: `01-requirements.md` (every R-F and R-NF is a candidate for a check), `06-build-plan.md` (exit criteria per milestone), ADR-0002 (wikilink resolution — the biggest logic surface to test).

---

## Testing philosophy

- **Prefer build-time checks over runtime tests.** The site is static. If something is wrong, a failing build catches it before it reaches players.
- **Fixtures do most of the work.** `fixtures/natg-vault/` is exercised by every build; it's designed to include both happy-path and degenerate cases.
- **Automated where the cost is low and the payoff is recurring.** Unit tests for pure functions (slug derivation, wikilink normalization, container resolution). Skip automated tests for things that are obvious to eyeball (does a page render).
- **Manual smoke tests at milestone boundaries.** A short checklist per milestone exit, run by Mike (or the agent) before declaring the milestone done.
- **Accessibility is not optional.** AA-level a11y is a requirement (R-NF-02); treat a failing contrast check or missing focus state as a build-blocker, not a warning.

---

## Three layers of checks

### 1. Schema validation (Zod, at build time)

Astro's content loader applies the schemas from `src/content/config.ts` to every entry. This is free coverage of R-F-12, R-F-13, R-F-14.

**Covers:**
- Required fields present and well-typed (e.g. `episode` matches `^S\d{2}E\d{2}$`, `airDate` is a real calendar date).
- Unknown fields silently ignored.
- Episode folder name matches frontmatter `episode` value (custom check, not pure Zod).

**Failure mode:** build exits non-zero, file path + field in the error.

### 2. Build-time integrity report (custom, M4-full)

After content loads and remark plugins run, a single pass summarizes:

- **Wikilinks**: unresolved, ambiguous, counts per category (ADR-0002).
- **Container references**: unresolved, cycles detected.
- **Asset references**: missing images, missing PDFs.
- **Alt text**: images using filename-fallback alt (R-NF-19).
- **Slug collisions**: within-collection duplicate slugs.

Output is a single console block at end of build, each line in a grep-friendly shape: `[category] SEVERITY  source:line  target` (or similar — format locked when M4-full lands).

**Failure mode** (R-NF-18):
- **Fail build:** wikilinks exceeding the configured threshold, slug collisions, container cycles, schema errors.
- **Warn only:** filename-fallback alt text, missing assets, ambiguous wikilinks.

Thresholds and categorization are driven by `natg.config.ts`.

### 3. Unit tests (narrow, on pure logic)

Only for functions with non-obvious logic and high reuse. Written with Vitest (built-in Astro-compatible) when the function lands. Candidates:

| Function                          | Why test                                                                 |
|-----------------------------------|--------------------------------------------------------------------------|
| `slugify(filename)`               | Rules in `03-content-model.md` have edge cases (parens, multi-dash).     |
| `normalizeWikilinkTarget(raw)`    | Case, whitespace, `-`/`_`/space equivalence per ADR-0002.                |
| `resolveWikilink(target, index)`  | Multi-tier resolution (filename → scoped → title → alias → broken).      |
| `detectContainerCycle(locations)` | Must catch arbitrary-depth cycles, including self-loops.                 |
| `buildLinkIndex(collections)`     | Collision detection across normalization tiers.                          |

Each of these gets a small, pointed test file. No test coverage targets — coverage numbers lie on this kind of codebase.

---

## Fixtures

`fixtures/natg-vault/` (committed, stable) mirrors the shape of a real sanitized vault and includes both happy-path and degenerate cases. Designed to exercise every meaningful code path at least once.

### Happy-path content (each touched at least once)

- One character with `player` set.
- One NPC with full metadata (species, affiliation, role, portrait).
- One faction, one location chain (5 deep, exercising container resolution), one starship, one timeline (scope `master`), one timeline (scope entity-specific).
- One episode folder (`S00E01/`) with `index.md` (full frontmatter) + referenced files (one image, one handout MD, one handout PDF stub).
- One `S00/_season.md` with `displayName: Pilot`.
- Wikilinks across types (NPC → faction, faction → location, location → starship).
- Aliased wikilink (`[[npcs/captain-riker|the captain]]`).
- Image embed via `![[image.png]]` syntax.

### Degenerate cases (deliberate, to exercise error paths)

- One **broken wikilink** (`[[Nonexistent Person]]`) — exercises the warning path.
- One **ambiguous wikilink** — two entities with the same filename in different collections. Confirms disambiguation requires scoping.
- One **filename-fallback alt** — an `![[image.png]]` with no alias. Exercises R-NF-19 warning.
- One **missing asset** reference (image or PDF referenced but not present).
- One markdown file with unknown extra frontmatter fields — confirms silent-ignore.

### What fixtures do NOT include

- Fixtures that fail the build by default. Build failures belong in dedicated test cases (e.g. via Vitest test vaults), not in the default fixture set — `npm run sync && npm run build` against fixtures should always succeed.
- Real campaign content. Fixtures are handwritten nonsense ("Captain Testicus of the USS Placeholder"). Mike's real vault is the production content; fixtures are test scaffolding.

---

## Per-milestone exit checks

Each milestone from `06-build-plan.md` has a short checklist to run before declaring it done. The build-plan exit criteria are authoritative; these are the concrete smoke tests that confirm them.

### M1 — Skeleton & sync

- [ ] `npm run sync` against fixtures exits 0 and produces expected file tree.
- [ ] Rerun with no source changes: `git status src/content/` shows no diff (idempotent, R-F-06).
- [ ] `CLAUDE.md` files at any depth in the fixture are NOT copied (R-F-05).
- [ ] `_season.md` IS copied.
- [ ] `.env.example` exists and lists `NATG_SOURCE`.
- [ ] `.gitignore` excludes `.env*` except `.env.example`.
- [ ] `.nvmrc` present; `engines` set in `package.json`.

### M2 — Content collections & schemas

- [ ] `npm run build` succeeds against the fixture-populated `src/content/`.
- [ ] Intentionally breaking an episode frontmatter (e.g. `episode: S99E99` in `S00E01/`) fails the build with the file path visible.
- [ ] Breaking an `airDate` (e.g. `April 18`) fails the build.
- [ ] An unknown field (`frobnicate: true`) on an NPC is silently accepted.
- [ ] Schema smoke test: `astro check` passes.

### M3 — Templates (unstyled)

- [ ] Every route in `02-architecture.md`'s route table is reachable from the landing page via clicks.
- [ ] Every fixture entity has a rendered entity page.
- [ ] Breadcrumbs appear on every non-landing page.
- [ ] Current-episode card appears on landing and on `/episodes/`.
- [ ] About page renders disclaimer + license text.
- [ ] 404 page renders for an invalid URL.
- [ ] Wikilinks render as literal `[[target]]` text (M4-lite hasn't shipped yet — this is expected).

### M4-lite — Wikilink bracket strip

- [ ] No `[[…]]` syntax visible on any rendered page.
- [ ] `![[image.png]]` embeds render as `<img>` tags with filename as alt fallback.

### M4-full — Cross-references & hierarchy

- [ ] Fixture NPC page lists backlinks from faction/location pages that reference it.
- [ ] Fixture location page shows the 5-deep container chain as breadcrumbs.
- [ ] Fixture location page (one level up) shows a Contains section listing its direct child.
- [ ] The deliberately-broken wikilink renders with `.wikilink-broken` class and produces exactly one warning line.
- [ ] The deliberately-ambiguous wikilink renders broken + warns with both candidates listed.
- [ ] Introducing a container cycle in a fixture copy causes a hard build failure with a clear message.
- [ ] Build warnings report prints at end of build, grouped by category.
- [ ] Unit tests pass (slugify, normalizeWikilinkTarget, resolveWikilink, detectContainerCycle, buildLinkIndex).

### M5 — Styling pass

- [ ] Lighthouse accessibility score ≥ 95 on a representative entity page.
- [ ] Manual contrast audit: every palette pair meets WCAG AA (4.5:1 body, 3:1 large text).
- [ ] Site works with JavaScript disabled in browser.
- [ ] Grep for hex colors outside `src/styles/theme.css`: zero matches.
- [ ] Keyboard navigation: Tab through landing → section → entity, no traps, focus visible.
- [ ] `prefers-reduced-motion: reduce` disables any animation present.
- [ ] Narrow-viewport test (320px): no horizontal scroll, nav readable.
- [ ] Representative entity page weight ≤ 200 KB (excluding images), per R-NF-04.

### M6 — Hardening & deploy

- [ ] First Vercel deploy succeeds; URL returns 200.
- [ ] `curl -I <url>`: CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy headers present (R-NF-14).
- [ ] DevTools Network tab on production: only same-origin requests (R-NF-15).
- [ ] Footer disclaimer visible on every published page.
- [ ] `npm audit --production` exits 0.
- [ ] A test push to `main` triggers an auto-deploy within Vercel.
- [ ] `LICENSE` (MIT) present; `README.md` explains code vs. content licensing.

---

## What's explicitly NOT being tested (v1)

- **End-to-end browser automation** (Playwright, Cypress). Cost-prohibitive for a static site whose interactivity is "click a link."
- **Visual regression** (Percy, Chromatic). Design iterates freely in M5; pinning screenshots slows that down.
- **Link-checking external URLs.** No meaningful external-link volume in v1.
- **Performance benchmarks beyond Lighthouse.** Lighthouse score is the gate; no separate perf suite.
- **Load testing.** Static site on Vercel — not a meaningful concern.
- **CI automation of any of the above.** Tests run locally on `npm test` before a milestone is closed. GitHub Actions can automate post-launch.

These are all "revisit after v1 ships." None of them block Session 1.

---

## Regression strategy

As the project evolves post-v1, the testing story expands:

- **Unit tests are kept green.** The pure-logic functions (resolver, slugify, cycle detection) are where regressions hide; they must pass before any spec change ships.
- **Fixture stability.** `fixtures/natg-vault/` is extended but not rewritten. New cases get new files; existing cases stay verbatim so their behavior is a regression anchor.
- **A new build warning is a signal.** If a warning category appears where none existed before, investigate before accepting.
- **Schema changes are breaking by default.** Adding a required field to a collection's schema breaks every existing entry that lacks it. When adding required fields, either (a) make them optional, (b) author defaults into all existing entries in the same commit, or (c) accept a wave of build failures until upstream catches up. Document the choice in the relevant spec.

---

## What this doc does NOT cover

- **How to implement the tests.** Test file paths, Vitest config, fixture directory layout — those land in M1–M4 implementation.
- **Content-quality review** (is the prose good, are the entries accurate). That's Mike's editorial job, not an automatable check.
- **Security testing.** Covered by R-NF-08, R-NF-11, R-NF-12, R-NF-14 at the spec level; the checks above verify those requirements are met.

## Open items

- Whether to adopt `astro check` in the default build pipeline or keep it as a pre-commit check only. Lean: default build pipeline, once it proves stable on the fixture.
- Whether the build warnings report format should be machine-readable (JSON alongside human output) for future tooling. Not needed v1; revisit if tooling demand emerges.
