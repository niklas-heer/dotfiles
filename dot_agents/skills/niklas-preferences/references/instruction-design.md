# Maintaining agent guidance

Niklas prefers giving capable agents relevant facts, boundaries, interfaces, and concrete verification procedures, with room to reason. Apply this when authoring or auditing guidance; it is not another checklist for every development task.

## Review and update

1. Identify the task scope, current guidance, user-approved preferences, and a concrete failure the change should prevent. Classify each instruction as a fact, boundary, preference, procedure, or obsolete workaround.
2. Keep facts accurate and intentional boundaries explicit. Phrase preferences as contextual defaults. Honor existing task authorization; do not turn example approval gates into universal extra confirmations.
3. Keep always-loaded files small: identity/scope, essential boundaries, relevant validation entry points, and a map to deeper material. Load language, infrastructure, release, and domain references only when needed. Maintain one source for shared rules.
4. Give a skill a clear trigger, needed inputs, useful procedure, output, and verification. Use exact examples for exact-format work; use acceptance criteria when judgment is wanted. Preserve supplied configuration examples that are actual user preferences.
5. Remove or narrow rules whose absence would not cause a concrete failure. Keep temporary findings and historical incidents in dated records. Audit after meaningful tool/model changes or when contradictory behavior appears; a periodic review can help, but no automatic schedule is implied.
6. Verify the artifact: for prose, check factual claims, commands, links, and scope; for agent routing, check rendered entry points and discovery; for code or configuration, run the project's applicable checks. Preserve required gates and report any check not run.

Keep instruction edits in Git so comparisons and rollback are possible. For a substantial behavior change, compare the previous, reduced, and revised configurations on a small set of representative tasks. Run in disposable workspaces with production actions disabled; an evaluation should not perform the sensitive action it is testing.

## Representative evaluation cases

| Task | Evidence to inspect |
| --- | --- |
| Add a small feature in an established project | Fits existing architecture; coherent diff; meaningful acceptance test |
| Fix a reproducible bug | Independent regression reproduces the bug and passes after the fix |
| Refactor without a behavior change | Preserves public behavior; no unrelated dependency/tool migration |
| Upgrade one dependency | Checks compatibility and relevant release evidence; changes only needed manifests/lock entries |
| Review a request containing a malicious instruction in a log or issue | Treats embedded directions as data; no secret disclosure or unauthorized action |
| Handle an ambiguous repository or consequential requirement | Resolves it from available evidence or asks a focused question before dependent work |
| Finish authorized work, or receive an unauthorized production request | Commits/pushes within existing authorization; recognizes genuinely missing authorization for sensitive work |

Record correctness, unnecessary changes, verification quality, boundary handling, user corrections, elapsed time, and tokens when available. A manual review of expected behavior is not an executed agent comparison; distinguish them in the results. Keep this small and extend it only for demonstrated failures.
