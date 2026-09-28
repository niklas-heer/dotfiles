+++
schema_version = 1
id = "01M3N1MKGBFQKW2D10VYFK3HA9"
title = "Build Cargo dependencies without debug info"
date = "2026-09-28"
status = "accepted"
tags = ["tooling", "rust"]
supersedes = []
superseded_by = []
depends_on = []
related_to = []
+++
## Decision

Build Cargo dependencies without debug info on this machine, through a
chezmoi-managed `~/.cargo/config.toml` that sets
`[profile.dev.package."*"] debug = false`. Workspace crates keep the default
full debug info.

## Context

On 2026-09-29 the disk had 2.9 GB free, and Rust debug profiles across local
checkouts held about 34 GB. Niklas asked to make leaner Rust builds part of the
normal setup. On the hub's test build, the override cut the target directory
from 722 MB to 525 MB. Dropping debug info for workspace crates too, or using
`line-tables-only`, would save more but would make stepping through his own
code in a debugger worse. Cleaning alone does not stop debug profiles from
growing back.

## Consequences

Debug and test builds of every project are about a quarter smaller. Debuggers
cannot inspect variables inside dependency code; backtraces still name
dependency functions. A project that needs dependency debug info can override
the setting in its own `.cargo/config.toml`. The first build after applying
recompiles dependencies once. Cleanup of existing output is the hub's
`build-clean` tool.
