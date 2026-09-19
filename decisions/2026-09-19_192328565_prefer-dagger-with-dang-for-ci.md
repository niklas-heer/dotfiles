+++
schema_version = 1
id = "01M2XHZ9DNQ501GHFWSKWFRA6X"
title = "Prefer Dagger with Dang for CI"
date = "2026-09-19"
status = "accepted"
tags = ["ci"]
supersedes = []
superseded_by = []
depends_on = []
related_to = []
+++
* **Status**: ✅ Adopted
* **Decision**: I will use Dagger with the Dang SDK as my default for CI and applicable delivery automation, keeping mise for project tool versions and local commands. Local container engines are Apple's native container tooling or Colima.
* **Context**: Explicit preference on 2026-09-19, primarily for CI. Reproducible local pipeline execution and a reusable setup workflow are the intended benefits.
* **Consequences**: The shared tooling preference and `dagger-ci` skill guide relevant CI work; this does not migrate unrelated repositories or introduce deployment stages. The hub adopts a Dang Linux pipeline and keeps native macOS coverage. Dagger versions remain project-local, and runtime compatibility must be checked for the selected engine.
Date: 2026-09-19 (derived from the commit that introduced this entry; the source record carried no date).
