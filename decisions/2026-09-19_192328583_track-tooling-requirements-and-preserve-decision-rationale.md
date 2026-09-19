+++
schema_version = 1
id = "01M2XHZ9E736JA8RX7ZM6W5YB2"
title = "Track tooling requirements and preserve decision rationale"
date = "2026-09-19"
status = "accepted"
tags = ["tooling"]
supersedes = []
superseded_by = []
depends_on = []
related_to = []
+++
* **Status**: ✅ Adopted
* **Decision**: I will declare shared bootstrap commands in dotfiles, retain project-specific tool versions in their own mise manifests, and keep lasting decisions in each repository's existing Markdown log.
* **Context**: Project usage can outgrow the machine setup: `mise`, `gh`, and `rtk` were installed locally but missing from the Brewfile. A new machine needs installation declarations, not just evidence that commands exist on this machine. Morrow's decision log also demonstrates the value of retaining evidence and measured consequences.
* **Consequences**: The three missing shared commands are now in the Brewfile. The hub provides a read-only static audit of GHQ root manifests and shared bootstrap requirements; clean-machine installation and project checks remain separate verification. Optional tools stay opt-in, and common project tools are not automatically promoted to global dependencies. Decision guidance is shared with all configured agents; a possible vrdx format expansion remains a proposal.
Date: 2026-09-19 (derived from the commit that introduced this entry; the source record carried no date).
