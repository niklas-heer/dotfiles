+++
schema_version = 1
id = "01M2XHZ9DFA6HM1TJXW69S9PM3"
title = "Keep the Jev API key in a boot-scoped capture session"
date = "2026-09-19"
status = "accepted"
tags = ["ai"]
supersedes = []
superseded_by = []
depends_on = []
related_to = []
+++
* **Status**: ✅ Adopted
* **Decision**: I will keep the TypeSafe credential in 1Password, resolve it only when starting the hub's capture-gate session, and reuse it in that process until stopped or rebooted.
* **Context**: Niklas requested a fast Jev assessment of candidate facts and decisions without repeated credential retrieval. Environment variables belong to processes; a temp file does not provide that lifetime.
* **Consequences**: Mise receives only `TYPESAFE_API_KEY_REF` from a managed configuration fragment. The actual key stays in the session process environment; the temporary directory contains a private socket and lock. The capture skill can consult the active session, while note verification and writes remain with the agent. The 0.85 threshold is provisional and the initial live examples were conservative; the hub preserves results and limits.
Date: 2026-09-19 (derived from the commit that introduced this entry; the source record carried no date).
