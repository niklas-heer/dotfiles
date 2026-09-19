# Decision records

Niklas wants durable technical decisions and their reasoning kept beside the code. Use the project's existing decision log: dotfiles has a README section, Morrow has `DECISIONS.md`, and the hub uses `decisions/`. Preserve each project's format instead of migrating it just to fit a tool.

- Record choices with lasting consequences: tooling, architecture, workflow, compatibility, or substantial tradeoffs. Routine edits do not each need a decision record.
- Capture the date, status, decision, context/alternatives, and consequences where the format supports them. Add evidence, verification, measured costs, and limitations when they materially justify the choice, as Morrow does.
- Distinguish a proposal from an accepted decision and from completed, verified adoption. When the conversation already establishes a decision, record it without asking the same questions again.
- Preserve historical entries and add explicit supersedes/deprecated links when changing direction. Allocate a new unique ID; do not silently renumber existing records or recycle deleted IDs. Flag ambiguous or duplicate legacy IDs before automated migration.
- Keep prose, extra fields, links, and surrounding content intact. Do not collapse evidence or custom fields into a fixed schema just to make an editor accept them.
- Use Markdown and Git as the durable record. Prefer an existing CLI when its installed version supports the document format and preserves content. Keep dated compatibility findings in the hub's investigations rather than turning temporary tool limitations into permanent preferences.
- Keep records in the repository that owns the decision. Preserve cross-project investigations and proposals in the hub, linking the source evidence. Commit decision records with the coherent change they explain.
