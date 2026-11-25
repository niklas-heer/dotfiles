# Template: council final check

Copy into hub `scratch/<tool>-promo-final-check.md`, fill the slots, start one task per member.

---

# Council final check: {{tool}} promo v{{version}} (narrated)

You are a council member giving the final check before a ~58 s promo film for {{tool}} ({{one_line}}) is published
on Niklas's YouTube channel. **Read-only**: change no repository, render nothing into the project, post nothing, play
no audio aloud. Work in your own scratch directory.

Project `{{film_dir}}`. The film to publish: `renders/{{tool}}-promo-v{{version}}.mp4` (Niklas's voice, recorded in
Takewise; {{lufs}} LUFS, {{dbtp}} dBTP); `-music.mp4` is the same picture without the voice. Read README.md,
REVIEW.md (all rounds and what this version changed), SPEC.md, PUBLISH.md, captions.en.srt, thumbnail/. The voice
export: `voiceover/*.takewise/export/`. Product: `{{tool_checkout}}` ({{tool_version}}). Previous film for the bar:
`{{previous_film}}`.

History: {{scores_per_round}}. This version adds his voice and moves every word-anchored cue onto his words.
`node {{promo_kit}}/bin/promo.mjs check all` has passed; its output is in REVIEW.md. Re-measure only what you doubt.

## Check
1. **Sync** of titles and captions against his actual words.
2. **Mix**: voice against music and effects under his words and in his pauses; anything clipped or pumping. Say what
   you measured versus what needs ears.
3. **Picture**: stills at each cut and title, full size and 360 px; anything blank, broken, unreadable.
4. **Publish text**: title, description, tags, pinned comment, captions accurate against {{tool}} {{tool_version}};
   no "fast/only/first/stable" claims; disclosures present (his voice, generated music, how screens were made).
5. **Thumbnail**: readable at small sizes; fits the title.

## Return (under ~500 words)
- **Scores out of 10:** film overall; voice and mix (by measurement); titles/captions sync; thumbnail;
  title/description/tags.
- **Verdict:** publish after Niklas listens / fix first.
- **Blockers** with the cheapest fix; **polish** only if cheap. The film is done unless something is wrong.
