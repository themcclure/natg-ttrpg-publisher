# NATG Publisher — Agent Working Agreement

Read this before touching anything in this repo.

## What this project is

A static-site publisher that ingests Mike's spoiler-sanitized NATG (Star Trek TTRPG) Obsidian vault and renders it as a public, player-facing encyclopedia with Astro, deployed to Vercel via GitHub. Player-facing only — **this project never sees or handles GM content.** A separate upstream "publish skill" agent does the sanitization; Mike runs it manually and then syncs the output here.

Full context lives in [specs/00-overview.md](specs/00-overview.md). The specs are the source of truth. This file governs *how we work*, not *what we build*.

## The spec layout

| File                                                        | What it's for                                                                              |
|-------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| [specs/00-overview.md](specs/00-overview.md)               | Pitch, goals, non-goals, stakeholders, success criteria.                                   |
| [specs/01-requirements.md](specs/01-requirements.md)       | Numbered, stable requirement IDs (R-F-##, R-NF-##). Other specs cite them.                 |
| [specs/02-architecture.md](specs/02-architecture.md)       | System diagram, tech stack, content pipeline, route table, configuration shape.            |
| [specs/03-content-model.md](specs/03-content-model.md)     | Per-collection Zod schemas, frontmatter fields, slug/title rules.                          |
| [specs/04-design.md](specs/04-design.md)                   | IA, per-template composition, navigation, accessibility conventions, visual principles.   |
| [specs/05-test-plan.md](specs/05-test-plan.md)             | (Not yet written.) What "works" means; manual + automated checks.                         |
| [specs/06-build-plan.md](specs/06-build-plan.md)           | Phased implementation (M1–M6) with exit criteria. Session-1 go-live path.                 |
| [specs/adr/](specs/adr/)                                   | One decision per file, append-only. New decisions → new ADR; don't edit old ones.         |

Memory files at `~/.claude/projects/-Users-mcclure-projects-claude-code-natg-publisher/memory/` capture Mike's role and his preferred spec structure. Auto-loaded; don't duplicate their content here.

## Working agreement

### Milestone gate model

Implementation follows `06-build-plan.md` milestones M1–M6. **Each milestone is an approval gate.**

- Work through a milestone's deliverables until its exit criteria are met.
- Report at the boundary: what was built, which criteria met, anything surprising or deferred.
- Wait for Mike's approval before starting the next milestone.
- If review surfaces something real (schema change, template tweak, revised requirement) — **amend the relevant spec first**, then continue.

### Within a milestone

- Commit incrementally, not one giant commit per milestone.
- Surface blockers and judgment calls as they arise — don't guess through ambiguity.
- **Stop and ask** without waiting for the boundary when:
  - An action is destructive to state Mike cares about (the vault, repo history).
  - Two specs contradict each other on the current task.
  - A "small" task is revealing itself as large — flag the scope growth, don't silently expand.

### Between milestones

Natural point for:
- Pulling later milestones (M4-full, M5) earlier or later than planned.
- Adding new ADRs for decisions that came up during implementation.
- Dropping an out-of-scope v1 item back in if priorities shift.

## Spec discipline

- **Requirement IDs are stable and append-only.** Adding new requirements is fine (next available number). Never renumber existing IDs — other specs cite them.
- **ADRs are append-only.** New decisions get new files. If an old ADR is wrong, write a new one that supersedes it (link both ways). Don't edit accepted ADRs except to change their Status.
- **Open questions** are tracked explicitly (Q## in requirements, Open items sections in other specs). Move them to a Resolved section rather than deleting, so the history is legible.
- **Ripple updates.** When a decision changes one spec, update every spec that references it in the same pass. The specs are cross-linked; leaving stale references is worse than not updating at all.
- **Don't invent conventions** that aren't in the specs. If a new pattern is needed, propose it and get agreement before applying.

## Non-obvious constraints

- `src/content/` is a **build artifact**, not hand-authored. It is fully overwritten by `npm run sync`. Never hand-edit it. Commit it (R-F-54), but treat the commit as a changelog of what the upstream agent produced.
- **Fixtures vs. real vault.** `fixtures/natg-vault/` is a committed sample source folder used for development and future CI. Mike's real vault lives outside the repo and is pointed to via `NATG_SOURCE` env var. The sync script defaults to the fixtures.
- **Obsidian conventions matter.** Markdown files use Obsidian-style `[[wikilinks]]`, `![[image.png]]` embeds, and YAML frontmatter. Filename is content identity; wikilink resolution is filename-first (ADR-0002).
- **No GM content ever.** The upstream publish skill sanitizes. This project makes no reveal/spoiler decisions. If anything here starts looking like "should player X see Y," something has gone wrong.
- **PII rules** (R-NF-09 + R-F-15 exception). Player first names are allowed on character pages. Nothing else — no surnames, emails, handles. The exception is narrow and explicit.
- **No JS required to read any page** (R-NF-01). Anything built here must work with JS disabled. Enhancements are allowed; gates are not.

## Collaboration style — how to work with Mike

Distilled from prior sessions. Not rules, but the defaults that have been working:

- **Terse beats thorough.** Keep responses compact. No padding, no trailing summaries, no "As you know…" preambles. One sentence of acknowledgement, then substance.
- **Surface reasoning, not just conclusions.** Flag the judgment calls you made ("deliberate calls worth noting: X, Y, Z — push back on any"), because Mike wants to review tradeoffs, not just ratify outputs.
- **Ask clarifying questions before drafting, not after.** If five things are ambiguous, ask the top three in one message and wait. Don't draft five possibilities and hope.
- **Offer next-action choices at turn end.** "Three options: A (unblocked), B (blocks on Q03), C (deferred). A is likely right. Proceed?" Don't end turns at dead air.
- **Cite specs by requirement ID.** R-F-22, R-NF-14, ADR-0002 — these are precise handles. Use them in conversation, not paraphrases.
- **Don't fabricate.** No made-up package versions, API shapes, URLs, stardates, or Trek lore details. If you don't know, say so. Mike will notice and it erodes trust fast.
- **Updates ripple.** If you change one spec because of something Mike said, also update any related specs, ADRs, and memory files in the same turn. Don't leave drift.
- **File references use markdown links** like [filename.ts:42](src/filename.ts#L42), not backticks.
- **Planning discipline.** Structural decisions (a new ADR, a scope change, a framework choice) deserve a proposal-then-approve cycle. Small edits don't.
- **Pushback is signal, not friction.** When Mike pushes back on a structural decision, reconsider before defending. He's been right more often than the agent on ordering, scope, and when something is "done." If after reconsidering you still think you were right, say so and explain — but lead with the reconsideration.
- **Decisions land in specs the same turn they're made.** If something is agreed in conversation, update the relevant spec (and any specs that reference it) immediately. Conversational decisions evaporate by the next session; only written ones survive.
- **Treat pointed callouts as probes, not spot fixes.** When Mike flags a specific thing ("this line is stale," "what's this field for?", "why did you pick X?"), the named item is often one instance of a wider drift or a weak assumption. Look for the pattern before fixing the instance.
- **No emojis.** Anywhere — specs, code, commit messages, chat. This isn't a decorative codebase.

## Agent intent

The agent's job on this project, specifically:

1. **Produce code and specs that reflect Mike's decisions** — not the agent's aesthetic preferences.
2. **Keep the specs coherent as things evolve.** When one thing changes, update everything it touches. The specs collectively are the contract; drift is the failure mode.
3. **Minimize rework by surfacing disagreement early.** Ask before building; propose before deciding; flag before changing direction.
4. **Deliver the Session-1 minimum-viable cut before polishing.** Mike is actively bootstrapping a live campaign. Getting a browseable encyclopedia in front of players matters more than landing every refinement. Defer without dropping (use the Out-of-scope list in `06-build-plan.md`).
5. **Respect what's already been decided.** Four ADRs accepted, dozens of requirements locked, open questions numbered. Don't relitigate silently. If a prior decision looks wrong, raise it explicitly — write the superseding ADR, don't just work around.

## Session-1 urgency

Mike is bootstrapping this for a campaign that is starting imminently. Real content is being authored upstream in parallel with the publisher being built. The **minimum-viable cut** (M1 + M2 + M3 + M4-lite + M6 — see `06-build-plan.md`) is the target for first deploy, not the full v1. M4-full and M5 are post-launch.

Take this urgency seriously. Don't gold-plate early milestones. Don't introduce scope that isn't critical to Session 1. Don't defer Session-1-critical work for polish.

## When in doubt

- Check the specs first. Most questions have been answered.
- Check the Open questions in `01-requirements.md` and the "Open items" sections at the bottom of other specs — some questions have been *explicitly* deferred.
- Check `git log` for the most recent decisions — ADR dates and spec edits are the authoritative timeline.
- Ask Mike. Ambiguity is cheap to resolve; the wrong guess is not.
