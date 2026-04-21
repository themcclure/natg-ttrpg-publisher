# ADR-0002 — Wikilink resolution algorithm

**Status:** Accepted (2026-04-18)
**Date:** 2026-04-18

## Context

Source content uses Obsidian's `[[wikilink]]` syntax. Links must resolve to the right entity page at build time, with no client-side JS. Unresolved links should fail loudly but not break the build (R-F-22).

The source is authored in Obsidian, so Obsidian's resolution semantics are the reference: filename-first, closest-match, alias-aware.

## Decision

### Syntax supported

- `[[Target]]` — link to an entity whose filename (without extension) is `Target`.
- `[[Target|display text]]` — same, but render "display text" as the anchor text.
- `[[folder/Target]]` — scoped form; required only when `Target` is ambiguous.
- `![[image.png]]` — image embed (handled by the asset pipeline, not this resolver).
- `![[Target]]` — treat as `[[Target]]` for v1 (document transclusion is out of scope).

### Normalization

Applied to both the target and the index keys before matching:

- Lowercase.
- Collapse whitespace; treat `-` and `_` and space as equivalent.
- Strip leading/trailing punctuation.

Obsidian is case-insensitive and tolerant of spacing variance; matching this behavior avoids author friction.

### Resolution order

Given a normalized target `T`:

1. **Exact filename match** across all collections. If unique → resolved.
2. **Scoped match** — if target is of the form `folder/name`, look only within that collection.
3. **Title frontmatter match** — entries whose frontmatter `title` normalizes to `T`.
4. **Alias match** — entries whose frontmatter `aliases` contains a value normalizing to `T`.
5. **Ambiguous (multiple hits at the same tier)** — emit a warning listing candidates; render as broken. Author resolves by scoping the link (`[[locations/Earth]]`).
6. **No match** — emit a warning; render with a `.wikilink-broken` class and no `href`.

Filename wins over frontmatter deliberately: authors move/rename files less often than they tweak frontmatter, and filename matches are stable across alias drift.

### Rendering

- Resolved: `<a href="/{collection-route}/{slug}/" data-wikilink>{display-or-title}</a>`.
- Broken: `<span class="wikilink-broken" title="Unresolved: [[{original}]]">{display-or-target}</span>`.

The display text is the alias (if given), else the target's `title` frontmatter, else the raw target string.

### Build-time warnings

Each unresolved or ambiguous link produces one entry in the build warnings report (R-F-53):

```
[wikilink] UNRESOLVED  npcs/captain-riker.md:12  [[Lieutenant Yar]]
[wikilink] AMBIGUOUS   factions/obsidian-order.md:5  [[Earth]] → locations/earth, timelines/earth
```

### Implementation sketch

- A **remark plugin** runs during Astro's content pipeline.
- Before plugin execution, a **link index** is built once per build by walking all collections and emitting `{normalizedKey, collection, slug, title}` records (plus alias and title keys).
- The plugin visits `text` nodes matching the wikilink regex, replaces them with `link` (resolved) or `html` (broken) nodes, and accumulates backlink edges keyed by target for R-F-24.
- Pilot-episode aliasing ("Pilot" → `S00E01`) is **not** handled here; episode aliases live in season-level `displayName` for nav, not in the wikilink space.

## Consequences

- Fully build-time resolution; zero runtime JS (R-NF-01).
- Moving an entry to a different collection folder does not break wikilinks to it (filename match is cross-collection by default).
- Renaming a file **does** break wikilinks to it — caught by build warnings.
- Author must disambiguate collisions by scoping. Practically rare (a faction and a location sharing an exact name).
- Because resolution requires a full link index, builds are O(entries) on startup; fine at any realistic campaign scale.

## Alternatives rejected

- **Runtime resolution via JS.** Violates R-NF-01; also slower for users.
- **Astro's built-in `getEntryBySlug`.** Works for well-formed internal links but doesn't understand Obsidian syntax or aliasing. Custom plugin needed regardless.
- **Requiring scoped links always.** Pure and unambiguous but would require rewriting every source file — friction against Obsidian authoring.

## Open items

- Exact regex for wikilink parsing (escape handling inside code blocks, etc.) — implementation detail.
- Whether to case-preserve the matched target in the broken-link display for forensic clarity. Leaning yes.
