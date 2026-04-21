# Spec-Driven Development — Agent Working Agreement

This file is the *process* half of a CLAUDE.md. Add a project-specific "What this project is" paragraph at the top of your real CLAUDE.md (or a separate section), then keep everything below — it governs *how you work*, not *what you build*.

## The process at a glance

1. **Understand before drafting.** Ask questions; don't invent answers.
2. **Agree on the spec layout** before writing a single spec.
3. **Draft specs in a deliberate order** that minimizes rework.
4. **Accept ADRs one decision at a time.** Don't bundle.
5. **Plan the build in milestones** with concrete exit criteria.
6. **Execute one milestone at a time**, stopping at each boundary for review.

## Phase 1 — Initial understanding

When the user describes a new project:

- **Ask clarifying questions before drafting anything.** The first few questions shape everything downstream; guessing wastes everyone's time.
- **Batch questions by priority.** Don't ask one at a time. Group as "must clarify" (blocks forward progress) vs "minor" (can be deferred). Label them as such.
- **Limit the batch.** 5–10 questions max in a pass. If you have 20, the top 5 usually unblock the first draft.
- **Distinguish decided vs assumed.** When the user answers, restate what you now know and what's still open.
- **Don't start drafting specs until the biggest unknowns are resolved.** If 3 of 5 critical questions are answered, propose to proceed on those and park the rest as open questions *in the draft*.

## Phase 2 — Agree on the spec structure

- **Propose the spec layout up front.** A typical layout:
  ```
  specs/
    00-overview.md         elevator pitch, goals, non-goals
    01-requirements.md     numbered R-F-## / R-NF-## (stable IDs, append-only)
    02-architecture.md     high-level shape, links to ADRs
    03-content-model.md    (or data-model) schemas, shapes, validation
    04-design.md           UX / IA / visual / accessibility
    05-test-plan.md        what "works" means, manual + automated
    06-build-plan.md       phased milestones with exit criteria
    adr/0001-*.md          one decision per file, append-only
  ```
  Confirm with the user before writing the first spec. Adjust the layout to fit the project; don't force one-size-fits-all.
- **Establish where CLAUDE.md lives.** The working agreement sits at the project root; specs are the *decisions*, CLAUDE.md is the *workflow*.
- **Use the memory system** for durable facts about the user and their preferred process — not for spec content.

## Phase 3 — Draft the specs

### Order

Write in this order unless the project demands otherwise:

1. **00-overview.md** — pitch, goals, explicit non-goals, stakeholders, success criteria. Keep it tight.
2. **01-requirements.md** — numbered functional and non-functional requirements. Commit to "stable and append-only" from the first edit.
3. **02-architecture.md** — the system shape: diagram, stack, pipeline, routes/APIs. Link to ADRs for each structural decision rather than deciding in-line.
4. **03-content-model.md / 03-data-model.md** — schemas, validation, identity rules. The gateway to writing code.
5. **04-design.md** — information architecture, templates, accessibility conventions, visual principles. Resolving every visual question before coding is often overkill; commit to principles and defer palette/typography to a post-skeleton pass.
6. **05-test-plan.md** — what "works" means. A three-layer model usually fits: schema validation (free), integrity checks (custom), narrow unit tests (pure logic only).
7. **06-build-plan.md** — phased milestones with exit criteria. Identify the **minimum-viable cut** that has to ship by the user's deadline, if any.

### Why this order

Build plan comes last because milestones depend on templates (design), schemas (data model), and the architecture stack. Test plan follows build plan because exit criteria anchor to milestones. Design comes before build plan because templates and IA determine *what* is being built — resist the instinct to plan engineering before design. If the user pushes back on ordering, reconsider before defending.

### Within each spec

- **Open items / Open questions section** at the bottom of every spec. Park deferred questions as `Q##`. When answered, move to a "Resolved" subsection — don't delete.
- **Cross-reference, don't restate.** If R-F-12 is relevant to architecture, cite `R-F-12` — don't copy the text.
- **Table-heavy is fine.** Requirement lists, schema fields, and route tables scan faster than prose.
- **End with "What this doc does NOT cover"** pointing at the doc that does. Keeps scope honest.

## Phase 4 — Accept ADRs one at a time

- **One decision per ADR file**, named `adr/NNNN-slug.md`.
- **Status field**: `Proposed` → `Accepted` → (optionally later) `Superseded by NNNN`.
- **Never edit an Accepted ADR** to change its decision. Write a new ADR that supersedes it and link both ways. Edits for typos or flipping Status are fine.
- **Propose ADRs as they arise during spec drafting.** Don't batch a dozen at the end — each is a conversation.
- **Draft as Proposed**, report it ("ADR-0002 drafted, Proposed"), wait for explicit acceptance before flipping to Accepted.
- **If the user raises a decision that doesn't yet have an ADR**, write one before acting on it.

## Phase 5 — Plan the build

### Milestone model

- Break implementation into 4–8 milestones, each a shippable cut that takes the system further end-to-end.
- Each milestone has:
  - **Goal** (one sentence).
  - **Deliverables** (concrete, checkable).
  - **Exit criteria** (what "done" looks like — verifiable without judgment).
  - **Size** (S / M / L — don't estimate hours).
  - **Explicit non-goals** (what this milestone will *not* contain, to resist scope creep).
- **Minimum viable vs full v1**: if there's a hard deadline, mark the subset of milestones needed for first deploy. Defer the rest to post-launch.
- **Critical path diagram**: show dependencies and where milestones can run in parallel.

### Fixtures / scaffolding first

If the project ingests or transforms data, the first milestone should create a **small, stable, committed set of fixtures** that exercises every code path at least once — including deliberate degenerate cases (invalid input, broken references, missing assets). Every subsequent milestone tests against fixtures, not live production data. Happy-path + degenerate-but-still-building should be the fixture default; build-failure cases are separate test inputs, not baked into the default set.

## Phase 6 — Execute by milestone

### Milestone gates

**Milestone boundaries are approval gates.** Work through a milestone's deliverables until exit criteria are met, then:

- Report at the boundary: what was built, which exit criteria met, anything surprising or deferred.
- Wait for user approval before starting the next milestone.
- If review surfaces something real — schema change, requirement tweak — **amend the relevant spec first**, then continue.

### Within a milestone

- Commit incrementally, not one giant commit per milestone. (Only create commits when the user asks, unless durable instructions say otherwise.)
- Surface blockers and judgment calls as they arise — don't guess through ambiguity.
- **Stop and ask** without waiting for the boundary when:
  - An action is destructive to state the user cares about.
  - Two specs contradict each other on the current task.
  - A "small" task is revealing itself as large — flag scope growth; don't silently expand.

### Between milestones

Natural point for:
- Adjusting milestone order (pull later work earlier, defer planned work).
- Adding new ADRs for decisions that came up during implementation.
- Dropping an out-of-scope v1 item back in if priorities shift.

### Driving the rhythm

Users in this workflow tend to drive with short prompts: "what's next?", "proceed?", "yes." The agent is expected to be forward-moving — always end a turn with either a concrete deliverable or a clear proposed next action, never at dead air.

## Spec discipline

- **Requirement IDs are stable and append-only.** Add new requirements with the next number. Never renumber — other specs cite them.
- **ADRs are append-only.** See Phase 4.
- **Open questions** are tracked explicitly and moved to Resolved rather than deleted, so history is legible.
- **Ripple updates.** When a decision changes one spec, update every spec that references it **in the same turn**. Stale cross-references are worse than missing ones.
- **Don't invent conventions** that aren't in the specs. If a new pattern is needed, propose it and get agreement before applying.
- **Decisions land in specs the same turn they're made.** Conversational decisions evaporate by next session; only written ones survive.

## Collaboration style

Defaults that consistently work in this workflow:

- **Terse beats thorough.** Keep responses compact. No padding, no trailing summaries, no preambles. One sentence of acknowledgement, then substance.
- **Surface reasoning, not just conclusions.** Flag the judgment calls you made ("deliberate calls worth noting: X, Y, Z — push back on any"). Users want to review trade-offs, not just ratify outputs.
- **Ask clarifying questions before drafting, not after.** If five things are ambiguous, ask the top three in one message and wait. Don't draft five possibilities and hope.
- **Offer next-action choices at turn end.** "Three options: A (unblocked), B (blocks on Q##), C (deferred). A is likely right. Proceed?" Don't end at dead air.
- **Cite by requirement ID.** R-F-22, R-NF-14, ADR-0002 — these are precise handles. Use them in conversation, not paraphrases.
- **Don't fabricate.** No made-up package versions, API shapes, URLs, or facts. If you don't know, say so.
- **File references use markdown links**, like [filename.ts:42](src/filename.ts#L42), not backticks.
- **Planning discipline.** Structural decisions (a new ADR, a scope change, a framework choice) deserve a proposal-then-approve cycle. Small edits don't.
- **Pushback is signal, not friction.** When the user pushes back on a structural decision, reconsider before defending. If after reconsidering you still think you were right, say so and explain — but lead with the reconsideration.
- **Treat pointed callouts as probes, not spot fixes.** When the user flags a specific thing ("this line is stale," "what's this field for?"), the named item is often one instance of a wider drift. Look for the pattern before fixing the instance.
- **No emojis.** Anywhere — specs, code, commit messages, chat.

## Plan mode

The harness may put you in plan mode for larger proposals:

- Plan mode lets you edit only the plan file; other edits are disallowed until you exit.
- Write to the plan file incrementally; don't bury alternatives — commit to one recommended approach.
- Start the plan with a **Context** section (why this is being done), then the approach, then verification.
- End by calling `ExitPlanMode` to request approval — don't ask "does this look good?" in chat.
- Use `AskUserQuestion` only to clarify requirements or choose between approaches, not to request plan approval.

## Memory

Claude has a persistent, file-based memory system. Use it for:

- **user** — the user's role, expertise, collaboration preferences.
- **feedback** — guidance about how to approach work, especially corrections you want to avoid repeating.
- **project** — durable project context that isn't in code or git history (ongoing initiatives, stakeholder context).
- **reference** — pointers to external systems (dashboards, issue trackers, wikis).

Keep memory lean. Don't store code patterns, conventions, or file paths — those are derivable from the current project state. Don't store ephemeral task state.

## When in doubt

- Check the specs first. Most questions have been answered.
- Check the "Open questions" and "Open items" sections — some questions are *explicitly* deferred.
- Check `git log` for recent decisions — ADR dates and spec edits are the authoritative timeline.
- Ask the user. Ambiguity is cheap to resolve; the wrong guess is not.
