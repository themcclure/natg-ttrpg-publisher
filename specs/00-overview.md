# NATG Publisher — Overview

## Pitch

A static site generator that publishes a player-facing encyclopedia for Mike's Star Trek TTRPG campaign ("NATG"). Source content is authored and sanitized in a separate Obsidian vault; the publisher ingests the sanitized slice, renders it as a cross-linked Astro site, and deploys it to the web.

## Context

- The upstream source folder is a read-only, spoiler-sanitized mirror of a larger GM vault. Another agent ("publish skill") strips GM-only content before files land in the source folder. **This project never sees GM content and never makes reveal decisions.**
- Source content uses Obsidian conventions: `[[wikilinks]]`, embedded images, YAML frontmatter, a top-level folder per entity type (`characters/`, `factions/`, `locations/`, `npcs/`, `starships/`, `timelines/`).
- Episodes are keyed by `S##E##`. Episode recaps live in `episodes/S##E##/index.md`; in-world handouts for that episode live in `handouts/S##E##/`. Seasons are a navigation grouping; `S00` displays as "Pilot".

## Goals

1. Publish the encyclopedia as a public, static, fast-loading website.
2. Preserve cross-references: wikilinks resolve to the corresponding entity pages; backlinks are surfaced.
3. Organize the site into three top-level sections: **Characters**, **Encyclopedia** (NPCs, Factions, Locations, Starships, Timelines), **Episode Log**.
4. Handle handout PDFs as first-class linked artifacts within their episode context.
5. Produce build-time warnings for broken wikilinks, missing images, and other content-integrity issues.
6. Deployable from a committed repo (no reliance on the external source folder at build time).

## Non-goals (v1)

- Authentication, gating, or per-player views. The site is fully public.
- In-app reveal/spoiler logic. (Upstream has already sanitized.)
- Editing content from the web. The site is read-only; source of truth is the Obsidian vault.
- Search-as-you-type, tag clouds, graph views. (Deferred; revisit after v1 ships.)
- CMS integration.
- Real-time sync. Triggering is manual.

## Stakeholders

- **Mike** — owner, GM, sole author of source content.
- **The players** — primary audience; consume the published site between and during sessions.

## Success criteria

- A fresh clone + `npm install` + `npm run sync` + `npm run build` produces a deployable site with zero manual fixup, given a valid source folder.
- Every wikilink in source content either renders as a working link or emits a visible build warning.
- Players can answer "what do we know about X?" in ≤ 2 clicks from the landing page for any X they've encountered.
- The site works without JavaScript for all read paths.

## Deployment target

Likely Vercel. Decision deferred to an ADR; see `adr/0001-hosting.md` (TBD).

## Open questions tracked

See `01-requirements.md` § Open Questions.
