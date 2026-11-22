---
name: youtube-publish
description: Publish a finished video on Niklas's YouTube channel so it is found and presented well - title, description, tags, thumbnail, captions and the video's settings - then announce it on Bluesky and X and link it from the project's README. Use when a render is ready to go up, or when an uploaded video needs its launch details done properly.
---

# Publish a YouTube video

This skill is the editorial checklist. Studio's clicks, selectors and German labels are in the `youtube-studio` skill;
load it for every step that touches Studio. Making the film itself is the `hyperframes` skills' job.

Niklas asked for this on 2026-11-23 after the Kindred promo (`UoeDqWzIjes`) went up with the channel's stale German
default tags and no thumbnail. That launch is the worked example throughout. Its sources are in the `kindred-promo`
checkout (`thumbnail/`, `narrated/captions.en.srt`), and the research behind the settings is in hub
`research/2026-11-23-youtube-video-settings.md`.

## What needs approval

- The request itself covers uploading, the details, the thumbnail and the video's settings. Choose them; don't ask.
- **Ask first** for:
  - the text of every social post, which is published in Niklas's name;
  - channel-wide settings such as upload defaults, which are a standing rule, so the browser tooling refuses them
    unless he asked;
  - deleting anything.
- Show thumbnail candidates when there is a real choice, then upload the best one. It can be swapped any time.

## 1. Text

- **Title** (max 100 characters; about 70 show in search): put the name and the search words first, and keep it
  accurate. Example: "Kindred: an open-source, self-hosted family tree your family comes back to".
- **Description:**
  - The first two lines show above "more": what it is, plus the most useful link (demo or repo).
  - Then a short paragraph in Niklas's voice: no hype, concrete features.
  - Then honest notes, such as "the families in this video are invented".
  - End with **three hashtags**. YouTube shows them above the title, and more than 60 voids all of them.
- **Tags** (500 characters including commas; YouTube says they matter little): the brand and its combinations
  ("Kindred family tree"), the category words people search for ("family tree app", "genealogy software"), common
  misspellings ("geneology"), "self-hosted"/"selfhosted", "open source", and "Niklas Heer". No competitor brands.
- **Chapters:** only for videos over about 2 minutes. They need at least 3 timestamps, the first at 0:00, each at
  least 10 s long.

## 2. Thumbnail

- 16:9, at least 1280×720 (YouTube recommends up to 3840×2160), PNG or JPG. Upload it as a file under 2 MB.
- **Five words at most**, and they should add to the title rather than repeat it. Use the product's real UI or a face.
  Use strong contrast, and check that it reads at phone size. Keep the **bottom-right corner** free, because the
  duration badge covers it.
- Build it from the film's own stills, so it shows the real product. Two ways that worked:
  - **AI image through OpenRouter:** `POST https://openrouter.ai/api/v1/images` with `model`, `prompt`,
    `aspect_ratio: "16:9"`, `quality: "high"` and `input_references` (data URLs of the stills). Use
    `openai/gpt-image-2.6-sunburst`, which kept every UI word right (about $0.05). Nano Banana 2.1 garbled small text.
    The details are in hub `facts/openrouter-image-generation.md`.
  - **An HTML composition** of real screenshots, rendered with headless Chrome at 2×. It is sharp and exact, but plainer.
- Name the exact words in the prompt, ask for the bottom-right corner to stay empty, and look at the result at full
  size for wrong text before using it.
- Keep the source, the prompt and the chosen image beside the film (for example `kindred-promo/thumbnail/`).

## 3. Captions

Upload accurate English captions. The auto-captions mishear ("open [music] source"). Write an SRT from the script,
with times from the film's own placement of each line (the `data-start`/`data-duration` of the voice clips), not from a
transcript. Whisper drifted by up to a second after 20 s. Split lines longer than about 50 characters. Keep the SRT
next to the project.

## 4. Settings

Set these with `youtube-studio`. Its *Video settings* section has the German labels and values. In short:

- English as the video language and as the title/description language, and the caption certification set.
- Category Wissenschaft & Technik, standard licence, embedding on.
- "Erwähnte Orte" and "Automatische Konzepte" off.
- Paid promotion: No. Made for kids: No.
- **AI use: Yes** when generated music or imagery is in it (the Kindred promo's music is Lyria). It costs nothing in
  reach.
- Comments on, moderation Standard.
- The visibility the request names. Studio's dialog preselects Public; the upload default is now Private.

For a channel trailer, playlist or home-tab change, see `youtube-studio`.

## 5. Verify signed out

Fetch `https://www.youtube.com/watch?v=<id>` with `curl` and no cookies (`-b SOCS=CAI`) and read
`ytInitialPlayerResponse`:

- `videoDetails.keywords` should be the tags;
- `captions…captionTracks` should include an `en` track that isn't `asr`;
- `microformat…category` should be the category.

Download `https://i.ytimg.com/vi/<id>/maxresdefault.jpg` and look at it.

## 6. Announce

1. Draft **one** post that fits both networks:
   - X allows 280 characters, and every URL counts as 23. Count with
     `re.sub(r"https?://\S+", "x"*23, text)`.
   - Bluesky allows 300 graphemes, and the URL counts in full.
   - Write in Niklas's voice: first person, plain, a concrete hook (the problem), what it does, "free, open source,
     self-hosted", the length, then the link.
2. Show the draft and get a yes. Post the approved text unchanged.
3. **Bluesky:** use the `bluesky` skill. Run `bsky post --image thumb.jpg --image-alt '…' "$(cat post.txt)"`; the
   image is the thumbnail as a JPEG under 1 MB. Verify with `getPostThread`: the text is identical and there is a link
   facet and an image.
4. **X:** use Claude in Chrome on Ardia, which is signed in as `@niklas_heer`.
   - Open `https://x.com/compose/post`, click `[role=dialog] [data-testid=tweetTextarea_0]`, and type the text.
     Newlines work.
   - Zoom in on the counter: it must not be negative.
   - Click `Posten`. Don't attach an image: X shows the YouTube card by itself.
   - Verify on `https://x.com/niklas_heer` from the newest `article`: its text and `card.wrapper`.
5. Report both links.

## 7. Link it from the project

GitHub READMEs can't embed a player. Add a line linking `https://youtu.be/<id>`, plus the thumbnail with a "▶ Watch
the film · 0:55" pill drawn in its empty corner. Save it as webp in the repo's image folder, and link that image to
the video too. Follow the repository's own rules before committing. Kindred requires a family-name scan of the added
lines, and its CI runs on docs-only pushes too.

## 8. Keep what you learned

Put new Studio mechanics in `youtube-studio`, findings in hub `facts/`, and the video's details (ID, title, which
render) in the film project's README.
