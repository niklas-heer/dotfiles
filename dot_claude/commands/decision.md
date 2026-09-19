---
description: Record a decision as a vrdx decision record.
---
Record a lasting decision as a [vrdx](https://github.com/niklas-heer/vrdx) record in the
repository that owns the choice.

**Arguments**: $ARGUMENTS (format: "decision title | brief description", optionally "| directory")

**Steps**

1. Run `vrdx guide` and follow it; it is the authoritative writing guidance.
2. Locate the collection. It is `decisions/` unless the repository keeps records elsewhere
   (`docs/decisions/`); pass that path with `--dir`. If the repository has no collection yet,
   create `decisions/` and say so.
3. Read the existing evidence before writing: `vrdx context "<the question>" --json`, and
   `vrdx show <id>` for any record this one changes.
4. Gather what the record needs, asking only what the conversation has not already settled:
   - **Decision**: the choice, its scope, and the behaviour it requires.
   - **Context**: the problem, constraints, evidence, and the alternatives that lost.
   - **Consequences**: benefits, costs, what becomes harder, and what would justify revisiting.
5. Write the body to a temporary file and create the record:

   ```sh
   vrdx new "<specific title>" --tag <topic> --body-file <file> --json
   ```

   The default status is `proposed`. Use `--status accepted` only when the user's decision or
   existing evidence authorises it; a proposed option is not approval.
6. Edit the generated Markdown for lifecycle and relationships: `supersedes`, `superseded_by`,
   `depends_on`, `related_to` hold full uppercase IDs. Mark a replaced record `superseded` and
   keep its body; explain the change in the new record instead of rewriting the old rationale.
7. Verify with `vrdx validate --json`, then `vrdx relations <id>` and the Markdown diff.
8. Report the created ID, path, and status. Commit it with the change it explains.

**Guidelines**

- Prefer a specific title ("Store event history as append-only records") over "Storage decision".
- One coherent decision per record; routine progress and task notes belong elsewhere.
- Do not invent dates, approvals, or consensus. Say what remains unknown.
- Keep credentials and private raw logs out of the record.
