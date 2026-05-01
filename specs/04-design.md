# NATG Publisher — Design

Scope: information architecture, page composition per template, navigation patterns, accessibility conventions, and visual direction. Answers "what does each page show and how does it feel to read?" — not "how is it built" (that's `02-architecture.md` + `03-content-model.md`).

Q03 (palette + typography) is **resolved** below in [Visual direction](#visual-direction). Light-mode support is deferred for v1 — site ships dark-only, with the palette structured as CSS custom properties so a light-mode swap is a one-file change later.

---

## Information architecture

### Three top-level sections

| Section          | Purpose                                               | Route         |
|------------------|-------------------------------------------------------|---------------|
| **Characters**   | Player characters — the party                         | `/characters/` |
| **Encyclopedia** | World reference: NPCs, Factions, Locations, Starships, Timelines | `/encyclopedia/` |
| **Episode Log**  | Session recaps grouped by season + in-world handouts  | `/episodes/`  |

Also reachable: **About** (disclaimer + licensing per R-NF-16/17) and **Home** (landing).

### Global navigation

Every page has a header with:

- Site title / logo, linking to `/`.
- Primary nav: **Characters · Encyclopedia · Episode Log · About**.
- No secondary or utility nav in v1 (no search, no auth, no settings).

Every page has a footer with:

- The fan-project disclaimer text (R-NF-16), always visible (not tucked behind an accordion).
- Link to `/about/`.
- Copyright line: "Campaign content © Mike McClure. Publisher code under MIT."

### Breadcrumbs

Every non-landing page shows breadcrumbs above the main title, e.g.:

- `Home › Encyclopedia › NPCs › Captain Riker`
- `Home › Episodes › Pilot › S00E01 The Cardassian Cold Open`
- `Home › Encyclopedia › Locations › Alpha Quadrant › Persephone Sector › Persephone System › Outpost 428 › RiMi's Entertairium`

Breadcrumbs for locations follow the `container` chain (R-F-17 + location content model). For all other entities, breadcrumbs reflect the route path. The final crumb (current page) is not a link.

---

## Templates

Ten templates cover the whole site. Each is described below as "what the reader sees, top to bottom."

### 1. Landing (`/`)

- Site title + one-line tagline ("The player-facing encyclopedia for NATG").
- **Current episode card** (R-F-43/44): episode code + title, airDate, teaser, link to the episode page. Visually the most prominent element after the title.
- Three large section cards: **Characters**, **Encyclopedia**, **Episode Log**, each with a one-line explainer.
- Footer disclaimer.

### 2. Collection index (reused by 6 collections)

Used for `/characters/`, `/encyclopedia/npcs/`, `/encyclopedia/factions/`, `/encyclopedia/locations/`, `/encyclopedia/starships/`, `/encyclopedia/timelines/`.

- Breadcrumbs.
- Section title + one-line description (e.g. "The party." / "People the crew has met.").
- Alphabetical list of entries. Each row:
  - Portrait thumbnail (if set; otherwise a neutral placeholder).
  - Title + aliases (inline, smaller).
  - Summary (if set, one line, truncated if long).
- No filtering, sorting, or pagination in v1. All entries visible.

### 3. Entity page (reused by NPC, Character, Faction, Starship, Timeline)

- Breadcrumbs.
- Title with aliases beneath (if any), italic and smaller.
- Portrait (if set) — positioned inline at the start of the body, float-right on wide viewports, full-width block on narrow ones.
- **Metadata strip** (small, above the body, collection-specific):
  - NPC / Character: species · affiliation · role · (characters only: "Played by Alice")
  - Faction: kind
  - Starship: class · registry · affiliation
  - Timeline: scope
  - Fields omitted if absent; strip omitted entirely if all absent.
- Rendered markdown body.
- **Backlinks section** (R-F-24), heading "Referenced by," grouped by collection. Omitted if none.

### 4. Location page (entity page + hierarchy)

Same as the entity template, with two additions:

- **Container breadcrumb** (above the main breadcrumb, or folded into it — design detail): the full chain of enclosing locations, e.g. *in Outpost 428 › Persephone System › Persephone Sector › Alpha Quadrant*.
- **Contains section** after the body: list of child locations (derived from other locations' `container` fields). Each child links to its page; its own kind is shown inline.

Metadata strip for locations: kind · sovereignty.

### 5. Encyclopedia landing (`/encyclopedia/`)

- Breadcrumbs.
- Short section description.
- Six tiles (one per sub-collection), each showing section name and entry count ("NPCs — 23 entries"). Tiles are large tap targets; whole tile is clickable.

### 6. Episode log index (`/episodes/`)

- Breadcrumbs.
- Section description.
- List of seasons in display order (Pilot first if `S00` exists, then `S01`, `S02`, …). Each entry:
  - Season display name (e.g. "Pilot", "Season 01").
  - Episode count.
  - Link to season page.
- The **current episode** (R-F-44) is called out at the top with the same card used on the landing — duplicated here for readers who navigate directly to `/episodes/`.

### 7. Season page (`/episodes/[season]/`)

- Breadcrumbs.
- Season display name as the title.
- List of episodes in ascending `S##E##` order:
  - Episode code + title (e.g. "**S00E01** — The Cardassian Cold Open").
  - Air date (right-aligned on wide viewports).
  - Teaser beneath.
- No recap bodies here — those live on episode pages.

### 8. Episode page (`/episodes/[season]/[episode]/`)

- Breadcrumbs.
- Episode code + title.
- Air date + any aliases (e.g. "Pilot").
- Portrait / key-art (if set).
- Rendered recap body.
- **Handouts section** at the bottom: list of handouts from `handouts/S##E##/`:
  - Markdown handouts: title + kind, link to their page.
  - PDF handouts: filename + size, download icon, direct file link.

### 9. Handout page (markdown handouts only)

- Breadcrumbs (ending in the episode then the handout).
- Title + kind (if set) as a small caption.
- Rendered markdown body. No backlinks section — handouts are terminal reading.

### 10. About, 404

- **About**: prose page with the disclaimer (R-NF-16), code vs. content licensing explainer (R-NF-17), short credits. Authored as a markdown file in the repo, not in `src/content/`.
- **404**: minimal — "That page doesn't exist in this universe" (or similar), link back to home.

---

## Navigation & interaction patterns

### Links and wikilinks

Three visually distinct link styles, all keyboard- and screen-reader-navigable:

| Link type          | Styling                                                            |
|--------------------|--------------------------------------------------------------------|
| External           | Underlined, accent color, trailing ↗ icon, `rel="noopener noreferrer"` (R-NF-13). |
| Internal (nav/crumb/body) | Underlined on hover/focus only, accent color.                    |
| Resolved wikilink  | Distinct from regular internal links: dotted underline or subtle background tint, signals "this is a cross-reference." |
| Broken wikilink    | `.wikilink-broken` class (ADR-0002): red strikethrough or similar; `title` attribute shows the original target string. |

Focus state is mandatory on every interactive element — visible outline, not `outline: none`.

### Wayfinding

- **Breadcrumbs** on every non-landing page (see IA).
- **Active nav item** (the current top-level section) is visually distinguished in the header.
- **Current episode** is surfaced on the landing AND the episode log index — redundancy is deliberate.

### Responsiveness

Mobile-first. One-column layout up to a breakpoint (~720px), then optional two-column on entity pages (body + metadata sidebar). Portraits float right on wide viewports, stack above the body on narrow ones. No horizontal scrolling at any width ≥320px.

---

## Accessibility conventions

All of these extend R-NF-02 (WCAG 2.1 AA) with specifics.

- **Semantic HTML**: `<header>`, `<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>`. One `<h1>` per page; subheadings nested correctly.
- **Skip link**: "Skip to content" as the first focusable element, revealing on focus.
- **Focus management**: visible focus outline on all interactive elements; never `outline: none` without an equivalent.
- **Contrast**: text ≥ 4.5:1, large text ≥ 3:1. All token pairs in the [Visual direction](#visual-direction) palette table meet AA; most meet AAA.
- **Motion**: any animation respects `prefers-reduced-motion: reduce` (likely minimal animation in v1 regardless).
- **Color scheme**: dark-only for v1. `<meta name="color-scheme" content="dark">` declared so the browser renders form controls and scrollbars consistently. Adding a light variant later is a single-file change to `theme.css` (ADR-0004); no template churn required.
- **Images**: every `<img>` has `alt`; author-written alt preferred, filename fallback warned but not blocking (R-NF-19).
- **Touch targets**: interactive elements ≥ 44×44 px.
- **Language**: `<html lang="en">`.
- **No keyboard traps**: the site has no modals, menus, or interactive widgets in v1. Maintain this constraint — if anything interactive is added, it must be fully keyboard-navigable.

---

## Visual direction

Q03 resolved 2026-04-26. The site ships **dark-only** with a single self-hosted font family and a low-saturation, outline-first interpretation of LCARS geometry. All concrete values below.

### Committed principles

- **LCARS-inspired, not LCARS-replica.** Accent colors, rounded pill/elbow shapes, and color-blocked section headers are fair game. Full-chrome LCARS (angled panels, per-panel nav, stardate readouts) is out of scope — costs screen real estate and accessibility.
- **Saturated colour for lines, not blocks.** Saturated accents are reserved for text, links, dividers, and 2–4px outlines/left-bars. Larger filled regions use **low-saturation tints** derived from the same accent family, so type-on-fill stays high-contrast without juggling per-block text colors.
- **Content first.** Typography and line length optimized for reading long prose (65–75ch line length for body copy).
- **One accent family.** A single set of accent colors used consistently across sections. Per-faction sub-themes are deferred (see the faction-icon open item in `03-content-model.md`).
- **Self-hosted type.** A single variable font family served from same-origin per R-NF-15. A second display face is not required for v1; revisit if/when prose density increases.
- **Palette in one file.** All colors as CSS custom properties in `src/styles/theme.css` (ADR-0004). No hex literals anywhere else.

### Palette

All tokens live on `:root` in `src/styles/theme.css`. Components reference them as `var(--color-…)` etc.

**Core surfaces and text**

| Token         | Hex       | Use                                        |
|---------------|-----------|--------------------------------------------|
| `--bg`        | `#0a0a14` | Page background                            |
| `--surface`   | `#14141f` | Cards, panels, raised areas                |
| `--border`    | `#2a2a3a` | Hairlines, dividers, panel edges           |
| `--fg`        | `#e6e6f0` | Primary body text                          |
| `--muted`     | `#9494a8` | Secondary text, captions, breadcrumb       |

**Accents (saturated — for text, lines, outlines)**

| Token         | Hex       | Use                                                         |
|---------------|-----------|-------------------------------------------------------------|
| `--accent`    | `#ff9966` | LCARS orange — outlines, dividers, decorative pills, headings ornamentation |
| `--link`      | `#66ccff` | LCARS blue — wikilinks and anchor links                     |
| `--link-vis`  | `#b18cff` | Visited links                                               |
| `--broken`    | `#ff6680` | Broken/unresolved wikilinks (`.wikilink-broken`)            |
| `--ok`        | `#7ed3a1` | Resolved/success affordance (rare; reserved for badges)     |

**Surface tints (low-saturation — for filled blocks)**

Pair each tint with its accent as a 2–4px outline or left-bar to bring saturation back without compromising legibility.

| Token            | Hex       | Pairs with     |
|------------------|-----------|----------------|
| `--tint-orange`  | `#2a221d` | `--accent`     |
| `--tint-blue`    | `#1d2530` | `--link`       |
| `--tint-purple`  | `#25202e` | `--link-vis`   |

**Contrast (R-NF-02 / WCAG 2.1 AA)**

| Pair                                  | Ratio   | Meets |
|---------------------------------------|---------|-------|
| `--fg` on `--bg`                      | 15.7:1  | AAA   |
| `--fg` on `--surface`                 | 13.2:1  | AAA   |
| `--muted` on `--bg`                   | 6.7:1   | AA    |
| `--accent` on `--bg`                  | 9.1:1   | AAA   |
| `--link` on `--bg`                    | 10.4:1  | AAA   |
| `--broken` on `--bg`                  | 5.7:1   | AA    |
| `--fg` on `--tint-orange`             | 13.0:1  | AAA   |
| `--fg` on `--tint-blue`               | 12.4:1  | AAA   |

### Typography

- **Family.** [Inter Variable](https://rsms.me/inter/), self-hosted under `public/fonts/` per R-NF-15. One file (`Inter-roman.var.woff2`) covers regular through bold via `font-weight` axis; we omit the italic file unless authoring shows it's needed.
- **Fallback stack.** `'Inter Variable', system-ui, -apple-system, 'Segoe UI', sans-serif` so pages render before the font finishes loading and on environments where it fails.
- **Body.** 16px / 1.55 line-height, weight 400. Line length capped at 70ch on the article container.
- **Headings.** Same family, weights 600 (h2/h3) and 700 (h1). Letter-spacing tightened slightly on h1 (`-0.01em`).
- **Caption / metadata.** 13px, weight 500, `letter-spacing: 0.04em`, often `text-transform: uppercase` for collection labels and section eyebrows (LCARS-flavored without committing to LCARS).
- **Monospace.** `ui-monospace, SFMono-Regular, Menlo, monospace` for code spans and registry IDs. Not self-hosted — system-mono is universal and avoids a second font download.

Font loading: `font-display: swap`, single `@font-face` declaration. No FOIT, no JS-driven font loader.

### Geometry

- **Pills and elbows.** Border-radius up to `999px` for pills (collection tags, season chips). LCARS "elbow" corners (large radius on one corner, sharp on the opposite) reserved for section headers — used sparingly so the look stays light.
- **Header blocks.** Section headers use the **tint-fill + accent left-bar** pattern: e.g. `--tint-blue` background with a 4px `--link` left border. Keeps the geometry colourful without flooding text-on-saturated-fill territory.
- **Pill variants.**
  - *Outline pill.* Transparent fill, 2px accent border, accent text. Default for category/collection labels.
  - *Filled pill.* Low-sat tint background, `--fg` text. Used where a chip needs to read as "active" or selected (e.g. season indicator on the season page).
- **Dividers.** 2px `--accent`-colored horizontal rule between major page regions, sparingly.
- **Corners.** Standard radii: `4px` (inputs/swatches), `6–8px` (panels and cards), `999px` (pills).

### Iconography

- **External link (↗).** Inline `↗` glyph (U+2197) appended to the visible text of external anchors. No icon font, no SVG, no extra HTTP request. CSS rule on `a[href^="http"]:not([href*="natg-..."])` so author markdown stays clean.
- **PDF / download.** A small inline SVG placed alongside PDF handout links. Single file, inlined via Astro component to avoid a per-page sprite.
- **No icon framework.** No Heroicons, Phosphor, Lucide etc. — keeps R-NF-04 page weight tight.

### Per-template visual notes (carried forward)

These extend the structural template list above with the palette/typography decisions now locked.

- **Landing.** Title in h1 `--fg`. Current-episode card uses the `--tint-blue` + `--link` left-bar pattern. Three section cards use outline pills above a one-line explainer.
- **Collection index.** Section title h1; per-row title in `--fg`, aliases in `--muted` italic, summary in `--muted`. No row dividers — vertical rhythm carried by line-height.
- **Entity / Location.** Metadata strip in `--muted`, separated by `·`. Backlinks heading uses the eyebrow caption style (small caps, `--muted`). "Contains" list on locations follows the same pattern.
- **Episode log / Season / Episode.** Season chip in filled-pill style. S##E## codes set in monospace.
- **Handout.** Minimal — title, kind caption, body. No chrome.
- **About / 404.** Plain prose; no LCARS geometry. About page uses the same article container as entity body.

---

## What this doc does NOT cover

- **Content authoring voice/style** — that's Mike's editorial choice, not a design concern.
- **Implementation technology** — Astro components, CSS files, etc. — covered by `02-architecture.md` and ADR-0004.
- **Build artifacts** — milestones, deploy steps — covered by `06-build-plan.md` (next).
- **Content schemas** — covered by `03-content-model.md`.

## Open items

- Whether `/encyclopedia/` is a meaningful page or should redirect straight to the first sub-collection. Keeping it as a real page for now — it gives the site a more discoverable shape.
- Whether the global nav should collapse to a hamburger on narrow viewports, or stay inline. Four nav items fit inline at 320px with compact labels; leaning inline, no hamburger.
- Handling for very long alias lists on entity pages (truncate with "+3 more" or wrap freely). Defer until real content reveals whether this is actually a problem.
- Light-mode palette. Deferred for v1 — site is dark-only. When a light variant is added, it lands as a `prefers-color-scheme: light` block in `theme.css` overriding the same token names; no template changes.

## Resolved items

- **Q03** (palette + typography) — resolved 2026-04-26. See [Visual direction](#visual-direction). Dark-only for v1; single self-hosted font (Inter Variable); saturated-line / low-sat-fill geometry approach.
