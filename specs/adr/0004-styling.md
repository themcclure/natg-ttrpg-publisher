# ADR-0004 — Styling approach

**Status:** Accepted (2026-04-18)
**Date:** 2026-04-18

## Context

The publisher needs a styling strategy that fits a small (~10 templates), distinctively-themed (LCARS-inspired palette), content-heavy static site, maintained solo, under the constraints already locked in:

- R-NF-01 — zero JavaScript required to read any page.
- R-NF-02 — WCAG 2.1 AA.
- R-NF-04 — average page weight under 200 KB (excluding images).
- R-NF-15 — no third-party resource loading; self-hosted fonts only.

Tailwind is the obvious "modern default"; plain CSS is the obvious "boring default." The question is which actually has the edge here.

## Decision

**Plain CSS, using Astro's component-scoped styles, with the palette and other theme tokens expressed as CSS custom properties on `:root` in a single theme stylesheet.**

- Palette, spacing scale, typography scale, and state colors live in `src/styles/theme.css` as CSS custom properties. No hardcoded hex values anywhere else in the codebase.
- Per-component styles live in Astro single-file components (`<style>` blocks, which Astro scopes automatically).
- Global resets and base element styles live in `src/styles/base.css`.
- Named component classes (e.g. `.lcars-header`, `.panel--primary`) are preferred over utility classes for theme-specific geometry.
- **Open Props** may be adopted later if a richer set of token defaults becomes useful, but v1 does not depend on it.

## Why plain CSS, not Tailwind (or similar)

1. **Leverage mismatch.** Tailwind's payoff scales with UI variety and contributor count. This site has ~10 templates and one author; most styling is theme-specific rather than layout-grid-heavy.
2. **LCARS-flavored geometry.** Rounded pills, angled corners, and color-blocked headers are cleaner as named classes than as stacks of atomic utilities with arbitrary values (`rounded-[2rem] pl-[3rem]` defeats the leverage).
3. **No runtime cost.** CSS custom properties are native browser features with zero build-time or runtime JavaScript, aligning directly with R-NF-01 and R-NF-15.
4. **Audit surface.** Fewer dependencies = less to audit against R-NF-11 and fewer chances for supply-chain surprise.
5. **Reversible.** If the site ever outgrows plain CSS, migrating to Tailwind is a weekend of mechanical refactoring. Plain CSS locks nothing in.

## Consequences

- The palette is a single-file concern. Swapping or evolving the LCARS-inspired look is an edit to `src/styles/theme.css`.
- Authors reference theme tokens via `var(--color-accent)` etc., not literal values. A lint/grep check can enforce "no hex values outside `theme.css`."
- There is no design-token compiler, no PostCSS plugin chain, no Tailwind config. The build pipeline stays minimal.
- Responsive layout, focus states, and accessibility affordances are all hand-authored — which keeps them explicit and auditable for R-NF-02.
- If a second contributor joins later and is more productive in Tailwind, this ADR should be revisited rather than both approaches coexisting.

## Alternatives rejected

- **Tailwind / UnoCSS.** Marginal fit at this scale; atomic utilities undersell for theme-heavy geometry. Revisit if the project grows past ~20 templates or adds contributors.
- **Classless CSS frameworks (Pico, Water).** Optimized for generic content sites that should "just look nice." An LCARS-inspired theme means fighting the defaults from day one.
- **CSS-in-JS / styled-components.** Requires a JS runtime for styling, violating R-NF-01.

## Open items

- The specific LCARS-inspired palette (exact color values, contrast pairings) is still a design decision tracked by Q03 and `04-design.md`. This ADR establishes *how* we express those values, not *what* they are.
