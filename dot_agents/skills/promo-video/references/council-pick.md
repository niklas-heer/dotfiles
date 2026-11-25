# Template: council pick

Copy into hub `scratch/<n>th-promo-council-brief.md`, fill every `{{slot}}`, start one task per council member
with: "Read <path> and do exactly what it asks. You are the <model> council member. Read-only."

---

# Council brief: pick the {{nth}} tool promo film

You are one of two council members ({{member_a}} and {{member_b}}), working separately. **Read-only**: do not change
any repository, post anything, or run anything that writes outside your own scratch directory. Answer in the format
at the end.

## Context
Niklas makes short (~55–60 s) promo films for his own open-source tools on his YouTube channel, built in HyperFrames
(HTML rendered to video), narrated by him (recorded in his own tool Takewise), with generated music, a thumbnail, and
a Bluesky/X post. The films so far, their checkouts and what each taught are in
`{{promo_kit}}/FILMS.md`. The newest film is the quality bar and process: read its README.md, BRIEF.md, SPEC.md, the
end of REVIEW.md, and PUBLISH.md.

All local checkouts are under `{{repot_root}}/github.com/niklas-heer/`. Candidates (read each README and recent git
log; check stars and releases with `gh`, read-only): {{candidates_with_one_line_each}}. Also check for any tool
released or starred recently that is not on this list
(`gh repo list niklas-heer --limit 100 --json name,stargazerCount,pushedAt,isPrivate,description`).

**Past runners-up and why they were held back:** {{runners_up_with_reasons}}. Re-check those reasons against today's
state rather than assume.

**Patterns to weigh:** {{which_kinds_have_aired}}; variety helps the channel. Terminal and web tools can be filmed
headlessly without touching Niklas's Mac. A tool must be ready to show: installs cleanly from its published channel,
nothing on camera looks broken, no account wall. Reach matters (stars, a clear "I need that" moment), and so does
honesty (never claim what the tool doesn't do).

## What to return
1. **Ranked top three**, with a confidence for #1 and one-line reasons; say what you verified (and how) versus
   assumed.
2. **The film for #1**: audience, length, the hook in the first 2 s, beats with rough times, look, capture plan
   (headless/offscreen only), sound.
3. **Voiceover**: 6–8 short lines at Niklas's pace (~3 syllables/second), with start times; flag any claim you could
   not verify.
4. **Thumbnail** idea (≤4 words) and a YouTube **title** (≤60 chars).
5. **Blockers and prep**: anything to fix or decide before filming (cheapest fix for each), and whether it installs
   cleanly from its published channel. Try it in a temp dir; do not `brew install` on this Mac.

Keep it under ~900 words.

---

## Tie-break (only when the members pick different tools)

Save both answers to scratch, then give each member this:

> The original brief is `<brief path>`. The members disagreed: <A> picked <X> (<conf>) — `<path>`; <B> picked <Y>
> (<conf>) — `<path>`. Read both and weigh the other member's case honestly, checking (read-only) any claim that would
> change your mind. Decide on: readiness for what a viewer meets on click-through; whether each hook is real product
> output; reach versus embarrassment risk. Return in under 300 words: final pick, confidence, the one or two deciding
> reasons, and the single condition that must hold before filming.
