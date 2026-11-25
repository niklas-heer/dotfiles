# Template: builder brief

Copy into the film repo as `BRIEF.md` (and hub `scratch/<tool>-promo-brief.md`), fill every `{{slot}}`, and start
the builder with: "Read <path> and do exactly what it asks. Never take over Niklas's Mac. Commit at checkpoints; do
not push or create a remote. Report back in the brief's format."

Slots without an obvious value: `{{surface}}` is `web`, `tui` or `mac`; `{{capture_approach}}` keeps the one line for
that surface and drops the others; `{{look}}` comes from the winning council concept (usually the product's own
palette); `{{words_to_avoid}}` and `{{tool_specific_rules}}` come from the council's flags and the product's README
(pre-1.0 status, untested platforms, features not exercised). Write "none" rather than leave a slot empty.

---

# Build the {{tool}} promo film

You are the builder for Niklas's {{nth}} tool promo film. The council chose **{{tool}}** (`{{tool_checkout}}`,
{{one_line_what_it_is}}, release **{{version}}** of {{release_date}}). Work autonomously to a rendered v1 and report
back.

## Read first
- Council input: {{paths_to_pick_answers}}. Start from {{winning_member}}'s concept; you own the final cut.
- The newest film, the quality bar: `{{previous_film}}` — README, BRIEF, SPEC, REVIEW (all rounds), PUBLISH,
  voiceover/README.md and script.toml.
- `{{promo_kit}}/README.md` and `promo --help`; `{{promo_kit}}/FILMS.md` for what earlier films got wrong.
- Hub facts (`{{hub}}/facts/README.md`, then the hyperframes, music and truepeak notes).
- Skills: `hyperframes`, `hyperframes-cli`, `hyperframes-registry`, `media-use`.
- {{tool}}: README, AGENTS.md, release notes (`gh release view {{version}} -R niklas-heer/{{repo}}`), and
  {{tool_specific_sources}}.

## 1. Ready-to-show gate (first; stop and report if it fails)
Download the published {{version}} release asset into your scratch, verify its SHA-256 against the release checksums
and the Homebrew formula (read via `gh api`; do not `brew install` on this Mac). Walk a fresh install to its first
usable screen and through every feature the film will show. Report anything that would look broken on camera with
the cheapest fix; do not change {{tool}}.

## 2. Capture: headless, never take over the Mac
Niklas is using his Mac: no visible windows, no audio aloud, no screen capture of his desktop.
{{capture_approach: web → promo capture web with a plan file; terminal → tmux PTY captured as ANSI and re-set as
text (see tdx-promo/capture/shoot.py); Mac app → offscreen capture harness in the app (hub fact
gpui-offscreen-window-capture.md)}}. One pane per shot, never a full window shrunk to fit; capture at device scale
3–4 so type reads at 360 px wide. Seed believable data with current dates and no personal names, paths or hostnames.

## 3. Script, look, sound
- Voiceover: 6–8 lines at ~3 syllables/s, each with its slot and a direction note, in `voiceover/script.toml`.
  Exercise every claim on camera, or cut it. {{words_to_avoid}}.
- Look: {{look}}. Sound: generated bed (at most 3 tracks; report credits), a few dry effects, ducked under the voice.
- Thumbnail plan (≤4 words) and title drafts (≤60 chars).

## 4. Scaffold, build, render
`promo new {{tool}} --surface {{surface}}` in `{{repot_root}}/github.com/niklas-heer/{{tool}}-promo` (merge-safe),
then build v1. Put every cue time in `cues.mjs`; give each title a `word` anchor. Render
`renders/{{tool}}-promo-v1.mp4` (music only, to record against) and `-v1-tempvo.mp4` (temp AI voice, never
published). Gates: `npm run check` clean, `promo check sync` and `promo check loudness` pass, and you have looked at
frames at every cut and title at full size and 360 px wide.

## Deliverables
A local git repo `{{tool}}-promo` (branch `main`, no remote) with BRIEF, SPEC (≤ 8 KB), README, REVIEW (≤ 3 KB per
version), PUBLISH draft, CAPTURE, `voiceover/script.toml` and a Takewise project made against the v1 music cut
(`takewise status`, `takewise doctor`; do not calibrate or record), captions draft, thumbnail plan. Commit at
checkpoints (explicit paths) and keep `HANDOFF.md` current.

## Honesty rules
Every on-screen state is real {{tool}} {{version}} output; drawn cursor or typing is disclosed. {{tool_specific_rules}}

## Report back (≤ 600 words)
Gate result, renders, capture approach, voiceover lines with times, music and credits, weak spots, {{tool}} issues
found with cheapest fixes, what needs ears, commits.
