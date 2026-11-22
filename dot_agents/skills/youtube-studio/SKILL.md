---
name: youtube-studio
description: Upload videos to Niklas's YouTube channel and change the channel (banner, description, links, watermark, trailer) through YouTube Studio in a browser the agent controls. Use when asked to upload, publish or re-set a video's details on YouTube, or to update the YouTube channel's look or profile.
---

# YouTube Studio

Act on Niklas's channel **Niklas Heer** (`@NiklasHeer`, channel ID `UCeFBBW4lnDPQ3TArs--O9ZA`) in YouTube Studio.
Studio has no CLI path here. The Data API needs an OAuth client that isn't set up (hub fact
`facts/youtube-api-uploads.md`), so drive the web UI.

Uploading or changing the channel publishes. Do it when the request asks for it, using the title, description and
visibility given, and verify the saved result before reporting.

## Pick a browser

- **T3 preview pane** (verified 2026-11-16 and 2026-11-22): its default profile is signed in to Studio. Use
  `preview_open` with `reuseExistingTab=false`, then `preview_evaluate` / `preview_act`. `preview_act upload` with a CSS
  selector sets an `<input type=file>` directly, so no native file picker appears. Close the tab when you're done.
- **Claude in Chrome** (Niklas's browser is Ardia): the tools exist only in sessions started with `--chrome`. Set that in
  T3 → Settings → Providers → Claude → Launch arguments. Several "Browser N" entries may be connected; select the newest
  one that answers `tabs_context_mcp`. Setup and pitfalls: hub fact `facts/claude-in-chrome-with-ardia-and-t3.md`.
- Before uploading, check the signed-in channel: the Studio dashboard text shows "Niklas Heer".

## Studio is in German

Buttons and status text are German. Match on these strings, and prefer element names and IDs over coordinates.

| Meaning | Text |
| --- | --- |
| Upload button on the dashboard | `Videos hochladen` |
| Upload finished | `Upload abgeschlossen` |
| Publish / save | `Veröffentlichen` |
| Saved | `Alle Änderungen gespeichert.` |
| Show more fields | `Mehr anzeigen` (`#toggle-button`) |
| Crop dialog confirm | `Fertig` |

## Upload a video

1. Open `https://studio.youtube.com`, click `Videos hochladen`, and wait for `ytcp-uploads-dialog input[type=file]`.
2. `upload` the absolute file path into that selector, then wait for `#title-textarea #textbox`.
3. Studio fills in an **old title and description template**. Replace both: `type` with `clear: true` into
   `#title-textarea #textbox` and `#description-textarea #textbox`, which keeps newlines. Read both back with `innerText`.
4. Click the radios (`tp-yt-paper-radio-button[name=…]`) and read back `aria-checked`:
   - made for kids: `VIDEO_MADE_FOR_KIDS_NOT_MFK` (or `…_MFK`)
   - altered or synthetic content: `VIDEO_HAS_ALTERED_CONTENT_NO` / `…_YES` (appears after `#toggle-button` if missing)
5. Go to the visibility step with `#step-badge-3`. Studio **preselects Public**, so always click the requested one:
   `PUBLIC`, `UNLISTED` or `PRIVATE`. The video link appears in the dialog (`https://youtu.be/<id>`).
6. Wait for `Upload abgeschlossen` (use `preview_wait_for`, since long loops in `preview_evaluate` time out after 15 s),
   then click `#done-button`. A Public video goes live once SD processing finishes.
7. Verify on `https://studio.youtube.com/video/<id>/edit`: title, description, `ytcp-video-metadata-visibility`, and the
   kids and altered-content radios. The altered-content radios on this page appear only after clicking `#toggle-button`.

## Change the channel

Profile page: `https://studio.youtube.com/channel/UCeFBBW4lnDPQ3TArs--O9ZA/editing/profile`. Nothing goes live until you
click `Veröffentlichen`. The button turns disabled again once saving is done.

- **Banner**: `upload` into `ytcp-banner-upload input#file-selector`, then click the visible `Fertig` in the crop dialog.
  The image is 2560×1440. Desktop shows the middle 2560×423 band, and phones show only the centred 1546×423. The source
  is in hub `docs/youtube-banner/`, which also has the render and check steps.
- **Profile picture**: `ytcp-profile-image-upload input#file-selector`.
- **Description**: `#textbox[aria-label^="Erzähl deinen Zuschauern"]` (`type` with `clear`).
- **Links**: each is a `ytcp-channel-link-item` with two inputs (title, URL). `Link hinzufügen` adds a row. The inputs
  have no unique selectors: tag them with a `data-` attribute in `preview_evaluate`, then `type` into them.
- **Watermark**: `ytcp-video-watermark-upload`. `Entfernen` removes it.
- **Trailer and home sections**: the `Tab „Übersicht“` tab (`…/editing/hometab`). The trailer row is
  `ytcp-spotlight-trailer-video-item`: open `#overflow-menu-button`, choose `Video ändern`, click the video's title in
  the `Video auswählen` dialog, then click `Veröffentlichen`.

Verify on the public page `https://www.youtube.com/@NiklasHeer`. Headless screenshots may not load the banner image,
so read the banner's `img` src and download it to check it.

## Current state (2026-11-22)

The banner is the terminal `whoami` design, and the description is short and in English. Links: Website (nheer.com),
GitHub, Bluesky. No watermark. The trailer is the Kindred promo. Home-tab sections for the old German playlists
(Life Hacks, Let's Learn, Apfelkorb, Ausblick, TunlrControl, plus a "Partner" channel) are unchanged.
