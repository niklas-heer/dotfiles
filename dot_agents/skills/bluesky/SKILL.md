---
name: bluesky
description: Read, draft, post, reply, and edit Niklas's Bluesky profile through the installed bsky CLI and the AT Protocol API. Use when asked to check Bluesky, post or reply there, read notifications or a thread, or change the profile bio, avatar, or banner.
---

# Bluesky

Act on Niklas's Bluesky account (`nheer.bsky.social`) from the shell. Reads are
free; every post, reply, like, follow, or profile edit is a publication and
needs the approved text or asset from the conversation first.

Invoke with `$bluesky` in Codex/T3 Code or `/bluesky` in Claude Code.

## Access

- CLI: [mattn/bsky](https://github.com/mattn/bsky), declared in the dotfiles
  `Gofile`, binary at `~/go/bin/bsky`. Agent shells often lack `~/go/bin` on
  `PATH`; call it by full path. Prefix commands with `rtk` where available.
- Session: `~/.config/bsky/nheer.bsky.social.auth` holds JWTs and is refreshed
  by every CLI call. `~/.config/bsky/config.json` holds the app password in
  plaintext: never print that file; inspect keys only (`jq keys`).
- Re-login when `show-session` fails:
  `~/go/bin/bsky login nheer.bsky.social "$(op read 'op://Private/Blue Sky/App Passwords/claude-cli')"`.
  Revoke or rotate with `revoke-app-password` / `add-app-password`.
- Background: hub fact `facts/bluesky-cli-access.md`; banner source and
  regeneration in hub `docs/bluesky-banner/`.

## Read

| Need | Command |
| --- | --- |
| Home timeline | `bsky timeline -n 20` (`--json` for scripting) |
| Own posts | `bsky timeline -H nheer.bsky.social -n 5 --json` |
| A conversation | `bsky thread <at://uri>` |
| Mentions, likes, follows | `bsky notification` (`-a` for all; no `-n`) |
| Search posts / people | `bsky search 'term'`, `bsky search-actors 'name'` |
| Profile as others see it | `bsky show-profile` |

Post identity is the `at://did/app.bsky.feed.post/<rkey>` URI. Web link:
`https://bsky.app/profile/nheer.bsky.social/post/<rkey>`.

## Draft and post

1. Draft in the conversation. Limit is 300 graphemes; `python3 -c 'print(len(s))'`
   counts code points, which is a safe upper bound. Offer two or three variants
   with counts when tone matters; Niklas picks or edits.
2. Verify before publishing: a named person's words are quoted verbatim from
   the primary source, numbers and dates come from a cited article, and
   attributions are checked. Say what was not verified.
3. Publish only the approved text, unchanged. Write it to a file and pass
   `"$(cat /tmp/post.txt)"`: command substitution survives apostrophes and
   `$18.5M`, which break single and double quotes respectively.
   - New post: `~/go/bin/bsky post "$(cat /tmp/post.txt)"`
   - Reply: `~/go/bin/bsky post -r <at://parent-uri> "$(cat /tmp/post.txt)"`.
     Reply to the post Niklas names. When extending his own thread, reply to
     its last post; the CLI sets the root. If the named post is a root with
     follow-ups and the placement is unclear, ask.
   - Images: `--image file --image-alt 'description'`.
4. Verify: `post` prints the new `at://` URI; run `bsky thread <uri>` and
   compare the text and parent to what was approved. Report the web link.
5. Undo: `bsky delete <at://uri>`.

Likes (`vote`), reposts, follows, mutes, and blocks are one-off commands on an
explicit request; do not batch them.

## Profile

`bsky update-profile` cannot be used: it fails with `RecordNotFound` on an
account without a profile record and rejects the current CDN URL format after
one exists. Edit the `app.bsky.actor.profile/self` record directly with the
bundled helper (`~/.claude/skills/bluesky` is a symlink to
`~/.agents/skills/bluesky`), which refreshes the session, merges into the
existing record, and guards the write with `swapRecord`:

```sh
python3 ~/.agents/skills/bluesky/profile-record.py show
python3 ~/.agents/skills/bluesky/profile-record.py set description "$(cat bio.txt)"
python3 ~/.agents/skills/bluesky/profile-record.py set-blob banner /path/banner.png
```

Bio limit is 256 graphemes; the current style is one emoji-led line per fact.
Avatar is square; banner is 3:1 (the web client overlays the avatar on its
bottom-left, mobile crops top and bottom). Check dimensions with
`sips -g pixelWidth -g pixelHeight file`; blobs must stay under 1 MB. After a
banner change, update the hub's `docs/bluesky-banner/` (`banner.html` quote
and attribution, `banner.png`, and the README line naming the current quote)
and commit. Verify with `bsky show-profile` and, for layout, a Playwright
screenshot of the profile page.

## Keep

Record CLI behaviour changes in the hub fact, not in this skill. Keep the app
password, JWTs, and other people's posts out of Git and notes.
