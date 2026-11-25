# Template: council review round

Copy into hub `scratch/<tool>-promo-review-r<N>.md`, fill the slots, start one task per member. Paste the builder's
own weak-spot list into question 2 so the council judges them instead of rediscovering them.

---

# Council review, round {{N}}: {{tool}} promo v{{version}}

You are a council member reviewing version {{version}} of a ~58 s promo film for {{tool}} ({{one_line}}), the
{{nth}} film on Niklas's YouTube channel. **Read-only**: do not change any repository, render into the project, post,
or play audio aloud. Work in your own scratch directory.

## What to review
- Project `{{film_dir}}`: BRIEF.md, SPEC.md, README.md, REVIEW.md, PUBLISH.md, voiceover/script.toml,
  captions.en.srt, thumbnail/.
- Renders: `renders/{{tool}}-promo-v{{version}}.mp4` (music only; Niklas records against this) and
  `-tempvo.mp4` (temporary voice, timing only). Extract stills with ffmpeg at every cut and title, at full size and
  360 px wide. Run `node {{promo_kit}}/bin/promo.mjs check all` from the project and read its output; spend your
  time on judgement, not on re-measuring.
- The bar: the previous film, `{{previous_film}}`.
- The product: `{{tool_checkout}}` at {{tool_version}}. Check every claim in the film and PUBLISH.md against it.

## Questions
1. Does the film make {{audience}} want to try {{tool}}? Is the hook landing?
2. Is every state readable on a phone, and does nothing look broken or clipped? The builder flagged:
   {{builder_weak_spots}}. Which matter, and what is the cheapest fix?
3. Voiceover: right for Niklas's pace (~3 syllables/s) and slots, accurate, in his plain voice? Rewrite only where
   needed.
4. Honesty: anything claimed that isn't verified?
5. Thumbnail and title: pick one.

## Return (under ~700 words)
- **Score out of 10 now, and with your fixes.**
- **Blockers** (must fix before Niklas records), each with the cheapest fix.
- **Polish** (worth doing, not blocking).
- **Leave alone**: things you considered and would not change.
Keep scope tight: this is a nearly finished 58 s film, not a redesign.
