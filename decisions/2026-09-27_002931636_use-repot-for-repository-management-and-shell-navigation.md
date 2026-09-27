+++
schema_version = 1
id = "01M3G48Q3MGE577QACFKJJAGQ1"
title = "Use repot for repository management and shell navigation"
date = "2026-09-27"
status = "accepted"
tags = ["tooling", "shell"]
supersedes = []
superseded_by = []
depends_on = []
related_to = []
+++
## Decision

Use repot for repository discovery, cloning and navigation, installed from its
Homebrew tap through the Brewfile. In Zsh and Nushell, `repo` invokes
`repot jump` through the directory-handoff wrapper.

## Context

On 2026-09-27, Niklas explicitly requested local installation, integration into
both shells and the default package list after choosing repot to replace ghq's
Git workflows. repot preserves the existing ghq tree and root configuration.

## Consequences

New machines install repot instead of ghq. Agent guidance and the legacy `np`
root lookup use repot. Zsh loads native completions; Nushell regenerates the
wrapper before loading its configuration. Nushell extern completions are omitted
because their subcommands bypass the directory-changing wrapper, verified with
a temporary checkout. Existing `np` commands and other uses of fzf remain.
