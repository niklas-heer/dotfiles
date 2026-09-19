+++
schema_version = 1
id = "01M2XHZ9ET3D2R1JR78PQ7K2ZQ"
title = "Standardizing on zsh"
date = "2026-08-15"
status = "accepted"
tags = ["shell"]
supersedes = ["01M2XHZ9GGFFJGC2CFEG0BYHYY"]
superseded_by = []
depends_on = []
related_to = []
+++
* **Status**: ⬆️ Supersedes [7 Adopting nushell](2025-02-10_192328656_adopting-nushell.md)
* **Decision**: I will use `zsh` as my standard interactive and login shell.
* **Context**: Nushell, Fish, and xonsh offer appealing modern features, but their non-POSIX syntax and uneven compatibility mean I still have to return to `zsh` for common commands and macOS workflows. `zsh` is included with macOS, works with the tools I use, and now provides the interactive experience I want through `zsh-autocomplete`, Carapace, and oh-my-posh.
* **Consequences**: Ghostty and Zed will start `/bin/zsh` by default. I will keep the other shell configurations available for experimentation, while maintaining `zsh` as the reliable primary setup.
Date: 2026-08-15 (derived from the commit that introduced this entry; the source record carried no date).
