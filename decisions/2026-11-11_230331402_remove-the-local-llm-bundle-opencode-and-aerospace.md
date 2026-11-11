+++
schema_version = 1
id = "01M76DM9TACPKR7SED9BPNH38J"
title = "Remove the local LLM bundle, OpenCode and AeroSpace"
date = "2026-11-11"
status = "accepted"
tags = ["ai", "tools"]
supersedes = ["01M2XHZ9EKJZ5TGW1H2C2F1E46"]
superseded_by = []
depends_on = []
related_to = []
+++
## Decision
Remove the opt-in local LLM bundle (Ollama and oMLX profiles, the `llm`, `local-ai`, `local-llm-ui` and `setup-local-llm` helpers, their Modelfiles and server settings), the OpenCode configuration and its token hook, and AeroSpace's configuration and macOS defaults from these dotfiles.

## Context
Niklas decided that he no longer uses any of the three. The local LLM bundle needed OpenCode as its coding harness, so the two went together. AeroSpace was never in the Brewfile; only its config and two macOS defaults remained after the move to Amethyst. The `nht` tools are unaffected.

## Consequences
Chezmoi stops managing the removed files; it does not delete files it already deployed, so they stay in the home directory until removed by hand. The installed apps, `~/.ollama` model weights and a `~/.opencode-token` file are likewise left alone. This supersedes the earlier decision to adopt opt-in native local LLM runtimes. The earlier record that chose Amethyst over AeroSpace stays valid.
