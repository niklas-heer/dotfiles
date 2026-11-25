# Template: finish a stopped build

Use when a builder stopped mid-way (usage limit, repeated 529s, crash). Start an Opus builder at high effort with
this brief; it continues in the same checkout.

---

# Finish the {{tool}} promo build

The previous builder ({{model}}) stopped partway through: {{why}}. Continue its work; do not start over.

1. Read `{{film_dir}}/HANDOFF.md` (done / next), then `BRIEF.md` (the original brief, still in force), `SPEC.md`,
   and `git log --stat` to see what was committed.
2. Run `git status`: uncommitted changes are the previous builder's work in progress. Inspect them; keep what is
   sound, commit it as its own checkpoint, and say what you discarded and why.
3. Finish the remaining items in `BRIEF.md`'s deliverables in order, with the same gates (`npm run check`,
   `promo check sync`, `promo check loudness`, frames looked at full size and at 360 px).
4. Keep committing at checkpoints and keep `HANDOFF.md` current.

Report back in the format `BRIEF.md` asks for, and add which parts you took over versus inherited.
