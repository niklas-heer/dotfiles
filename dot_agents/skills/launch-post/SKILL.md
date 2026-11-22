---
name: launch-post
description: Announce a launch - a new video, release, project or article - on Niklas's Bluesky and X with one approved post, then check both and report the links. Use when asked to announce, share or promote something on Bluesky and X/Twitter, or as the announce step of a video launch.
---

# Launch post on Bluesky and X

One announcement, written once and posted unchanged on both networks. The mechanics live in the `bluesky` skill (the
`bsky` CLI) and the `x-twitter` skill (x.com in Ardia through Claude in Chrome). This skill is the editorial part and
the order of steps. The first run was the Kindred film on 2026-11-23:
[Bluesky](https://bsky.app/profile/nheer.bsky.social/post/3n2wqugnp6w24),
[X](https://x.com/niklas_heer/status/2124644285412704627).

## 1. Draft one post that fits both

- **Limits:**
  - **X** allows 280, and every URL counts as 23.
  - **Bluesky** allows 300 graphemes, and the URL counts in full.
  - A text that fits X weighted and Bluesky in full fits both. Count both:

    ```python
    import re; t = open("post.txt").read().rstrip("\n")
    print("bluesky", len(t), "x", len(re.sub(r"https?://\S+", "x" * 23, t)))
    ```
- **Niklas's voice:** first person, plain and specific, no hype words or exclamation marks. Hashtags only if he asks.
  Read his recent posts first (`bsky timeline -H nheer.bsky.social -n 10`).
- **Shape that worked:** the problem in one line, then what he built and what it does (concrete features), then
  "Free, open source, self-hosted." when true, then the format ("55 seconds:"), then the link on its own line.
  Example:

  > Most family trees get one look. So I built Kindred, one with reasons to come back: the family's news, a question
  > of the week, a daily quiz from your own records, a map of where everyone came from, a weekly game.
  >
  > Free, open source, self-hosted. 55 seconds:
  > https://youtu.be/UoeDqWzIjes

- **Claims:** only true ones. Don't say the family "uses it daily" unless he said so. Name invented data as invented.

## 2. Get approval

Show the exact text, its two counts, and what goes with it: the image and alt text for Bluesky, the card on X. Ask
once, for both networks; he may pick one. Change nothing after the yes. If he edits the text, count it again.

## 3. Post

- **Bluesky first** (the CLI is quick). The `bsky` CLI makes no link card, so attach an image: for a video, the
  thumbnail as a JPEG under 1 MB (`sips -s format jpeg -s formatOptions 85 in.png --out thumb.jpg`), with alt text that
  describes it.

  ```sh
  ~/go/bin/bsky post --image thumb.jpg --image-alt '…' "$(cat post.txt)"
  ```

- **X:** follow the `x-twitter` skill. Use the same text and no image when the link makes a card (YouTube, GitHub, most
  articles).

## 4. Verify both

- **Bluesky:** fetch `app.bsky.feed.getPostThread?uri=<at-uri>&depth=0` from `public.api.bsky.app`. Check that:
  - the text matches the approved file exactly (`diff`);
  - the facet's URI is the link;
  - the embed is `app.bsky.embed.images#view`.
- **X:** on `x.com/niklas_heer`, the newest `article` should have the text and a `card.wrapper`.

Report both links. For a video launch, the `youtube-publish` skill also has the README step that follows.
