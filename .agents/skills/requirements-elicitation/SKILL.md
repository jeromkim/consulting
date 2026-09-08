---
name: requirements-elicitation
status: experimental
scope: co-consult
description: >
  Parses an RFP, briefing document, or meeting notes from a prospective
  (not yet engaged) client into a structured, categorized requirements list
  with source traceability per item. Use when: responding to an RFP,
  confirming a prospect's requirements before proposal drafting, or
  structuring pre-sales intake material into a requirements artifact.
owner: strategy-analyst
version: 0.1.0
last_reviewed: 2026-09-08
prerequisites: none
metadata:
  type: domain
  triggers:
    - RFP requirements
    - client requirements confirmation
    - requirements elicitation
    - proposal intake
---

## Context

Use at the start of a pre-sales pursuit, before any engagement is signed or client-data access exists. The prospect has already shared requirements through an RFP, a briefing document, or a direct conversation - this skill turns that raw material into a structured artifact the rest of the proposal pipeline (`solution-approach-design`, `proposal-writing`) can consume.

## When to Use

- An RFP or briefing document has been received from a prospective client
- A prospect has verbally or informally shared requirements that need structuring before solution design begins
- Requirements need re-confirmation because the source document was ambiguous or incomplete

## Execution Steps

1. **Ingest the source material**: read the RFP/briefing/meeting notes in full. Never summarize from a partial read.
2. **Extract and categorize each requirement**:
   - **Functional**: what the solution must do.
   - **Non-functional**: performance, security, compliance, availability, and similar quality attributes.
   - **Constraint**: budget ceilings, timeline deadlines, mandated technologies, incumbent-system dependencies.
3. **Trace each requirement to its source**: quote or reference the exact line/section of the source document. Never invent a requirement that doesn't trace back to the source material.
4. **Flag ambiguity**: where the source is unclear or silent on a point the proposal will need, list it explicitly as an open question rather than assuming an answer.
5. **Confirm with the Engagement Leader**: present the categorized list and open-question flags before handing off to `solution-approach-design`.

## Output Format

- **Structured requirements list**, grouped by category (functional / non-functional / constraint), each item carrying a source reference.
- **Open-questions list**: anything ambiguous or unaddressed in the source material.

> **Save Output To**: See Output Destination Mapping in `docs/co-consult.context.md` for destination folder and naming convention. Create the folder if it does not exist. Do not hard-code output paths.

## Related Skills

- solution-design
- proposal-writing
- company-intelligence
