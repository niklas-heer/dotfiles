+++
schema_version = 1
id = "01M3N2GK9NNPQMFKGXWMJ06YMK"
title = "Keep ghq installed alongside repot"
date = "2026-09-28"
status = "accepted"
tags = ["tooling", "shell"]
supersedes = []
superseded_by = []
depends_on = []
related_to = ["01M3G48Q3MGE577QACFKJJAGQ1"]
+++
## Decision

Keep ghq installed alongside repot and declare both in the Brewfile. Tooling,
agent guidance and shell navigation use repot; ghq remains available as a
compatible second client of the same checkout tree.

## Context

The repot adoption on 2026-09-27 removed ghq from the Brewfile. On 2026-09-29,
while the hub's tooling moved from ghq to repot, Niklas chose to keep ghq
rather than uninstall it. Both tools read the `ghq.root` Git setting, so they
list and clone into the same tree without any synchronisation step.

## Consequences

New machines install ghq again, amending the repot record's statement that
they install repot instead of ghq. The `[ghq]` section in `.gitconfig` stays,
since both tools depend on it. Nothing in the hub or the agent skills calls
ghq; the hub's tooling audit requires repot, not ghq.
