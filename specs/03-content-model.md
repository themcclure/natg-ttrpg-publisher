# NATG Publisher — Content Model

Scope: the precise shape of each content collection — what folders map to what, what frontmatter fields exist, how titles and slugs are derived, and where validation kicks in. Implementation targets Astro's content-collection API with Zod schemas.

Cross-referenced requirements: R-F-04, R-F-10 through R-F-17, R-F-40 ff., R-NF-07.

---

## Shared conventions

### Base frontmatter (all markdown entries)

Every markdown entry in any collection may carry these fields. `title` is the only field that is ever author-critical; everything else is optional.

| Field       | Type               | Required | Notes                                                                           |
|-------------|--------------------|----------|---------------------------------------------------------------------------------|
| `title`     | `string`           | No*      | Display name. If absent, derived from filename (see "Title resolution" below). |
| `aliases`   | `string[]`         | No       | Alternate names. Consumed by the wikilink resolver (ADR-0002).                  |
| `summary`   | `string`           | No       | One-sentence description. Used on collection index pages under the title.      |
| `portrait`  | `string`           | No       | Relative path to an image file within `src/content/` (the same path resolution as inline images, R-F-30). Rendered on the entity page; exact placement is a design decision (see `04-design.md`). |

\* Required in practice for clean display, but absence is not a hard error — we fall back to the filename (R-F-12).

### Title resolution

For display:

1. `title` frontmatter, if present and non-empty.
2. Filename-derived: drop `.md` → replace `-` / `_` with spaces → title-case the result.

Example: `captain-riker.md` with no `title` frontmatter → displayed as **Captain Riker**.

### Slug resolution

For URLs and the wikilink index:

1. Filename without extension, lowercased.
2. Spaces and `_` replaced with `-`.
3. Non-alphanumeric characters (other than `-`) stripped.
4. Multiple consecutive `-` collapsed to one.

Example: `Captain Riker (XO).md` → slug `captain-riker-xo`.

**Slug collisions within a collection fail the build**, naming both offending files. Cross-collection collisions are fine (the wikilink resolver disambiguates per ADR-0002).

### Validation behavior

- Schema violations in required fields → **build fails** (R-F-13, R-NF-18) with the file path, field name, and the Zod error message.
- Missing optional fields → no warning, no error.
- Unknown extra fields → ignored silently in v1 (forward-compatible with upstream adding fields we haven't modeled yet).

---

## Encyclopedia collections

All five encyclopedia collections share the base schema plus zero or more optional type-specific fields. The fields below are not exhaustive — they are the ones authored content is likely to carry now. The schema stays permissive: unknown fields pass, missing optional fields are fine.

### `npcs/`

Non-player characters the PCs know about.

| Field          | Type       | Required | Notes                                          |
|----------------|------------|----------|------------------------------------------------|
| *(base fields)*| —          | —        | title, aliases, summary                        |
| `species`      | `string`   | No       | e.g. "Human", "Bajoran".                       |
| `affiliation`  | `string`   | No       | Primary faction (faction filename or display). |
| `role`         | `string`   | No       | e.g. "Captain", "XO", "Diplomat".              |

### `characters/`

Player characters. Extends the `npcs/` schema with one additional optional field:

| Field          | Type       | Required | Notes                                                                                 |
|----------------|------------|----------|---------------------------------------------------------------------------------------|
| *(npc fields)* | —          | —        | title, aliases, summary, portrait, species, affiliation, role                         |
| `player`       | `string`   | No       | First name only of the player running this PC. Acknowledged narrow exception to R-NF-09 — first names alone are not considered identifying for this project. Full names and other PII remain prohibited. |

The content model will be revisited as more PC entries are authored.

### `factions/`

Organizations the PCs are aware of.

| Field          | Type       | Required | Notes                                                        |
|----------------|------------|----------|--------------------------------------------------------------|
| *(base fields)*| —          | —        |                                                              |
| `kind`         | `string`   | No       | e.g. "government", "military", "corporation", "religious".  |

### `locations/`

Places the PCs have visited or know about. Locations are hierarchical: each location may name one `container` (the location it sits within), producing a chain such as *RiMi's Entertairium → Outpost 428 → Persephone System → Persephone Sector → Alpha Quadrant*.

| Field          | Type       | Required | Notes                                                                                               |
|----------------|------------|----------|-----------------------------------------------------------------------------------------------------|
| *(base fields)*| —          | —        |                                                                                                     |
| `kind`         | `string`   | No       | e.g. "planet", "station", "sector", "system", "city", "establishment".                              |
| `sovereignty`  | `string`   | No       | Controlling faction (faction filename or display name).                                             |
| `container`    | `string`   | No       | Filename or alias of the location immediately containing this one. Resolved via the same normalization as wikilinks (ADR-0002). Top-level locations (e.g. "Alpha Quadrant") omit this. |

**Resolution semantics.** `container` references are resolved against the `locations/` collection only (scoped). An unresolved `container` is treated the same way as an unresolved wikilink (R-NF-18): a build warning by default, a failure above the configured threshold. Cycles are detected at build time and cause a hard error.

**Derived views.** At build time, the inverse relation (location → list of direct children) is accumulated, similar to backlinks. This powers breadcrumbs on a location's page and a "Contains" list on its parent's page. Render details are a design concern (see `04-design.md`).

### `starships/`

Vessels the PCs have encountered or have records on.

| Field          | Type       | Required | Notes                                              |
|----------------|------------|----------|----------------------------------------------------|
| *(base fields)*| —          | —        |                                                    |
| `class`        | `string`   | No       | e.g. "Galaxy-class".                               |
| `registry`     | `string`   | No       | e.g. "NCC-1701-D".                                 |
| `affiliation`  | `string`   | No       | Operating faction.                                 |

### `timelines/`

Chronological-list markdown documents (R-F-17). No structured event schema in v1.

| Field          | Type       | Required | Notes                                                                         |
|----------------|------------|----------|-------------------------------------------------------------------------------|
| *(base fields)*| —          | —        |                                                                               |
| `scope`        | `"master" \| string` | No | `"master"` marks the PC-focused master timeline. Any other string denotes per-entity scope (free-form). |

---

## Episodes

Folder: `episodes/S##E##/` (R-F-14). Each folder contains an `index.md` (the recap) plus any number of additional files referenced from the recap body via wikilinks.

### `index.md` frontmatter

| Field       | Type     | Required | Notes                                                                                                                    |
|-------------|----------|----------|--------------------------------------------------------------------------------------------------------------------------|
| `episode`   | `string` | **Yes**  | Exactly `S##E##` — enforced by regex `^S\d{2}E\d{2}$`. **Must match the parent folder name** — mismatch fails the build. |
| `title`     | `string` | **Yes**  | Episode title (e.g. "The Cardassian Cold Open").                                                                         |
| `airDate`   | `string` | **Yes**  | Exactly `YYYY-MM-DD` — enforced by regex `^\d{4}-\d{2}-\d{2}$` and must parse as a real calendar date.                   |
| `teaser`    | `string` | **Yes**  | Short plot summary shown on the season page. One or two sentences.                                                        |
| `aliases`   | `string[]` | No     | e.g. `["Pilot"]` for `S00E01`.                                                                                           |
| `portrait`  | `string` | No       | Optional key-art or title-card image for the episode page. Same resolution rules as the base `portrait` field.          |

Episodes intentionally do **not** inherit the base schema — `summary` is not a valid episode field (`teaser` serves that role). Extraneous fields follow the standard "silently ignored" policy.

Additional files inside `episodes/S##E##/` (anything that isn't `index.md`) are **not** registered as standalone content collection entries. They are addressable by wikilink (for images and referenced files), but they do not get their own URL routes. If a referenced file needs its own page, it belongs in a collection folder (e.g. move a new NPC into `npcs/`).

## Seasons

An optional `episodes/S##/_season.md` file carries season-level metadata (R-F-16).

| Field          | Type     | Required | Notes                                                       |
|----------------|----------|----------|-------------------------------------------------------------|
| `displayName`  | `string` | No       | e.g. `"Pilot"` for `S00`. Defaults to `Season ##` if absent.|

This file is **not** a content entry and has no route; it is read by the nav/index builder only. It is explicitly whitelisted from the `_`-prefix skip rule (R-F-05).

---

## Handouts

Folder: `handouts/S##E##/` (R-F-11). Entries are in-world documents — either markdown or PDF. Episode summaries are **not** handouts (those are in `episodes/`).

### Markdown handouts (`*.md`)

| Field          | Type     | Required | Notes                                                                                 |
|----------------|----------|----------|---------------------------------------------------------------------------------------|
| *(base fields)*| —        | —        |                                                                                       |
| `episode`      | `string` | No       | Auto-derived from parent folder (`S##E##`). Authoring the field is allowed (must match) but not required. |
| `kind`         | `string` | No       | e.g. `"letter"`, `"orders"`, `"briefing"`, `"transcript"`.                            |

### PDF handouts (`*.pdf`)

PDFs carry no frontmatter. They are surfaced on their episode page as a download link with filename and size (R-F-31). No schema applies; the loader only needs to record existence and parent episode.

---

## Summary Zod sketch

Illustrative, not the final implementation. Real schemas will live in `src/content/config.ts`.

```ts
import { z, defineCollection } from 'astro:content';

const base = z.object({
  title: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  summary: z.string().optional(),
  portrait: z.string().optional(),
});

const npcSchema = base.extend({
  species: z.string().optional(),
  affiliation: z.string().optional(),
  role: z.string().optional(),
});

const characterSchema = npcSchema.extend({
  player: z.string().optional(), // first name only; see R-NF-09 note
});

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'airDate must be YYYY-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'airDate must be a real calendar date');

export const collections = {
  npcs:        defineCollection({ schema: npcSchema }),
  characters:  defineCollection({ schema: characterSchema }),
  factions:    defineCollection({ schema: base.extend({ kind: z.string().optional() }) }),
  locations:   defineCollection({
    schema: base.extend({
      kind: z.string().optional(),
      sovereignty: z.string().optional(),
      container: z.string().optional(),
    }),
  }),
  starships:   defineCollection({ schema: base.extend({ class: z.string().optional(), registry: z.string().optional(), affiliation: z.string().optional() }) }),
  timelines:   defineCollection({ schema: base.extend({ scope: z.string().optional() }) }),
  handouts:    defineCollection({ schema: base.extend({ episode: z.string().optional(), kind: z.string().optional() }) }),
  episodes:    defineCollection({
    schema: z.object({
      episode: z.string().regex(/^S\d{2}E\d{2}$/, 'episode must be S##E##'),
      title: z.string(),
      airDate: isoDate,
      teaser: z.string(),
      aliases: z.array(z.string()).optional(),
      portrait: z.string().optional(),
    }),
  }),
};
```

---

## What this doc does NOT cover

- **Rendering templates** (how an NPC page looks). That's in `04-design.md`.
- **The wikilink index** (how cross-references resolve). That's in ADR-0002.
- **Route construction** (how slugs become URLs). That's in `02-architecture.md`.
- **Validation error UX** (how errors surface to the author). That's in `05-test-plan.md`.

## Open items

- Whether `status` (alive / deceased / missing) is worth adding to NPCs. Skipped for v1: status can be spoiler-adjacent (even in sanitized content), and a prose "believed to be deceased" sentence in the body is more nuanced than a frontmatter flag.
- **Faction icon / sub-theme** (post-v1). Each faction may eventually want a visual signifier — an icon shown on the faction page and on entity pages that reference the faction, or a CSS sub-theme (accent color palette) applied when viewing content associated with that faction. Not implemented in v1; the schema will grow a field such as `icon` or `theme` when the design for it lands.
