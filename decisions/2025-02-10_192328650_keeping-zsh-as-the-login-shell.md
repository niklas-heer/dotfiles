+++
schema_version = 1
id = "01M2XHZ9GAZP4DMF2BMK2XV9M0"
title = "Keeping zsh as the login shell"
date = "2025-02-10"
status = "accepted"
tags = ["shell"]
supersedes = []
superseded_by = []
depends_on = []
related_to = []
+++
* **Status**: ✅ Adopted
* **Decision**: I leave `zsh` as the login shell.
* **Context**: Usually after using nushell as my main shell, I should also change my login shell via `chsh`, but that also means that the system will use that shell per default. To avoid any errors, I leave `zsh` as the default login shell, but set nushell in all applications I use (like Ghostty or Zed) as the standard shell for day-to-day use.
* **Consequences**: I have to keep a minimal zsh setup.
Date: 2025-02-10 (derived from the commit that introduced this entry; the source record carried no date).
