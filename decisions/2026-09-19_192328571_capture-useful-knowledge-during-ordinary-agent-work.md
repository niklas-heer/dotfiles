+++
schema_version = 1
id = "01M2XHZ9DVTA1GC74DT7FMPR8A"
title = "Capture useful knowledge during ordinary agent work"
date = "2026-09-19"
status = "accepted"
tags = ["ai"]
supersedes = []
superseded_by = []
depends_on = []
related_to = []
+++
* **Status**: ✅ Adopted
* **Decision**: I will let agents capture reusable facts and accepted decisions without a separate reminder, using a shared `capture-knowledge` skill.
* **Context**: The facts garden and decision records are useful only when discoveries and choices reach them. Niklas requested automatic recognition during normal tasks.
* **Consequences**: A short shared trigger routes all five provider entry points to the skill. Records stay in their owning repository, with evidence and acceptance kept distinct; duplicate or low-value notes are skipped. Claude Code and Pi receive native skill links. Capture happens in the active task, with no background service or guarantee of model adherence.
Date: 2026-09-19 (derived from the commit that introduced this entry; the source record carried no date).
