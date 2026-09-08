---
name: proposal-writing
status: experimental
scope: co-consult
description: >
  Guides Communications Lead through drafting a pre-sales proposal for a
  prospective (not yet engaged) client that matches the firm's own existing
  proposal deck (.pptx) exactly, using client_requirements, proposed_architecture,
  delivery_roadmap, and proposal_cost_estimate as inputs. Adds pre-sales-specific
  requirements a generic report doesn't have: prospect (not client) terminology,
  no assumption of client-data access, and a mandatory win-themes/differentiation
  section. Use when: drafting a proposal deck, responding to an RFP with a
  formal proposal, or matching a firm's own proposal template exactly.
owner: communications-lead
version: 0.1.0
last_reviewed: 2026-09-08
prerequisites: sample-driven-report-writing, consulting-report-writing
relates_to:
  - skill: sample-driven-report-writing
    type: composes_with
  - skill: consulting-report-writing
    type: composes_with
  - skill: company-intelligence
    type: composes_with
  - skill: competitive-intelligence
    type: composes_with
metadata:
  type: domain
  triggers:
    - proposal
    - pre-sales proposal
    - win theme
    - business development proposal
    - proposal deck
---

## Context

This skill generalizes `sample-driven-report-writing`'s "write-to-sample" discipline (extract a Writing Spec from a reference deliverable, then draft to match it exactly) to the firm's actual pre-sales format: **a PowerPoint deck (`.pptx`)**, not a Word/HWP document. A slide deck differs from a document enough that this skill implements its own slide-oriented Writing Spec extraction rather than reusing `sample-driven-report-writing`'s chapter/page-budget model directly - but the underlying discipline (never trust a remembered structure, always re-extract from the real attached sample, no placeholder leftovers) is identical, and `sample-driven-report-writing` remains the prerequisite for that discipline plus non-deck fallback formats.

**PM Gateway applies**: PM displays an execution plan table before dispatching any specialist at each phase transition. Deliverable files are produced by the dispatched specialist (communications-lead), not by PM directly.

## When to Use

- A prospective client has requested a formal proposal (RFP response, pitch, or unsolicited pursuit) and the firm's proposal deck template must be matched exactly.
- The proposal needs to fold in upstream pipeline outputs (`client_requirements`, `proposed_architecture`, `delivery_roadmap`, `proposal_cost_estimate`) into a client-facing narrative.
- Do NOT use for free-form internal decks with no required structure - use `executive-presentation` instead.

## Execution Steps

### Step 1 - Sample Selection

The firm may have more than one proposal template by engagement type (strategy pitch, implementation/build proposal, public-sector RFP response, etc.). Confirm with the Engagement Leader which sample applies to this engagement **before** extracting structure - do not assume the most recently used one. If the library has only one template, this step just confirms it.

### Step 2 - Slide Structure Extraction (the differentiator)

Ingest the selected `.pptx` sample and produce a **Writing Spec** artifact (`memory/<prospect>-writing-spec-<date>.md`). Always re-extract from the actual attached sample - never trust a remembered structure, because the firm's deck template gets revised over time.

For each slide in the sample, record:

1. **Slide number and title** (the title placeholder text).
2. **Section grouping**: which proposal section this slide belongs to (e.g. Overview, Client Requirements, Proposed Architecture, How We Solve It, Schedule, Roadmap, Cost) - the section list comes from the sample itself, not a hardcoded assumption; if the sample's sections differ from this list, use the sample's actual sections.
3. **Table/chart mandatory-flag**: does this slide contain a table or chart placeholder? Mark `requires-table` / `requires-chart` accordingly, with the expected chart type (bar, timeline/Gantt, pie) where apparent.
4. **Placeholder/guideline slots**: any instructional or example text the template uses to guide the author - list every one so none survive into the draft.
5. **Slide-count budget** per section, from the sample's actual slide count.

A section marked `requires-table` or `requires-chart` is incomplete without that element - this is not decorative.

Confirm the Writing Spec with the Engagement Leader before drafting.

### Step 3 - Draft (against the four upstream inputs and the Writing Spec)

- Map each upstream artifact to its section per the Writing Spec:
  - `client_requirements` → Client Requirements slides.
  - `proposed_architecture` → Proposed Architecture slides.
  - `client_requirements` + `proposed_architecture` together → How We Solve It slides (explicit requirement-to-solution traceability, not just an architecture restatement).
  - `delivery_roadmap` → Schedule and Roadmap slides.
  - `proposal_cost_estimate` → Cost slides (the cost table/figures must come verbatim from the script output - see `proposal-costing` - never restated or rounded by hand).
- Add a **win-themes/differentiation** section if the sample's section list doesn't already include one - a generic report doesn't need this, but a competitive proposal does: 2-4 reasons the firm specifically (not a generic vendor) should win this engagement, each tied to evidence from `client_requirements` or `proposed_architecture`.
- Replace every guideline/placeholder slot identified in Step 2 with real content - no template instructional text may survive into the draft.
- Use prospect-appropriate terminology throughout: "prospect", not "client" - this is pre-sales, not an active engagement.

### Step 4 - Validate & Render

1. **Structural validation**: slide count and section order match the Writing Spec; every `requires-table` / `requires-chart` slide contains its element; no placeholder/guideline text survives.
2. **Render to `.pptx`**:
   ```
   bun scripts/md-to-ooxml.ts --input <draft.md> --output <output.pptx> --type pptx
   ```
   This workspace-root script maps each Markdown H1 to a slide (title placeholder) and the content below it to the body placeholder (bullets, bold lead-ins, plain-text tables) - it is the workspace's supported pptx path (see `templates/co-deck/docs/co-deck.context.md`). Its table/chart rendering is intentionally simple (plain-text lines, no native chart objects); if the firm's actual template requires richer visual design (embedded chart objects, custom layouts) than this produces, hand off the rendered `.pptx` to the Engagement Leader for manual polishing in PowerPoint rather than treating the script's output as final.
   For a non-deck engagement type whose sample is `.hwp`/`.hwpx`/`.pdf`/`.docx` instead, fall back to `sample-driven-report-writing`'s own render tools (`hwpx-generate.ts` / `md-to-report.ts`).
3. Max 2 revision cycles before PM escalation.

> **Sign-off after this step is a manual procedure outside the harness.** This skill's output is the rendered `.pptx` (or fallback format) file - nothing more. Before it is sent to the prospect, the firm's actual decision-maker (partner/principal) must review and approve it offline; this skill and its owning procedure (`proposal-drafting`) do not model that approval as an enforceable gate.

## Writing Principles

1. **No placeholder leftovers** - every guideline/example element in the sample must become real content.
2. **Table-to-narrative ratio still applies on slides**: a bare cost table or architecture diagram earns at least one supporting bullet of interpretation, not just the raw figure.
3. **Cost figures are never hand-restated** - always the verbatim output of `proposal-cost-calculator.ts` (see `proposal-costing`).
4. **Prospect-data handling**: drafts may contain requirements, cost, and prospect-identifying information - review for sensitivity before any `git add`/commit.
5. **File naming**: `{prospect}-proposal-{YYYY-MM-DD}_ko.md` (draft) → `{prospect}-proposal-{YYYY-MM-DD}_ko.pptx` (rendered), in `deliverables/proposals/`.

## Output Format

- **Writing Spec** (`memory/<prospect>-writing-spec-<date>.md`) - section list + per-slide table/chart flags + slide-count budget + placeholder-slot list.
- Full deliverable draft (Markdown, one H1 per slide, matching the Writing Spec's section order exactly).
- Final rendered `.pptx` (or fallback format per the selected sample), validated.
- `memory/YYYY-MM-DD.md` engagement summary entry.

> **Save Output To**: See Output Destination Mapping in `docs/co-consult.context.md` for destination folder and naming convention. Create the folder if it does not exist. Do not hard-code output paths.

## Related Skills

- sample-driven-report-writing - prerequisite; general write-to-sample discipline and non-deck format fallback
- consulting-report-writing - prerequisite; MECE and recommendation-framing quality floor
- requirements-elicitation - upstream input (client_requirements)
- solution-design - upstream input (proposed_architecture, delivery_roadmap)
- proposal-costing - upstream input (proposal_cost_estimate)
- executive-presentation - related but distinct; use for free-form internal decks with no required structure
