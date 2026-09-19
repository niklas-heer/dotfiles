---
name: blog-writing
description: Write and revise visual blog posts in Niklas's voice by studying his existing articles, grounding claims in evidence, and opening a verified local draft preview. Use for a supplied idea or a storytelling brief, including requested editorial revisions.
---

# Write the article and open it

Deliver a complete, visually considered blog draft in the actual site, then open
its local preview for Niklas to read and request changes. A prose file, outline,
or suggested preview command alone does not finish the task. Default to one
article; continue through reviewable output without a new permission question.
Publishing remains separate unless explicitly authorized.

## Learn the voice before writing

Locate `niklas-heer/nheer.io` through GHQ and read its current instructions,
content schema, README, and `docs/visual-explainers.md` when present. Read 3–5
relevant complete published posts, including recent work and a similar genre.
Check closely related drafts and published articles for repeated arguments.
Prefer the user's final edited prose over earlier generated drafts.

Write a concise working voice profile grounded in those samples: openings,
point of view, paragraph rhythm, technical depth, humor, transitions, endings,
and the relationship between prose and visuals. Record sample paths and short
observations in the article's evidence notes, not in the article itself. Match
the language requested; a German archive is not a reason to mix languages into
an English draft. Reassess the profile when the user changes the editorial brief.

Recent English posts favor familiar friction, concrete examples, readable short
paragraphs, dry humor, and modest claims. This is a starting observation, not a
fixed formula. Do not mechanically recycle jokes, signature phrases, openings,
or sentence patterns. A voice profile is guidance, not a numerical style score.

## Establish and write the story

Use the supplied evidence brief or inspect relevant history and primary sources.
Find the central reader question, consequential choice/surprise, and payoff.
Separate verified observations, source claims, interpretation, and missing
personal context. A source about implementation cannot establish a memory,
motivation, quote, or emotion. Ask only for personal details essential to the
story, and write supported material while waiting; often a concrete example can
carry the opening without an invented anecdote.

Plan the prose and visuals together. Place an explanation where the reader
needs it; do not hide the story beneath evaluation caveats or implementation
details. Keep necessary limitations beside the claims they qualify, and link
full methodology when the article does not need all of it. Follow the actual
story rather than prescribing the same headings and ending to every post.

Use the authorized subscription-backed Codex CLI for a separate writing pass
when useful, with [the bounded writing route](references/codex-writing.md).
Give it the voice profile and a compact, self-contained evidence brief. Review
and revise its result; a model name does not guarantee good prose. If that route
is unavailable, report it and write in the current session when this meets the
user's request. Do not silently change an explicitly required model or billing.

## Make the explanation visual

Niklas wants visually rich posts. Actively look for ways to let the reader see
the result, inspect a mechanism, or compare a change. Each substantial article
should have a deliberate visual plan, usually a strong opening example and
additional figures at the points where they explain something new. Short human
stories may need only one or two real images. Do not pad a post with decoration.

Choose the medium for the question:

- Real screenshots or recordings for working software; reproduce with harmless
  sample data and label the build/version. Never pass generated UI off as a demo.
- Annotated diagrams or state comparisons for mechanisms and decisions.
- Charts for measured results, with units, denominators, provenance and unknowns
  visible. Label illustrative data explicitly.
- Small interactive explanations when a click or changed input reveals the
  lesson. Keep stable object identities, direct labels, and an understandable
  initial state. No unnecessary animation or automatic loops.

Reuse the site's components and typography where they fit. Create a small
article-specific Astro component when a real explanatory need warrants it;
prefer HTML/CSS/SVG over a new dependency. Use image generation for original
illustrations when appropriate, following the imagegen skill; it does not
replace measured evidence or authentic screenshots. Keep code examples readable
and copyable. Use alt text/captions, keyboard-operable native controls, visible
focus, reduced-motion support when animating, and layouts readable on phones.
Avoid relying on color alone. A static/no-JavaScript view should remain useful.

## Verify, open, and leave it ready for feedback

Write the article into the site's existing content collection with `draft: true`
and valid frontmatter. Preserve existing drafts and choose a noncolliding slug.
Keep source claims, revisions, factual checks, visual provenance, author questions,
and voice-profile notes in `docs/<article-slug>-evidence.md` or its existing
equivalent. Put private source details in the private hub instead of the public
blog repository. Keep disposable writer output and screenshots in ignored scratch.

Fact-check and edit for flow before rendering. Read the whole article as a reader:
does the opening earn attention, does every visual teach, does the ending land,
and does the prose sound like the sampled posts rather than generic promotion?
Use Jev only for a bounded unresolved editorial judgment; it cannot establish
truth, authenticity, or final author approval.

Run the repository's appropriate required checks. Use its existing local draft
preview workflow; read [preview.md](references/preview.md) for the known nheer.io
route and recheck against current files. Start/reuse a loopback-bound server,
load the actual article, inspect desktop and narrow/mobile rendering, and test
every new interaction, including keyboard operation. Fix broken assets, clipping,
poor contrast and browser errors. Confirm the draft is absent from normal site
routes/feeds before syncing it. Do not treat a successful build as visual QA.

Open the article in a **visible local browser** using available browser tools or
the OS opener. Leave the preview server running for feedback, and give the exact
clickable URL, a short description of the draft/visuals, any meaningful unresolved
facts, and verification status. Do not return only a filesystem path. If opening
is unavailable, still run and verify the server and provide the URL with that
specific limitation. On requested changes, revise the same draft, recheck affected
visuals, and refresh the preview rather than starting another article.
