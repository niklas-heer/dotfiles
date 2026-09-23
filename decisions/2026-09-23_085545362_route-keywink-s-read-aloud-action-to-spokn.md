+++
schema_version = 1
id = "01M36QMRYJX2M1GXMNH4S5FDPC"
title = "Route Keywink's read-aloud action to Spokn"
date = "2026-09-23"
status = "accepted"
tags = ["shell", "keywink"]
supersedes = []
superseded_by = []
depends_on = []
related_to = ["01M2XHZ9CX2N3GD2ZNJXD5BCRE"]
+++
* **Status**: ✅ Accepted
* **Decision**: I will route Keywink's read-aloud action to Spokn through its `spokn://` URL scheme instead of a shell script that calls the AppleScript `say` command.
* **Context**: Spokn is the native reader with sentence and word highlighting, per-language Pocket TTS voices, and clipboard-preserving selection capture. The Keywink migration on 2026-09-19 carried over the Hammerspoon-era `read-selected-text` script, which spoke through Apple voices with no panel. Spokn gained a `spokn://` scheme (`read-selection`, `read?text=`, `paste`, `toggle`, `stop`, `show`, `check-updates`) on 2026-09-23 so launchers can drive it without the ⌘⇧S shortcut. A Keywink `url` action opens the scheme without activating Spokn, and non-sticky actions run after the guide closes, so the source app's selection is still in front.
* **Consequences**: Hyper+F, R reads the selection in Spokn and Hyper+F, S pauses or resumes it. The `read-selected-text` and `tts.jxa` helpers are removed; Spokn must be installed and running, which its Launch at Login setting now ensures. Premium Apple voices are no longer required.
