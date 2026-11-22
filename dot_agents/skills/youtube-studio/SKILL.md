---
name: youtube-studio
description: Upload videos to Niklas's YouTube channel, set a video's details (thumbnail, tags, languages, captions, settings) and change the channel (banner, profile picture, description, links, watermark, trailer, home sections) through YouTube Studio in a browser the agent controls. Use when asked to upload, publish or re-set a video's details on YouTube, or to update the YouTube channel's look or profile.
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
- **Claude in Chrome** (Niklas's browser is Ardia; verified 2026-11-22): the tools exist only in sessions started with
  `--chrome`. Set that in T3 → Settings → Providers → Claude → Launch arguments. Several "Browser N" entries may be
  connected. Try the `inUse` one, since the newest one timed out, and keep the one that answers `tabs_context_mcp`.
  Open your own tab with `tabs_context_mcp` `createIfEmpty: true`, get refs with `find` (it finds hidden file inputs too),
  click with `computer left_click` + `ref`, and read state with `javascript_tool`. `file_upload` with the input's `ref`
  and an absolute path sets the file without a picker. It can't open a private window, so check the signed-out view
  with `curl` instead (see Verify). Close your tab with `tabs_close_mcp`. Setup and pitfalls: hub fact
  `facts/claude-in-chrome-with-ardia-and-t3.md`.
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
| Crop dialog confirm | `Fertig` (dialog `Bild anpassen` for the profile picture) |
| Delete a home-tab section | `Abschnitt löschen` |

Studio always has a hidden `ytcp-error-section` ("Ein Fehler ist aufgetreten") and leaves hidden duplicate nodes after
edits. Filter by `offsetParent` before treating either as real.

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

For the details worth setting on every video (text, tags, thumbnail, captions, announcing it), use the
`youtube-publish` skill. It decides what to set; this section says how.

## Video settings (edit page, verified 2026-11-23)

Use `https://studio.youtube.com/video/<id>/edit`, click `#toggle-button` ("Mehr anzeigen"), then `Speichern`
(`#save`). The toast "Änderungen gespeichert" confirms it.

| Field | How | Value for Niklas's videos |
| --- | --- | --- |
| Thumbnail | `upload`/`file_upload` into `input#file-loader` (no picker) | 16:9 PNG/JPG under 2 MB |
| Tags | `ytcp-free-text-chip-bar`: `#clear-button` ("Alle löschen") empties it. Click the `Tags` textbox and type the list comma-separated, ending with a comma. | see `youtube-publish` |
| Videosprache, Sprache von Titel und Beschreibung | `ytcp-form-select` with that label. Open it and click the `tp-yt-paper-item` whose text is exactly `Englisch` (there are 239 options and no search box). | Englisch |
| Untertitelzertifizierung | the same kind of select | "Dieser Inhalt wurde noch nie im US-amerikanischen Fernsehen ausgestrahlt." |
| Bezahlte Werbung | radio `VIDEO_PAID_PRODUCT_PLACEMENT_NO` | No |
| Verwendung von KI | `VIDEO_HAS_ALTERED_CONTENT_YES` / `_NO` | Yes when it has generated music or imagery |
| Automatische Ortsangaben erlauben, Automatische Konzepte erlauben | `ytcp-checkbox-lit` (aria-checked) | off |
| Automatisch generierte Kapitel, Einbetten zulassen, likes shown | checkboxes | on |
| Lizenz / Kategorie / Kommentare | selects | Standard-YouTube-Lizenz / Wissenschaft & Technik / An, Standard |

**Captions:**
1. Open `…/video/<id>/translations`; the video language must be set first. Click `Untertitel bearbeiten`.
2. The editor opens prefilled with auto-captions. Click `Optionen` (⋮), then `Datei hochladen`, and keep "Mit Zeitangabe".
3. Don't press `Weiter`, which opens the native picker. Set the file directly on `#captions-file-loader` (a hidden
   input that exists while that dialog is open).
4. Check the cues and click `Veröffentlichen`.

**Upload defaults** (Einstellungen → `Upload-Standardeinstellungen`) are a channel-wide standing setting, so change
them only when Niklas asks. Since 2026-11-23 they have no tags, and visibility is **Privat**. The tags field there is
the same chip bar.

## Change the channel

Profile page: `https://studio.youtube.com/channel/UCeFBBW4lnDPQ3TArs--O9ZA/editing/profile`. Nothing goes live until you
click `Veröffentlichen`. The button turns disabled again once saving is done.

- **Banner**: `upload` into `ytcp-banner-upload input#file-selector`, then click the visible `Fertig` in the crop dialog.
  The image is 2560×1440. Desktop shows the middle 2560×423 band, and phones show only the centred 1546×423. The source
  is in hub `docs/youtube-banner/`, which also has the render and check steps.
- **Profile picture**: `ytcp-profile-image-upload input#file-selector`, then `Fertig` in the `Bild anpassen` crop
  dialog. The source is `avatar.html` in hub `docs/youtube-banner/` (1024×1024; check the circle crop).
- **Description**: `#textbox[aria-label^="Erzähl deinen Zuschauern"]` (`type` with `clear`).
- **Links**: each is a `ytcp-channel-link-item` with two inputs (title, URL). `Link hinzufügen` adds a row. The inputs
  have no unique selectors: tag them with a `data-` attribute in `preview_evaluate`, then `type` into them.
- **Watermark**: `ytcp-video-watermark-upload`. `Entfernen` removes it.
- **Trailer and home sections**: the `Tab „Übersicht“` tab (`…/editing/hometab`). The trailer row is
  `ytcp-spotlight-trailer-video-item`: open `#overflow-menu-button`, choose `Video ändern`, click the video's title in
  the `Video auswählen` dialog, then click `Veröffentlichen`. Each section is a `ytcp-shelf-list-item`. To remove one,
  click its `#shelf-actions-menu`, choose the option `Abschnitt löschen`, and then `Veröffentlichen`.

Verify on the public page. Fresh after a publish: `https://www.youtube.com/channel/UCeFBBW4lnDPQ3TArs--O9ZA?cb=<n>`.
`@NiklasHeer` was still cached with the old home sections minutes after a publish. For the signed-out view, `curl` it
without cookies (`-b SOCS=CAI` skips the EU consent page) and list the selected tab's sections from `ytInitialData`. The
profile picture is the page's `og:image`. Headless screenshots may not load the banner image, so read the banner's
`img` src and download it to check it.

## Current state (2026-11-23)

**Channel:**
- The banner is the terminal `whoami` design, and the description is short and in English.
- Links: Website (nheer.com), GitHub, Bluesky. No watermark.
- The profile picture is the Memoji on the banner's dark purple background.
- The trailer is the Kindred promo. Signed-out visitors see only the trailer and the Videos section. "Beliebte Videos"
  and the "Partner" channel section were deleted. Studio still lists sections for the old German playlists (Life Hacks,
  Let's Learn, Apfelkorb, Ausblick, TunlrControl), but visitors don't see them.
- Upload defaults: no tags, visibility Privat.

**The Kindred promo `UoeDqWzIjes`** (narrated v3):
- Title "Kindred: an open-source, self-hosted family tree your family comes back to".
- Three hashtags, 17 English tags, English captions, AI use Yes.
- The thumbnail is from `kindred-promo/thumbnail/`.
- Announced on Bluesky and X on 2026-11-23.
