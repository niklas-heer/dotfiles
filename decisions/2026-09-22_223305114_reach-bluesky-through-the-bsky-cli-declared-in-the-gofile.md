+++
schema_version = 1
id = "01M35M0MATAMM1BD0E2XXRDEDD"
title = "Reach Bluesky through the bsky CLI declared in the Gofile"
date = "2026-09-22"
status = "accepted"
tags = ["tooling", "bluesky"]
supersedes = []
superseded_by = []
depends_on = []
related_to = []
+++
## Decision

Agents and the terminal reach Bluesky through the `mattn/bsky` Go CLI. The Go toolchain is declared in the `Brewfile`, and global Go binaries are declared in a `Gofile` that `run_onchange_after_5-go-globals.sh.tmpl` installs with `go install`, mirroring the `Bunfile` pattern. `~/go/bin` is on `PATH` in every managed shell. Credentials are Bluesky app passwords kept in 1Password, never in the dotfiles.

## Context

Bluesky exposes an open API (AT Protocol), so an agent can act on the account the way `gh` acts on GitHub. On 2026-09-23 `bsky` was installed ad hoc with `go install` and symlinked into `~/.local/bin`; `go` itself was a Homebrew formula missing from the `Brewfile`, so a new machine would not have received either. Alternatives considered: Bluesky's official `goat` CLI (Homebrew core, protocol-level, less convenient for everyday social actions), community MCP servers (typed tools, but one more running dependency and config), and `mise`'s `go:` backend (mise is not activated in the shells here, so its global tools would not be on `PATH`). `bsky` covers timeline, posting, likes, reposts, follows, search, notifications, and profile edits, stores only session tokens on disk, and offers an MCP mode if typed tools are wanted later. The hub fact `facts/bluesky-cli-access.md` records the verified behaviour and the credential location.

## Consequences

New machines get Go and `bsky` from `chezmoi apply`, and further Go tools are one line in the `Gofile`. Login still needs one manual `bsky login <handle> <app-password>` with the app password from 1Password. `@latest` pins nothing, so a breaking CLI release can change flags; the hub fact lists what to recheck. Revisit if Bluesky restricts app passwords for third-party clients or if an MCP integration becomes the preferred interface.
