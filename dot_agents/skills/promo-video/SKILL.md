---
name: promo-video
description: Use when asked to make a promo video, launch film or "the next promo" for one of Niklas's tools, apps or projects - a ~1-minute narrated YouTube film built in HyperFrames, voiced by him in Takewise - including picking which tool gets the next film, re-cutting a promo after his recording, or getting one ready to publish.
---

# Make a tool promo film

A promo film here is a 55–60 s, 1920×1080 YouTube film for one tool: real product footage captured without
touching Niklas's Mac, a generated music bed, his own voice recorded in Takewise, captions, a thumbnail, then
publishing. The films made this way, their checkouts and what each taught are listed in `promo-kit/FILMS.md`. This skill is the process. The mechanics live in other places:

- **promo-kit** (`<repot root>/github.com/niklas-heer/promo-kit`): the `promo` CLI and the film template. Run
  `node <promo-kit>/bin/promo.mjs --help`; its README is the command reference.
- **hyperframes**, **hyperframes-cli**, **media-use**: compositions, rendering, music, voice, mixing. Builders load
  them before touching a composition.
- **youtube-publish** (with **youtube-studio**), **launch-post**: upload, settings, README link, posts.

## Who does what

Orchestrate from one thread; delegate the work. The council is the models Niklas names; his standing instruction
names the latest Claude Fable and GPT Sol. If none are named, use the latest flagship from two providers. Resolve them with
`orchestrator_capabilities` and start each with `delegate_task`.

| Work | Model |
| --- | --- |
| Pick, reviews, tie-breaks | the council, both members, read-only, each in its own task |
| Builder (capture, cut, v1, fixes) | Fable at high effort; Opus at high effort when Fable is unavailable or limited |
| Narrated mix after his recording | the same builder thread, or Opus |
| Thumbnail, README link, mechanical follow-ups | Haiku or Opus |

Builders commit at checkpoints and keep a `HANDOFF.md` (done / next) so a usage limit mid-build costs minutes, not
the build. If a builder stops, start an Opus builder with `references/finish-handoff.md`.

## Phases

Keep council briefs and their answers in hub `scratch/` (`<n>th-promo-council-brief.md`, `<tool>-promo-review-r1.md`,
…). Fill the templates in `references/`; don't write briefs from scratch. Common slots: `{{repot_root}}` is
`repot root`; `{{promo_kit}}` is `<repot root>/github.com/niklas-heer/promo-kit`; `{{nth}}` is the number of films in
`FILMS.md` plus one; `{{previous_film}}` is the last row there.

| # | Phase | Gate before moving on |
| --- | --- | --- |
| 0 | **Pick** with `references/council-pick.md` | Both members rank the same tool first. If they split, run one tie-break where each reads the other's answer; if still split, decide yourself and say why. |
| 1 | **Ready to show** (builder, first step) | Installs from its published channel: the release asset's hash matches the tap formula, and the asset, run in a scratch directory with an empty home and data directory, reaches a usable first screen; no account wall in the film's path; nothing on camera looks broken. A failed gate goes to Niklas with the cheapest fix before any filming. |
| 2 | **Capture, script, music** with `references/builder.md` | Captured states committed; `voiceover/script.toml` with every claim verified on camera. |
| 3 | **Scaffold and v1**: `node <promo-kit>/bin/promo.mjs new <tool> --surface <web\|tui\|mac>` (merge-safe, into the existing film directory), fill `film.json`, build with every cue time in `tools/cues.mjs`, then with `film.json` `voice.use` = `"temp"`: `npm run tempvo && npm run voice && npm run narrate`, `npm run render` (music-only `-v<N>.mp4`, what he records against) and `npm run render:narrated` (`-v<N>-tempvo.mp4`) | `npm run check` clean; `npm run promo -- check sync` against the temp voice; `npm run promo -- check loudness`; the builder has looked at frames at full size and at 360 px wide. |
| 4 | **Council review** with `references/council-review.md` | Both say "ready to record". One round by default; a second only for unresolved blockers. **Tell Niklas the moment it is ready**: his recording slot is the largest wall-clock cost. |
| 5 | **Record**: Niklas, about 10 minutes | Before he starts: Mac output on the RØDECaster, wired headphones, `takewise doctor` clean, the project made against the *current* music-only render. After: every chosen take "keep", `takewise status --strict` clean, export written. |
| 6 | **Narrate**: set `voice.use` to `"recorded"` → `takewise export` → `npm run voice` → move each word-anchored cue in `tools/cues.mjs` onto his words, adding a `voiceover/timing-fixes.json` entry for every anchored word `voice` marks uncertain → `npm run narrate` → `npm run render:narrated` (the film to publish, `-v<N>.mp4`) and `npm run render` (`-v<N>-music.mp4`) → `npm run qa -- --write` | `npm run promo -- check all --strict` passes: captions and titles at or after their words, loudness on target, no blank frames. Thumbnail in parallel. |
| 7 | **Final check** with `references/council-final.md` | Both say "publish once Niklas has listened". Fix small findings yourself without a new round. |
| 8 | **Listen**: Niklas | His explicit go-ahead to publish. |
| 9 | **Publish** with `youtube-publish`; README link; posts with `launch-post` | Posts only with his approval of the exact text, and only when the tool needs the reach. Add the film to `promo-kit/FILMS.md`. |

## Where Niklas is needed

Only at phases 5, 8 and 9 (post text), plus any failed ready-to-show gate or product change. Everything else is
decided by the council or by you. When you need him, put the question and the options in one message; batch
questions instead of asking one at a time.

## What has gone wrong before

| Symptom | Cause | Prevention |
| --- | --- | --- |
| A caption or title appears a few frames before its word | Times typed by hand, rounded down | `promo narrate` writes captions from word times rounded *up*; cues carry `word` anchors; `promo check sync` fails early ones |
| Narration too quiet, or peaks over −1 dBTP | One gain node caps at +12 dB; the limiter lets onsets through | The template's voice-bus preset (compressor makeup, `truepeak` last); `promo check loudness` |
| Breaths pumped up between lines | Compressor lifts the room in pauses | Breath dips in `voiceover/dips.json`; `promo check pauses` |
| His recording plays through Bluetooth headphones and lands late | Mac default output, whatever the project says | Switch output to the RØDECaster before he starts; `takewise doctor` |
| Takewise project stale after a re-render | Takewise can't re-point a project at a new film | Re-`init` against the new render before any takes exist; never re-render the music cut after he records |
| Text unreadable on a phone; soft zooms | Full windows shrunk to fit | One pane per shot, captured at device scale 3–4; check every title at 360 px wide |
| Builder stops halfway | Model usage limit or 529s | Checkpoint commits, `HANDOFF.md`, Opus finish brief |
| Product fixed mid-film | Not checked before capture | The phase 1 gate |

## Honesty

Every on-screen state is real output of the pinned release, captured locally; drawn cursors and typing are disclosed
in the description. No "fastest", "only", "first", "best" or "stable" unless measured or true; say "early" for
pre-1.0 tools. Every voice line's claim is exercised on camera or cut. The description discloses his voice, the
generated music, and how screens were made.
