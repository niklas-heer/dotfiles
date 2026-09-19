+++
schema_version = 1
id = "01M2XHZ9EDCMJVQF13RZ37S31Y"
title = "Sharing development preferences across coding agents"
date = "2026-09-19"
status = "accepted"
tags = ["ai"]
supersedes = []
superseded_by = []
depends_on = []
related_to = []
+++
* **Status**: ✅ Adopted
* **Decision**: I will keep development preferences in [one shared skill](../dot_agents/skills/niklas-preferences/SKILL.md), with a [short routing template](../.chezmoitemplates/agent-preferences.md) rendered into instruction files for Codex, Claude Code, Cursor CLI, Pi, and OpenCode.
* **Context**: Each agent discovers personal instructions differently. Shared topic references keep Git/GHQ, mise, Rust, and testing preferences consistent while loading detail only when relevant.
* **Consequences**: Chezmoi installs the entry points and native skill links for Claude Code and Pi; Codex, Cursor, and OpenCode discover the shared skill directly. Edit preference details in `dot_agents/skills/niklas-preferences/`, or edit the routing template and reapply all entry points when routing changes. Cursor's home rule covers workspaces under home; workspaces elsewhere retain global skill discovery. Restart agent sessions after updating global instructions. These are local configurations and must also be installed on other machines or remote environments where needed.
Date: 2026-09-19 (derived from the commit that introduced this entry; the source record carried no date).
