# NATG Publisher — Design

Scope: information architecture, page composition per template, navigation patterns, accessibility conventions, and visual direction. Answers "what does each page show and how does it feel to read?" — not "how is it built" (that's `02-architecture.md` + `03-content-model.md`).

Open: **Q03** (visual direction / palette specifics). This doc commits to the structural and accessibility decisions; palette values are stubbed and resolved in a later pass.

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
- **Contrast**: text ≥ 4.5:1, large text ≥ 3:1. Enforced in the palette pass (Q03).
- **Motion**: any animation respects `prefers-reduced-motion: reduce` (likely minimal animation in v1 regardless).
- **Color scheme**: honors `prefers-color-scheme`; specific light/dark palettes pending Q03. CSS custom properties make this a single-file swap (ADR-0004).
- **Images**: every `<img>` has `alt`; author-written alt preferred, filename fallback warned but not blocking (R-NF-19).
- **Touch targets**: interactive elements ≥ 44×44 px.
- **Language**: `<html lang="en">`.
- **No keyboard traps**: the site has no modals, menus, or interactive widgets in v1. Maintain this constraint — if anything interactive is added, it must be fully keyboard-navigable.

---

## Visual direction

Status: **Stub. Palette and typography specifics pending Q03.** This section lists the principles we commit to; the pass that answers Q03 fills in the concrete values.

### Committed principles

- **LCARS-inspired, not LCARS-replica.** Accent colors, rounded pill/elbow shapes, and color-blocked section headers are fair game. Full-chrome LCARS (angled panels, per-panel nav, stardate readouts) is out of scope — costs screen real estate and accessibility.
- **Content first.** Typography and line length optimized for reading long prose (65–75ch line length for body copy).
- **One accent family.** A single set of accent colors used consistently across sections. Per-faction sub-themes are deferred (see the faction-icon open item in `03-content-model.md`).
- **Self-hosted type.** Two font families at most: one for body, one for display/headers. Served from same-origin per R-NF-15.
- **Palette in one file.** All colors as CSS custom properties in `src/styles/theme.css` (ADR-0004). No hex literals anywhere else.

### Pending decisions (Q03)

- Specific palette values (primary, accent, background, foreground, muted, danger/broken-link).
- Light mode / dark mode / both.
- Font choices.
- Heading font weights and display treatment (pill-shaped title banner? plain?).
- Icon treatment (external link ↗, PDF download, etc.).

These will be locked in a dedicated palette pass, ideally with a rendered skeleton of the site available for live iteration rather than prose-only design.

---

## What this doc does NOT cover

- **Content authoring voice/style** — that's Mike's editorial choice, not a design concern.
- **Implementation technology** — Astro components, CSS files, etc. — covered by `02-architecture.md` and ADR-0004.
- **Build artifacts** — milestones, deploy steps — covered by `06-build-plan.md` (next).
- **Content schemas** — covered by `03-content-model.md`.

## Open items

- **Q03** (palette + typography specifics) — unresolved, deliberately. Revisit after M1+M2 ship a working but unstyled skeleton.
- Whether `/encyclopedia/` is a meaningful page or should redirect straight to the first sub-collection. Keeping it as a real page for now — it gives the site a more discoverable shape.
- Whether the global nav should collapse to a hamburger on narrow viewports, or stay inline. Four nav items fit inline at 320px with compact labels; leaning inline, no hamburger.
- Handling for very long alias lists on entity pages (truncate with "+3 more" or wrap freely). Defer until real content reveals whether this is actually a problem.
