---
name: project-compass
description: Assess how far a project has progressed toward its vision, identify the remaining work and uncertainty, and recommend the next milestone. Use when asking where a project stands, what is missing, whether work still serves the vision, or what to tackle next. Not a generic code review or an instruction to implement the backlog.
---

# Project compass

Help Niklas regain orientation: what the project is trying to achieve, what works today, what separates those two, and the most useful next step. Scale the investigation to the question and project; a small project may need only a short assessment.

## Establish the destination

Resolve the intended project from the conversation or current checkout. Follow its instructions and inspect its vision, README, decisions, roadmap, and relevant user statements. Distinguish the long-term vision from the next release or milestone, including explicit non-goals.

Translate the vision into a small set of observable outcomes for its intended users. Preserve the project's own priorities. Current user direction and accepted decisions take precedence over abandoned plans; backlog items and implementation choices do not define the vision by themselves. Cite the sources and identify consequential conflicts.

If the vision is missing or ambiguous, offer a clearly labeled working interpretation from available evidence. Ask one focused question when the answer materially changes the assessment, while continuing independent inspection. Do not silently turn an inferred destination into an accepted decision. For an idea-only project, distinguish decisions and experiments still needed from implementation work.

## Compare outcomes with evidence

Inspect the paths that deliver each outcome: interfaces, implementation, tests, examples, documentation, and relevant live issues or pull requests when available. Trace representative user journeys end to end, including setup and integration boundaries. A component's existence does not establish that the journey works.

Use proportionate local checks or demos when practical. Record what was actually exercised versus inferred from code or claimed by documentation. Passing tests establish only what they cover; releases, adoption, reliability, and product value need their own evidence when the vision depends on them. If access or setup prevents verification, report the uncertainty rather than declaring the capability absent.

For each outcome, choose a status supported by evidence:

| Status | Meaning |
| --- | --- |
| Demonstrated | The outcome works within the stated, verified scope. |
| Partial | Some of the outcome exists, with a concrete gap to completion. |
| Missing | Inspection supports that required behavior is absent. |
| Unknown | Evidence is insufficient or conflicting. |

Annotate blockers separately from implementation status. Link evidence to paths/lines, check results, or source URLs. State the inspection scope and material blind spots; do not imply exhaustive coverage from a sample. Include the date and revision, noting relevant uncommitted changes, when producing a saved assessment.

## Locate the remaining work

Connect every recommended work item to a vision outcome or an explicit milestone requirement. Separate implementation gaps, integration or usability gaps, validation work, and unresolved product decisions where useful. Flag significant work that does not serve the stated destination, while allowing justified enabling work. Avoid inventing generic enterprise requirements or treating every TODO as necessary.

Reconcile relevant issues with observed behavior: an open issue may already be implemented, a closed issue may be incomplete, and a real gap may have no issue. Mark proposed work and decisions as proposals. An assessment alone does not authorize implementing fixes, creating issues, or changing the roadmap.

Prioritize by contribution to the vision, dependencies, risk, and uncertainty reduced. Identify the bottleneck. Recommend a small next milestone that delivers a coherent user outcome, with observable acceptance criteria. When uncertainty is the bottleneck, recommend a bounded experiment or decision instead. Keep effort estimates coarse and conditional unless there is credible evidence for greater precision.

## Deliver orientation

Lead with a candid plain-language judgment of where the project stands and why. Follow with a compact outcome/evidence/gap table, the few most important remaining items, and the recommended next milestone with its completion criteria. Surface any question that could change that recommendation. Keep the full backlog secondary so the user can act without sorting through everything again.

Avoid arbitrary completion percentages. If requested, define the outcome set and weighting, show unknowns, and explain the limits; ticket counts and lines of code are not measures of distance to the vision. Separate progress toward the near-term milestone from progress toward the broader vision.

Keep the assessment in the conversation unless a durable report is requested or an existing project workflow calls for one. When revisiting a saved assessment, recheck changing evidence and explain what advanced, regressed, or changed in scope. Preserve accepted decisions and qualifying reusable findings through the normal knowledge workflow; do not record a transient status snapshot as a lasting fact.
