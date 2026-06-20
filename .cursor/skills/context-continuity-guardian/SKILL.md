---
name: context-continuity-guardian
description: Guards user intent continuity across agent and subagent handoffs. Use when tasks involve delegation, parallel subagents, long multi-step sessions, requirement drift risk, or when the user asks to preserve full context end-to-end.
---

# Context Continuity Guardian

## Goal
Keep the user's intent intact from first message to final delivery, including all agent and subagent handoffs.

## When To Use
- Delegating to one or more subagents
- Long sessions with changing requirements
- Parallel workstreams that must converge
- High risk of losing constraints, assumptions, or acceptance criteria
- User explicitly asks to avoid context loss

## Operating Protocol
1. Build a `Context Packet` before any delegation.
2. Pass the packet verbatim to every subagent prompt.
3. Require each subagent to return a `Continuity Report`.
4. Validate returned work against the packet before synthesis.
5. If drift is detected, correct and re-run the affected step.

## Context Packet Template
Use this exact structure in your own reasoning and in subagent prompts:

```markdown
Context Packet
- User Objective:
- In Scope:
- Out of Scope:
- Hard Constraints:
- Soft Preferences:
- Inputs/Artifacts:
- Definitions/Terminology:
- Open Questions:
- Acceptance Criteria:
- Current Plan Step:
```

Rules:
- Fill all fields. Use `none` when truly empty.
- Do not infer hidden requirements as facts; mark them as assumptions.
- Preserve user wording for critical constraints whenever possible.

## Subagent Prompt Contract
When launching a subagent, include:
1. `Task` (single clear outcome)
2. Full `Context Packet`
3. Output schema:

```markdown
Continuity Report
- What I understood:
- Assumptions made:
- Decisions taken:
- Constraints checked:
- Potential drift risks:
- Deliverables produced:
```

Hard requirement: If any constraint is unclear, subagent must stop and ask for clarification rather than guessing.

## Drift Detection Checklist
Before accepting any subagent output, check:
- Objective alignment: does output solve the exact user objective?
- Scope alignment: no missing required part and no forbidden expansion
- Constraint alignment: hard constraints are satisfied
- Terminology alignment: key terms preserved consistently
- Decision traceability: decisions map to user intent or explicit assumptions

If one check fails:
1. Mark the exact mismatch.
2. Repair prompt with missing context.
3. Re-run only the affected workstream.

## Synthesis Rules
- Merge subagent outputs only through the `Acceptance Criteria`.
- Resolve conflicts by prioritizing:
  1) hard constraints,
  2) explicit user objective,
  3) latest user instruction.
- Keep a short "Intent Integrity Notes" section in final response when work was delegated.

## Default Launch Snippet
Use this when creating the monitoring subagent:

```text
You are a context continuity guardian. Your only goal is to prevent user-intent loss across all handoffs.
Track objective, scope, constraints, terminology, and acceptance criteria.
On each step: detect drift, name it, propose correction, and block progression until corrected.
Never optimize by dropping user requirements.
Return Continuity Report after each checkpoint.
```
