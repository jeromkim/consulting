---
name: proposal-costing
status: experimental
scope: co-consult
description: >
  Computes labor cost (role x day-rate x duration) and solution/license/infra
  cost for a proposal by executing scripts/co-consult/proposal-cost-calculator.ts
  against a per-engagement cost input file - never by hand or AI arithmetic.
  Use when: a proposal needs a cost estimate section, or any client
  deliverable requires a computed cost breakdown.
owner: data-analyst
version: 0.1.0
last_reviewed: 2026-09-08
prerequisites: none
metadata:
  type: domain
  triggers:
    - proposal cost estimate
    - labor cost calculation
    - cost breakdown
    - proposal costing
---

## Context

This skill exists because of the workspace's Computational Integrity policy: numeric outputs must be computed by executed code, never by the AI performing arithmetic directly (see `docs/context.md` § Computational Integrity Standards). Cost figures in a proposal are exactly this kind of numeric output - this skill never produces a total itself; it always delegates the arithmetic to `scripts/co-consult/proposal-cost-calculator.ts`.

## When to Use

- `solution-approach-design` needs a `proposal_cost_estimate` output for the proposal pipeline.
- Any other consulting deliverable needs a computed labor/solution cost breakdown.

## Execution Steps

1. **Gather cost inputs for this engagement** (per-engagement, not a shared company-wide rate card):
   - **Labor**: for each role involved (e.g. Engagement Leader, Solutions Architect, Communications Lead), the day-rate and estimated duration in days, derived from `delivery_roadmap`.
   - **Solution/license/infra**: any third-party license, infrastructure, or vendor cost line items the proposed architecture requires.
2. **Write the cost input file** for this engagement (e.g. `memory/<prospect>-cost-input-<date>.yaml`):
   ```yaml
   roles:
     - role: "Solutions Architect"
       day_rate: 0
       duration_days: 0
   solution_costs:
     - item: ""
       cost: 0
   ```
   Fill in real values - do not leave placeholders in the file passed to the script.
3. **Execute the calculator**:
   ```
   bun scripts/co-consult/proposal-cost-calculator.ts <cost-input.yaml> [--output <output-path>]
   ```
4. **Never adjust or restate the script's numeric output by hand.** If a figure looks wrong, fix the input file and re-run - do not hand-correct the output.
5. **Label anything not covered by the script** (e.g. a rough order-of-magnitude figure given verbally, not yet in the input file) explicitly as **approximate**, per the workspace-wide Computational Integrity labeling rule.

## Output Format

- **Cost input file** (`memory/<prospect>-cost-input-<date>.yaml`) - the source of truth for the numbers.
- **Cost breakdown table** (Markdown, from the script's output): total labor cost, total solution/license/infra cost, grand total.
- **Script output JSON** retained alongside the Markdown table for traceability.

> **Save Output To**: See Output Destination Mapping in `docs/co-consult.context.md` for destination folder and naming convention. Create the folder if it does not exist. Do not hard-code output paths.

## Related Skills

- solution-design
- proposal-writing
- financial-modeling
