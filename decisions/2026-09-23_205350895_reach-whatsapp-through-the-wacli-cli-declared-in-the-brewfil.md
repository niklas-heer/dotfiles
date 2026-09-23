+++
schema_version = 1
id = "01M380QMNF05B6XY0DADH5CPWY"
title = "Reach WhatsApp through the wacli CLI declared in the Brewfile"
date = "2026-09-23"
status = "accepted"
tags = ["tooling", "whatsapp"]
supersedes = []
superseded_by = []
depends_on = []
related_to = []
+++
## Decision

Agents and the terminal reach Niklas's personal WhatsApp through the `openclaw/wacli` Go CLI, installed from the `openclaw/tap` Homebrew tap and declared in the `Brewfile`. It pairs as a linked device (QR or phone code) and keeps its session keys and synced history in `~/.wacli/`, which stays outside the dotfiles. The global `whatsapp` skill in `dot_agents/skills/` holds the working procedures; every send requires the approved recipient and text.

## Context

WhatsApp offers no API for personal accounts, so an agent can only act as a linked device speaking the WhatsApp Web protocol. On 2026-09-23 the options were: `wacli` (single binary, Homebrew formula, SQLite with full-text search, `--json` output, read-only mode, store lock), `lharries/whatsapp-mcp` (Go bridge plus Python MCP server, two processes and reported re-pairing every ~20 days), and the official WhatsApp Business Cloud API (sanctioned, but a separate business number with template approval and no access to the personal number). `wacli` matches the existing `bsky` pattern of a shell CLI wrapped by a skill and needs no running daemon: `wacli sync --once` refreshes before a read. The hub fact `facts/whatsapp-cli-access.md` records the verified behaviour.

## Consequences

New machines get `wacli` from `chezmoi apply`, but pairing stays manual: one QR scan or phone code per machine, and WhatsApp can revoke linked devices at any time. The protocol is unsanctioned by Meta, so sends stay human-approved and low-volume; bulk or scheduled messaging would risk the account. The store holds plaintext message history at mode 600 and must never be committed or copied into notes. Revisit if Meta restricts linked devices, if `wacli` stops tracking protocol changes, or if a typed MCP interface becomes preferable to shell calls.
