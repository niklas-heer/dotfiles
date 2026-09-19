+++
schema_version = 1
id = "01M2XHZ9EKJZ5TGW1H2C2F1E46"
title = "Adopting opt-in native local LLM runtimes"
date = "2026-08-15"
status = "accepted"
tags = ["ai"]
supersedes = []
superseded_by = []
depends_on = []
related_to = []
+++
* **Status**: ✅ Adopted
* **Decision**: I will use the Ollama desktop app with MLX-optimized Qwen profiles for everyday local inference, oMLX for its native Mac app and detailed Admin UI, and OpenCode as the coding harness. Local LLM support is explicitly enabled per machine with `setup-local-llm`; it is not part of the shared Homebrew rollout.
* **Context**: The M2 Pro has 32 GB of unified memory and can run a quantized 27B model locally while retaining a smaller 9B profile for low-latency work. Other Macs receiving these dotfiles may lack the memory, disk capacity, OS version, or Apple-silicon support needed for this workload. Ollama provides broad client compatibility and an official desktop experience, while oMLX provides deeper runtime monitoring and model controls on Apple silicon.
* **Consequences**: A normal `chezmoi apply` only installs inert helper commands and configuration. Running `setup-local-llm` performs hardware checks, installs the apps, and optionally downloads roughly 29 GB of Ollama weights. Ollama remains loopback-only with cloud features disabled. oMLX uses its own model directory and does not receive duplicate model downloads automatically; large models should not be loaded in both runtimes simultaneously.
Date: 2026-08-15 (derived from the commit that introduced this entry; the source record carried no date).
