---
name: x-twitter
description: Post, reply and read on Niklas's X (Twitter) account @niklas_heer through Claude in Chrome in his Ardia browser, where he is signed in. Use when asked to tweet, post or reply on X or Twitter, or to check what a post on X looks like.
---

# X (Twitter)

Act on Niklas's account **@niklas_heer** on x.com. There is no CLI or API access. The paid API isn't set up. Drive
x.com in Ardia through Claude in Chrome (`mcp__claude-in-chrome__*`), where he is signed in. The setup is in hub fact
`facts/claude-in-chrome-with-ardia-and-t3.md`: the session needs `--chrome`, and you pick the connected browser that
answers `tabs_context_mcp`.

Reading is free. Every post, reply, repost, like or follow is published in Niklas's name, so it needs the approved
text from the conversation. Post the approved text unchanged.

X's UI is in **German** here (`Posten`, `Startseite`, `Entwürfe`).

## Post (verified 2026-11-23)

1. Open your own tab (`tabs_context_mcp` with `createIfEmpty`), then navigate to `https://x.com/compose/post`. The
   composer opens as a dialog over the timeline.
2. Check the account: `[data-testid=SideNav_AccountSwitcher_Button]` should read "Niklas Heer | @niklas_heer". On
   2026-11-23 its text was empty; `a[data-testid=AppTabBar_Profile_Link]` with `href="/niklas_heer"` confirms it too.
3. Click `[role=dialog] [data-testid=tweetTextarea_0]` (use `find` for its ref), then `type` the text. Newlines in the
   text become line breaks. The editor's `innerText` shows an extra `\n` per blank line; that is how it renders
   paragraphs, not a typo.
4. **Count before posting.** The limit is 280 for a normal account, every URL counts as 23, and emoji count 2. Count
   locally with `re.sub(r"https?://\S+", "x"*23, text)`, then `zoom` on the counter ring left of `Posten`. It shows
   the characters left and must not be negative.
5. Click `Posten` (`[role=dialog] [data-testid=tweetButton]`).
6. Verify on `https://x.com/niklas_heer`. The newest `article` should have the text (`[data-testid=tweetText]`), a
   `time` and a link `a[href*="/status/"]`. That link is the post's address: `https://x.com<href>`.
   The profile can lag by minutes (the Focal post was missing there right after posting): before posting again,
   search `https://x.com/search?q=from%3Aniklas_heer%20<word>&f=live`, which showed it at once.

A link at the end of the text becomes a **card**. A YouTube link shows the video's thumbnail and plays inline, and the
URL itself is hidden from the text. Don't attach an image when the link has a good card.

## Reply

Open the post's `/status/<id>` page and write in the reply box under it, which is also `tweetTextarea_0`, then click
`Antworten`. Verify that the reply shows under the post. Not yet done here.

## Images

Untried. The composer has a hidden file input, probably `input[data-testid=fileInput]`. Use `find` for its ref and
`file_upload`, which needs no picker; Claude in Chrome's limit is 10 MB per call. Add alt text through the image's
"Beschreibung" button. Check the preview before posting, and record what worked here.

## Undo

Deleting is permanent, so ask first. On the post: the `⋯` menu (`[data-testid=caret]`), then `Löschen`, then confirm.
The confirm dialog is a page dialog, not a browser `alert`. Not yet done here.

## Finish

Close the tabs you opened (`tabs_close_mcp`). Report the post's address. Record X UI changes and newly verified steps
here.
