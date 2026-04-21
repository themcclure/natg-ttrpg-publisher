# NATG fixture vault

Handwritten placeholder content used by `npm run sync` during development and by any future automated tests. **Not real campaign material.** See [specs/06-build-plan.md](../../specs/06-build-plan.md) § "M1 — Skeleton & sync" and [specs/05-test-plan.md](../../specs/05-test-plan.md) § "Fixtures" for the full story.

This file is deliberately named `_README.md` so the sync script's underscore-prefix skip rule (R-F-05) drops it — it should never appear in the built site.

## What's here

The vault mirrors the real source-folder shape from R-F-04:

```
characters/   npcs/       factions/   locations/   starships/
timelines/    episodes/   handouts/   images/
```

A minimum-coverage set of entries exercises every schema path at least once:

- A five-deep location chain (`Alpha Quadrant → Rhegion Sector → Vell Prime System → Starbase Kappa → The Wayward Comet`) for container resolution.
- A complete `S00E01` (Pilot) with a `_season.md` giving S00 its "Pilot" display name.
- Cross-links between entities (NPC → faction → location → starship).
- An aliased wikilink, an image embed, a PDF handout.

## Deliberate degenerate cases

These exist to exercise error and warning paths. The default `npm run sync && npm run build` should still succeed — these emit warnings, not failures.

| Where                                   | What                                                                   |
|-----------------------------------------|------------------------------------------------------------------------|
| `npcs/admiral-placeholder.md`           | Body contains `[[Captain Missing]]` — unresolved wikilink.             |
| `npcs/vex.md` + `locations/vex.md`     | Same slug in two collections — ambiguous when referenced unscoped.     |
| `locations/starbase-kappa.md`           | Body contains `[[Vex]]` (unscoped) — triggers the ambiguity warning.   |
| `locations/the-wayward-comet.md`        | Body embeds `![[nonexistent-map.png]]` — missing asset.                |
| `episodes/S00E01/index.md`              | Body embeds `![[station-map.svg]]` with no alias — filename-fallback alt. |
| `npcs/vex.md`                           | Frontmatter has `frobnicate: true` — unknown field, silently ignored.   |
| `CLAUDE.md`                             | Should be skipped by sync (R-F-05).                                    |
