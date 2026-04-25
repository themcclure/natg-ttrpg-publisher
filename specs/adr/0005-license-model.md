# ADR-0005 — License model

**Status:** Accepted (2026-04-25)
**Date:** 2026-04-25

## Context

Two distinct kinds of artifact live in the same repository:

1. **Publisher code** — the Astro site, sync scripts, configuration, plugins, and templates.
2. **Campaign content** — markdown entries, season metadata, handout text, images, and PDFs under `src/content/` and `fixtures/natg-vault/`.

Their licensing needs differ. R-NF-17 commits to a dual-license model; this ADR pins the specifics.

## Decision

**Publisher code is licensed under the MIT license. Campaign content is unlicensed (all rights reserved to Mike McClure).**

- The `LICENSE` file at the repo root is a verbatim MIT license. Its scope is the *code* — Astro components, scripts, config, plugins, schemas, layouts, helpers, anything that is "the publisher" rather than "the content." A future contributor can fork the publisher to power their own campaign site under MIT terms.
- Campaign content is **not** open-licensed. Anyone reading or copying setting text, character bios, recap prose, in-world handouts, custom palettes, or campaign-specific imagery is doing so without a granted license. Reuse without permission is not authorized.
- The boundary is structural, not file-by-file: anything under `src/content/`, `fixtures/natg-vault/`, and `public/_assets/` is content. Everything else is code.

The distinction is documented in three places: the project [README](../../README.md), the public [/about page](../../src/pages/about.astro), and this ADR.

## Why split this way

- **The publisher has reuse value as code.** Other GMs running other Trek (or non-Trek) campaigns might want to fork it. MIT is the lowest-friction license for that — minimal terms, broad permissions, well-understood by hobbyist forkers.
- **The campaign has author value as content.** The setting, characters, plot beats, and prose are creative work. Open-licensing them would disclaim Mike's authorship and invite duplication of the campaign as if it were a shared property. That's not the intent. Default copyright (rights reserved unless explicit license) is the right behavior here.
- **Star Trek itself is third-party IP.** The campaign content sits on top of Paramount/CBS-owned trademarks and setting elements. The fan-project disclaimer (R-NF-16) acknowledges that. Not open-licensing the campaign content keeps Mike's authorship boundary clear without making any claim against the underlying IP.

## Consequences

- A `LICENSE` file present at the repo root means GitHub displays "MIT" as the license. That's accurate for the repo's *code*. Anyone wanting to reuse the *content* must read the README/About to understand it isn't covered.
- Forks of the publisher must remove all campaign content (everything under `src/content/`, `fixtures/natg-vault/`, `public/_assets/`) before publishing under their own setting. The fixtures specifically are written as obvious-placeholder content to make this easy.
- If anyone ever asks to license campaign material (e.g. for a fan compilation), the answer is Mike's to give in a separate explicit grant.
- If the publisher accepts code contributions, contributors implicitly contribute under MIT (per GitHub's standard inbound=outbound convention). No separate CLA in v1.

## Alternatives rejected

- **MIT everything.** Would open-license the campaign content. Wrong: it's authored creative work, not a reusable component.
- **CC BY-SA on content + MIT on code.** Plausible but introduces a license most readers won't understand without a primer; share-alike obligations on derivative campaigns are heavier than the goal warrants.
- **All-rights-reserved across the whole repo.** Would discourage code forks. Wrong: the publisher is structurally a generic static-site generator and shouldn't be locked up.
- **No `LICENSE` file at all.** GitHub would infer no license, which is more restrictive than MIT and would scare off legitimate code-fork interest.

## Open items

- None.
